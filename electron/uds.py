import argparse
from flask import Flask, jsonify
import logging
from flask_cors import CORS


# Uncomment imports below for real UDS connection
# from doipclient import DoIPClient
# from doipclient.connectors import DoIPClientUDSConnector
# from udsoncan.client import Client
# from udsoncan.services import ReadDataByIdentifier
# from udsoncan import AsciiCodec, Request


logger = logging.getLogger("doipclient")


# Parse command-line arguments
def parse_args():
    parser = argparse.ArgumentParser(description='UDS Connection Script')
    parser.add_argument('-i', '--ip', type=str, required=True, help='Target IP address of the car PCU')
    parser.add_argument('-l', '--la', type=str, required=True, help='Target ECU logical address (hex)')
    parser.add_argument('--test', action='store_true', help='Run in test mode with static values')
    return parser.parse_args()


args = parse_args()
ip_address = args.ip
logical_address = int(args.la, 16)


print(f"Car PCU IP:  {ip_address}")
print(f"Target Logical Address:  {hex(logical_address)}")


# Initialize Flask app
app = Flask(__name__)
CORS(app)


# Test mode: define static response values
test_values = {
    'vehicleIdentificationNumber': 'TESTVIN1234567890',
    'ecuSerialNumberDataIdentifier': 'ECUSERIAL0001',
    'systemSupplierIdentifier': 'SUPPLIERID',
    'vehicleManufacturerEcuHardwareNumber': 'HWNUMBER123',
    'manufacturerSparePartNumber': 'ooooooooooooo'
}


# If not in test mode, set up real UDS client (uncomment when needed)
if not args.test:
    # Initialize DoIP and UDS client
    # doip_client = DoIPClient(ip_address, logical_address, tcp_port=13400, udp_port=13400, protocol_version=2, client_logical_address=0x0E00)
    # conn = DoIPClientUDSConnector(doip_client)
    # print("Connected to UDS Server!!")


    # config = {
    #     'request_timeout': None,
    #     'p2_timeout': 20,
    #     'p2_star_timeout': 20,
    #     'data_identifiers': {
    #         0xF190: AsciiCodec(17),  # Vehicle Identification Number
    #         0xF18C: AsciiCodec(24),  # ECU Serial Number Data Identifier
    #         0xF18A: AsciiCodec(10),  # System Supplier Identifier
    #         0xF191: AsciiCodec(10),  # Vehicle Manufacturer ECU Hardware Number
    #         0xF187: AsciiCodec(10),  # Manufacturer Spare Part Number
    #     }
    # }
    # client = Client(conn, config=config)
    # client.open()
    pass


@app.route('/vehicle_info', methods=['GET'])
def get_vehicle_info():
    if args.test:
        # Return static test values
        return jsonify(test_values)


    # Real mode: perform UDS requests
    dids = {
        'vehicleIdentificationNumber': 0xF190,
        'ecuSerialNumberDataIdentifier': 0xF18C,
        'systemSupplierIdentifier': 0xF18A,
        'vehicleManufacturerEcuHardwareNumber': 0xF191,
        'manufacturerSparePartNumber': 0xF187,
    }
    result = {}
    # for key, did in dids.items():
    #     try:
    #         req = Request(service=ReadDataByIdentifier, data=bytes([did >> 8, did & 0xFF]))
    #         resp = client.send_request(req)
    #         if resp.positive:
    #             result[key] = resp.data.decode('ascii').rstrip('\x00')
    #         else:
    #             result[key] = f"Error: {resp.code_name}"
    #     except Exception as e:
    #         result[key] = f"Exception: {str(e)}"
    # return jsonify(result)
    return jsonify({'error': 'Real UDS mode not implemented'})


if __name__ == '__main__':
    if args.test:
        print("Running in TEST mode: returning static values")
    else:
        print("Running in REAL mode: performing UDS requests")
    app.run(host='0.0.0.0', port=5000)

