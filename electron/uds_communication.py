import argparse
import json
import logging
from doipclient import DoIPClient
from doipclient.connectors import DoIPClientUDSConnector
from udsoncan.client import Client
from udsoncan.services import ReadDataByIdentifier
from udsoncan import AsciiCodec
import sys

logger = logging.getLogger("doipclient")

def setup_doip_client(ip, logical_address, tcp_port=13400, udp_port=13400, client_logical_address=0x0E00):
    """Initialize DoIP client and UDS connector."""
    doip_client = DoIPClient(
        ip,
        logical_address,
        tcp_port=tcp_port,
        udp_port=udp_port,
        protocol_version=2,
        client_logical_address=client_logical_address
    )
    return DoIPClientUDSConnector(doip_client)

def configure_uds_client(conn):
    """Configure UDS client with default settings."""
    config = {
        'request_timeout': None,
        'p2_timeout': 20,
        'p2_star_timeout': 20,
        'data_identifiers': {
            0xF181: AsciiCodec(8),
            0xF0F6: AsciiCodec(8),
        }
    }
    return Client(conn, request_timeout=None, config=config)

def read_did(client, did, description):
    """Read a specific Data Identifier (DID)."""
    try:
        req = ReadDataByIdentifier.Request(did=did)
        resp = client.send_request(req)
        return {
            "status": "success",
            "did": hex(did),
            "description": description,
            "payload": resp.get_payload().hex(" ")
        }
    except Exception as e:
        return {
            "status": "error",
            "did": hex(did),
            "description": description,
            "error": str(e)
        }

def main():
    parser = argparse.ArgumentParser(description='UDS over DoIP Communication')
    parser.add_argument('--ip', type=str, default='192.168.11.99', help='Target IP address')
    parser.add_argument('--la', type=str, default='0x0501', help='Target ECU logical address')
    args = parser.parse_args()

    # Setup DoIP and UDS client
    conn = setup_doip_client(args.ip, int(args.la, 16))
    client = configure_uds_client(conn)

    # Define DIDs to read
    dids = [
        (0xF18C, "EcuSerialNumberDataIdentifier"),
        (0xF075, "EcuTypeAndVariant"),
        (0xF18A, "SystemSupplierIdentifier"),
        (0xF191, "VehicleManufacturerEcuHardwareNumber"),
        (0xF187, "ManufacturerSparePartNumber"),
        (0xF011, "IndexSrvData"),
        (0xF0FE, "DomainDemoTopic"),
    ]

    results = []
    with client:
        for did, desc in dids:
            result = read_did(client, did, desc)
            results.append(result)

    # Output results as JSON
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()