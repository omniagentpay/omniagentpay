"""
x402 Server - Updated for Demo Testing

This server simulates a premium content endpoint that requires payment.
It supports both same-chain and cross-chain payments.

Usage:
    python x402_server_demo.py --network arc-testnet --address 0xcf6d7024cc6754fdb949f0c394903f8306d227df
"""
import argparse
import base64
import http.server
import json
import socketserver

PORT = 8402


class X402Handler(http.server.SimpleHTTPRequestHandler):
    # Class variables (will be set from command line args)
    payment_address = None
    network = None
    
    def do_GET(self):
        if self.path == "/premium":
            self.handle_premium()
        else:
            self.send_error(404, "Not Found")

    def handle_premium(self):
        # Check for V2 Header
        sig_header = self.headers.get("PAYMENT-SIGNATURE")

        if sig_header:
            print(f"[Server] Received PAYMENT-SIGNATURE: {sig_header[:30]}...")
            try:
                # Basic decoding to verify structure
                decoded_json = base64.b64decode(sig_header).decode()
                payload = json.loads(decoded_json)

                # Verify payload structure (mock verification)
                if payload.get("x402Version") == 2 and "transactionHash" in payload.get(
                    "payload", {}
                ):
                    tx_hash = payload['payload']['transactionHash']
                    from_addr = payload['payload'].get('fromAddress', 'N/A')
                    to_addr = payload['payload'].get('toAddress', 'N/A')
                    amount = payload['payload'].get('amount', 'N/A')
                    
                    print(f"[Server] ✅ Valid Payment!")
                    print(f"          Tx Hash: {tx_hash}")
                    print(f"          From: {from_addr}")
                    print(f"          To: {to_addr}")
                    print(f"          Amount: {amount} USDC")

                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("PAYMENT-RESPONSE", "authenticated")
                    self.end_headers()

                    response = {
                        "data": "🎉 PREMIUM DATA UNLOCKED! You have access to exclusive content.",
                        "status": "paid",
                        "transaction": tx_hash
                    }
                    self.wfile.write(json.dumps(response).encode())
                    return
                else:
                    print("[Server] Invalid Signature Payload")
            except Exception as e:
                print(f"[Server] Signature Decode Error: {e}")

        # Default: 402 Payment Required
        print(f"[Server] 📬 Sending 402 Payment Required")
        print(f"          Network: {self.network}")
        print(f"          Address: {self.payment_address}")
        
        self.send_response(402)
        self.send_header("Content-Type", "application/json")
        self.end_headers()

        requirements = {
            "requirements": {
                "scheme": "exact",
                "network": self.network,
                "amount": "100000",  # 0.1 USDC (6 decimals)
                "token": "USDC",
                "paymentAddress": self.payment_address,
                "resource": f"http://localhost:{PORT}/premium",
                "description": f"Access to premium content (Network: {self.network})",
            }
        }
        self.wfile.write(json.dumps(requirements).encode())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="x402 Demo Server")
    parser.add_argument("--network", required=True, help="Network (e.g., arc-testnet, base-sepolia)")
    parser.add_argument("--address", required=True, help="Payment recipient address")
    
    args = parser.parse_args()
    
    # Set class variables
    X402Handler.payment_address = args.address
    X402Handler.network = args.network

    # Allow address reuse to avoid "Address already in use" during quick restarts
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), X402Handler) as httpd:
        print("=" * 60)
        print(f"🚀 x402 Server Running on Port {PORT}")
        print("=" * 60)
        print(f"Network: {args.network}")
        print(f"Payment Address: {args.address}")
        print(f"Test URL: http://localhost:{PORT}/premium")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Shutting down...")
            httpd.server_close()
