# CCTP Supported Networks

## Overview

Circle's Cross-Chain Transfer Protocol (CCTP) V2 supports the following networks:

## ✅ Mainnet Networks

| Network | Domain ID | CCTP Support |
|---------|-----------|--------------|
| Ethereum (ETH) | 0 | ✅ |
| Avalanche (AVAX) | 1 | ✅ |
| Optimism (OP) | 2 | ✅ |
| Arbitrum (ARB) | 3 | ✅ |
| Solana (SOL) | 5 | ✅ |
| Base (BASE) | 6 | ✅ |
| Polygon (MATIC) | 7 | ✅ |

## ✅ Testnet Networks

| Network | Domain ID | CCTP Support |
|---------|-----------|--------------|
| Ethereum Sepolia (ETH-SEPOLIA) | 0 | ✅ |
| Avalanche Fuji (AVAX-FUJI) | 1 | ✅ |
| Optimism Sepolia (OP-SEPOLIA) | 2 | ✅ |
| Arbitrum Sepolia (ARB-SEPOLIA) | 3 | ✅ |
| Solana Devnet (SOL-DEVNET) | 5 | ✅ |
| Base Sepolia (BASE-SEPOLIA) | 6 | ✅ |
| Polygon Amoy (MATIC-AMOY) | 7 | ✅ |

## ❌ Networks NOT Supported (Yet)

| Network | Status |
|---------|--------|
| ARC-TESTNET | ❌ Not supported - Circle hasn't enabled CCTP on ARC yet |
| Near (NEAR) | ❌ Not a CCTP network |
| Aptos (APTOS) | ❌ Not a CCTP network |
| Unichain (UNI) | ❌ Not a CCTP network |
| Monad (MONAD) | ❌ Not a CCTP network |

## Transfer Examples

### ✅ Valid CCTP Transfers (Work in Production)

- ETH-SEPOLIA → BASE-SEPOLIA
- BASE-SEPOLIA → ARB-SEPOLIA  
- ARB-SEPOLIA → OP-SEPOLIA
- ETH → BASE (mainnet)
- BASE → ARB (mainnet)
- Any testnet → Any other testnet (except ARC)

### ❌ Invalid CCTP Transfers

- ARC-TESTNET → BASE-SEPOLIA (ARC not supported)
- ARC-TESTNET → ETH-SEPOLIA (ARC not supported)
- NEAR → Any network (NEAR doesn't use CCTP)

## Performance

- **Fast Transfer**: ~2-5 seconds (minFinalityThreshold ≤ 1000)
- **Standard Transfer**: ~13-19 minutes (minFinalityThreshold ≥ 2000)

Our implementation uses Fast Transfer by default for the best user experience.

## Source

Contract addresses and domain IDs verified from:
- [Circle CCTP Documentation](https://developers.circle.com/cctp/references/contract-addresses)
- [Supported Chains](https://developers.circle.com/cctp/concepts/supported-chains-and-domains)
