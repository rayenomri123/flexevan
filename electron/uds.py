import argparse
import logging
import time
from datetime import datetime, timezone
from flask import Flask, jsonify
from flask_cors import CORS
from doipclient import DoIPClient
from doipclient.connectors import DoIPClientUDSConnector
from udsoncan.client import Client
from udsoncan import configs, Request
from udsoncan.services import ReadDataByIdentifier
from udsoncan.exceptions import NegativeResponseException, InvalidResponseException, UnexpectedResponseException
from udsoncan import AsciiCodec

# Initialize logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("doipclient")

# Store UDS logs in memory
uds_logs = []

# Helper function to add UDS log
def add_uds_log(message, level='info'):
    # Use timezone-aware timestamp
    log = {
        'timestamp': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
        'message': message,
        'level': level  # 'info', 'error', 'warning'
    }
    uds_logs.append(log)
    # Limit log size to prevent memory issues
    if len(uds_logs) > 1000:
        uds_logs.pop(0)
    logger.log(getattr(logging, level.upper()), message)
    return log

# Parse command-line arguments
def parse_args():
    parser = argparse.ArgumentParser(description='UDS over DoIP Flask API')
    parser.add_argument('-i', '--ip', type=str, required=True, help='Target IP address of the car PCU')
    parser.add_argument('-l', '--la', type=str, required=True, help='Target ECU logical address (hex format, e.g. 0x545)')
    parser.add_argument('-p', '--port', type=int, default=5000, help='Port to run Flask server on')
    return parser.parse_args()

args = parse_args()
ip_address = args.ip
logical_address = int(args.la, 16)
flask_port = args.port

add_uds_log(f"Starting UDS server for Car PCU IP: {ip_address}, Logical Address: {hex(logical_address)}, Port: {flask_port}")

# Initialize DoIP client with retries
max_retries = 5
retry_delay = 5  # seconds

for attempt in range(max_retries):
    try:
        doip_client = DoIPClient(
            ip_address,
            logical_address,
            tcp_port=13400,
            udp_port=13400,
            protocol_version=2,
            client_logical_address=0x0E00
        )
        add_uds_log("Connected to UDS Server")
        break
    except Exception as e:
        add_uds_log(f"Connection attempt {attempt + 1} failed: {str(e)}", 'error')
        if attempt < max_retries - 1:
            add_uds_log(f"Retrying in {retry_delay} seconds...", 'info')
            time.sleep(retry_delay)
        else:
            add_uds_log(f"Failed to connect after {max_retries} attempts: {str(e)}", 'error')
            exit(1)

conn = DoIPClientUDSConnector(doip_client)

# Create and configure UDS client
def create_client(connector):
    config = dict(configs.default_client_config)
    config.update({
        'request_timeout': None,
        'p2_timeout': 20,
        'p2_star_timeout': 20,
        'data_identifiers': {
            0xF190: AsciiCodec(17),  # Vehicle Identification Number (VIN)
            0xF18C: AsciiCodec(24),  # ECU Serial Number
            0xF18A: AsciiCodec(10),  # System Supplier Identifier
            0xF191: AsciiCodec(10),  # Vehicle Manufacturer ECU Hardware Number
            0xF187: AsciiCodec(10),  # Manufacturer Spare Part Number
        }
    })
    client = Client(connector, config=config)
    try:
        client.open()
        add_uds_log("UDS client opened successfully")
    except Exception as e:
        add_uds_log(f"Failed to open UDS client: {str(e)}", 'error')
        raise
    return client

client = create_client(conn)

# Set up Flask app
app = Flask(__name__)
CORS(app)

# New endpoint to get UDS logs
@app.route('/uds_logs', methods=['GET'])
def get_uds_logs():
    return jsonify(uds_logs)

@app.route('/vehicle_info', methods=['GET'])
def get_vehicle_info():
    dids = {
        'vehicleIdentificationNumber': 0xF190,
        'ecuSerialNumberDataIdentifier': 0xF18C,
        'systemSupplierIdentifier': 0xF18A,
        'vehicleManufacturerEcuHardwareNumber': 0xF191,
        'manufacturerSparePartNumber': 0xF187,
    }
    result = {}

    for key, did in dids.items():
        try:
            req = Request(service=ReadDataByIdentifier, data=bytes([did >> 8, did & 0xFF]))
            add_uds_log(f"Sending UDS request for DID {hex(did)}")
            resp = client.send_request(req)
            if resp.positive:
                payload = resp.data[2:]
                text = payload.decode('ascii', errors='ignore').rstrip('\x00')
                result[key] = text
                add_uds_log(f"Received positive response for DID {hex(did)}: {text}")
            else:
                result[key] = f"Error: {resp.code_name}"
                add_uds_log(f"Negative response for DID {hex(did)}: {resp.code_name}", 'error')
        except (NegativeResponseException, InvalidResponseException, UnexpectedResponseException) as e:
            result[key] = f"UDS Error: {str(e)}"
            add_uds_log(f"UDS error for DID {hex(did)}: {str(e)}", 'error')
        except Exception as e:
            result[key] = f"Exception: {str(e)}"
            add_uds_log(f"General exception for DID {hex(did)}: {str(e)}", 'error')

    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=flask_port)