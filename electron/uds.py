import argparse
from doipclient import DoIPClient
from doipclient.client import Parser
from doipclient.connectors import DoIPClientUDSConnector
from doipclient.constants import TCP_DATA_UNSECURED, UDP_DISCOVERY, A_PROCESSING_TIME, LINK_LOCAL_MULTICAST_ADDRESS
from doipclient.messages import *

from udsoncan.client import Client
from udsoncan.exceptions import *
from udsoncan.services import *
from udsoncan import Response
from udsoncan import Request
from udsoncan import configs
from udsoncan import AsciiCodec
from udsoncan import DataFormatIdentifier, MemoryLocation
from udsoncan import Filesize
from udsoncan.connections import SocketConnection

import logging
import time

logger = logging.getLogger("doipclient")

# Parse command-line arguments
parser = argparse.ArgumentParser(description='UDS Connection Script')
parser.add_argument('-i', '--ip', type=str, required=True, help='Target IP address of the car PCU')
parser.add_argument('-l', '--la', type=str, required=True, help='Target ECU logical address (hex)')
args = parser.parse_args()

# Set connection parameters
ip_address = args.ip
logical_address = int(args.la, 16)  # Convert hex string to integer

print("Car PCU IP: ", ip_address)
print("Target Logical Address: ", hex(logical_address))

# Initialize DoIP client
doip_client = DoIPClient(ip_address, logical_address, tcp_port=13400, udp_port=13400, protocol_version=2, client_logical_address=0x0E00)
conn = DoIPClientUDSConnector(doip_client)

print("Connected to UDS Server!!")

config = dict(configs.default_client_config)
config['request_timeout'] = None
config['p2_timeout'] = 20
config['p2_star_timeout'] = 20
config['data_identifiers'] = {
    0xF181: AsciiCodec(8),
    0xF0F6: AsciiCodec(8),
}

def RequestServer(client, service, subFunction=None, data=None, expectedResp=None, reqDesc=""):
    try:
        if reqDesc != "":
            reqDesc = "=====> " + reqDesc
        print("\n" + reqDesc)
        req = Request(service=service, subfunction=subFunction, data=data)
        print("Request payload: ", req.get_payload().hex(" "))
        resp = client.send_request(req)
        if expectedResp is not None:
            if expectedResp != resp.get_payload().hex(" "):
                print('\x1b[1;37;41m' + "Response payload: %s - Expected Response: %s ---> Error" % (resp.get_payload().hex(" "), expectedResp) + '\x1b[0m')
            else:
                print('\x1b[1;37;42m' + "Response payload: %s ---> Success" % (resp.get_payload().hex(" ")) + '\x1b[0m')
        else:
            print('\x1b[1;37;46m' + "Response payload: %s" % (resp.get_payload().hex(" ")) + '\x1b[0m')
            print(' ')
        return resp
    except NegativeResponseException as e:
        print('\x1b[1;37;41m' + 'Server refused our request for service %s with code "%s" (0x%02x)' % (e.response.service.get_name(), e.response.code_name, e.response.code) + '\x1b[0m')
    except (InvalidResponseException, UnexpectedResponseException) as e:
        print('\x1b[1;37;41m' + 'Server sent an invalid payload : %s' % e.response.original_payload + '\x1b[0m')

def TestReadDidDataTunnel():
    print("\n\n==============DATA TUNNEL READ (0x22) TEST===============")
    print("\n\n==============DID 0xF18C / EcuSerialNumberDataIdentifier===============")
    RequestServer(client, ReadDataByIdentifier, subFunction=None, data=b'\xF1\x8C', reqDesc="Datatunnel: Read DID F18C with initial value", expectedResp="62 f1 8c 53 45 52 49 41 4c 4e 55 4d 42 45 52 00 00 00 00 00 00 00 00")
    time.sleep(1)
    print("\n\n==============DID 0xF075 / EcuTypeAndVariant===============")
    RequestServer(client, ReadDataByIdentifier, subFunction=None, data=b'\xF0\x75', reqDesc="Datatunnel: Read DID F075 with initial value", expectedResp="62 f0 75 50 43 55 2d 56 30 31 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00")
    time.sleep(1)
    print("\n\n==============DID 0xF18A / SystemSupplierIdentifier===============")
    RequestServer(client, ReadDataByIdentifier, subFunction=None, data=b'\xF1\x8A', reqDesc="Datatunnel: Read DID F18A with initial value", expectedResp="62 f1 8a 56 41 4c 45 4f 00 00 00 00 00")
    time.sleep(1)
    print("\n\n==============DID 0xF191 / VehicleManufacturerEcuHardwareNumber===============")
    RequestServer(client, ReadDataByIdentifier, subFunction=None, data=b'\xF1\x91', reqDesc="Datatunnel: Read DID F191 with initial value", expectedResp="62 f1 91 32 38 35 4a 39 32 35 35 37 52")
    time.sleep(1)
    print("\n\n==============DID 0xF187 / ManufacturerSparePartNumber===============")
    RequestServer(client, ReadDataByIdentifier, subFunction=None, data=b'\xF1\x87', reqDesc="Datatunnel: Read DID F187 with initial value", expectedResp="62 f1 87 39 38 38 4d 31 36 38 34 37 52")
    time.sleep(1)
    print("\n\n==============DID 0xF011 / IndexSrvData===============")
    RequestServer(client, ReadDataByIdentifier, subFunction=None, data=b'\xF0\x11', reqDesc="Datatunnel: Read DID F011 with initial value", expectedResp="62 f0 11 50 52 4f 54 41 53 59 4d 56 33")
    time.sleep(1)
    print("\n\n==============DID 0xF0FE / DomainDemoTopic===============")
    RequestServer(client, ReadDataByIdentifier, subFunction=None, data=b'\xF0\xFE', reqDesc="Datatunnel: Read DID F0FE with initial value", expectedResp="62 f0 fe 48 65 6c 6c 6f 20 4d 61 69 6e")
    time.sleep(1)

with Client(conn, request_timeout=None, config=config) as client:
    TestReadDidDataTunnel()