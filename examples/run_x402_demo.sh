#!/bin/bash
# x402 Demo Test Runner
# 
# This script coordinates the x402 server and client for demo testing.
#
# Test 1: Same-chain (ARC → ARC)
# Test 2: Cross-chain failure (ARC → BASE) - expected to fail
# Test 3: Create ETH wallet and test CCTP (ETH → BASE)

set -e

cd "$(dirname "$0")/.."

echo "======================================================================"
echo "x402 Demo Test Suite"
echo "======================================================================"
echo""

# Wallet IDs (from demo_wallets.txt)
AGENT_ARC="1c111395-984e-530d-a936-342053146971"
SELLER_ARC="0xcf6d7024cc6754fdb949f0c394903f8306d227df"
SELLER_BASE="0x569594abec36037dfa2b54ece40ca4a727b981e5"

echo "📋 Test Configuration:"
echo "   Agent Wallet (ARC-TESTNET): $AGENT_ARC"
echo "   Seller Address (ARC-TESTNET): $SELLER_ARC"
echo "   Seller Address (BASE-SEPOLIA): $SELLER_BASE"
echo ""

# Test 1: Same-chain (ARC → ARC)
echo "======================================================================"
echo "TEST 1: Same-Chain Payment (ARC-TESTNET → ARC-TESTNET)"
echo "======================================================================"
echo "Starting x402 server on port 8402..."
echo "Network: arc-testnet"
echo "Payment Address: $SELLER_ARC"
echo ""

# Start server in background
uv run python examples/x402_server_demo.py --network arc-testnet --address $SELLER_ARC &
SERVER_PID=$!

# Wait for server to start
sleep 2

echo "Running client..."
uv run python examples/x402_client_demo.py

# Stop server
kill $SERVER_PID 2>/dev/null || true
sleep 1

echo ""
echo "======================================================================"
echo "TEST 2: Cross-Chain Payment (ARC-TESTNET → BASE-SEPOLIA)"
echo "======================================================================"
echo "⚠️  This test is EXPECTED TO FAIL because Circle doesn't support CCTP on ARC yet"
echo ""
echo "Starting x402 server on port 8402..."
echo "Network: base-sepolia"
echo "Payment Address: $SELLER_BASE"
echo ""

# Start server in background
uv run python examples/x402_server_demo.py --network base-sepolia --address $SELLER_BASE &
SERVER_PID=$!

# Wait for server to start
sleep 2

echo "Running client..."
uv run python examples/x402_client_demo.py

# Stop server
kill $SERVER_PID 2>/dev/null || true

echo ""
echo "======================================================================"
echo "✅ Demo Tests Complete!"
echo "======================================================================"
echo ""
echo "📊 Results Summary:"
echo "   Test 1 (Same-chain): Should SUCCEED"
echo "   Test 2 (Cross-chain ARC→BASE): Should FAIL (ARC CCTP not supported)"
echo ""
echo "💡 Next Steps:"
echo "   - Create ETH-SEPOLIA wallet for buyer"
echo "   - Fund it with USDC"
echo "   - Test ETH-SEPOLIA → BASE-SEPOLIA (should work via CCTP)"
