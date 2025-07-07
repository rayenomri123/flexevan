#!/usr/bin/env python3
import argparse
import logging
import time
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

print(f"Car PCU IP: {ip_address}")
print(f"Target Logical Address: {hex(logical_address)}")
print(f"Flask Server Port: {flask_port}")

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
        print("Connected to UDS Server!!")
        break
    except Exception as e:
        if attempt < max_retries - 1:
            print(f"Connection attempt {attempt + 1} failed: {e}. Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
        else:
            print(f"Failed to connect after {max_retries} attempts: {e}")
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
    client.open()
    return client

client = create_client(conn)

# Set up Flask app
app = Flask(__name__)
CORS(app)

@app.route('/vehicle_info', methods=['GET'])
def get_vehicle_info():
    dids = {
        'vehicleIdentificationNumber': 0xF190,
        'ecuSerialNumberDataIdentifier': 0xF18C,
        'systemSupplierIdentifier': 0xF18A,
        'vehicle люблюEcuHardwareNumber': 0xF191,
        'manufacturerSparePartNumber': 0xF187,
    }
    result = {}

    for key, did in dids.items():
        try:
            req = Request(service=ReadDataByIdentifier, data=bytes([did >> 8, did & 0xFF]))
            resp = client.send_request(req)
            if resp.positive:
                payload = resp.data[2:]
                text = payload.decode('ascii', errors='ignore').rstrip('\x00')
                result[key] = text
            else:
                result[key] = f"Error: {resp.code_name}"
        except (NegativeResponseException, InvalidResponseException, UnexpectedResponseException) as e:
            result[key] = f"UDS Error: {e}"
        except Exception as e:
            result[key] = f"Exception: {e}"

    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=flask_port)