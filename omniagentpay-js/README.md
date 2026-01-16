# OmniAgentPay JS SDK

[![npm version](https://badge.fury.io/js/omniagentpay.svg)](https://badge.fury.io/js/omniagentpay)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Payment infrastructure for autonomous AI agents in Node.js/TypeScript.**

Add your Circle API key. Connect OmniAgentPay. Your JavaScript agent has everything it needs to handle payments—safely, instantly, across any chain.

```typescript
// Give any JS agent payment superpowers:
import { OmniAgentPay } from 'omniagentpay';

const client = new OmniAgentPay();  // Reads CIRCLE_API_KEY from env
const result = await client.pay({ wallet_id: "...", recipient: "0x...", amount: 10.00 });
```

---

## ⚡ Why OmniAgentPay?

| You Want To... | OmniAgentPay Does... |
|:---------------|:---------------------|
| Send USDC to an address | `pay()` → Transfer Adapter handles it |
| Pay an API that returns 402 | `pay()` → x402 Adapter negotiates, pays, retries |
| Move funds to another chain | `pay()` → Gateway Adapter uses CCTP automatically |
| Prevent overspending | Guards enforce limits atomically |
| Test without real funds | `simulate()` predicts outcomes safely |

**One method. Any payment type. All safety built-in.**

---

## 📦 Installation

```bash
npm install omniagentpay
```

The SDK automatically downloads the required binary on first install.

---

## 🚀 Quick Start

```typescript
import { OmniAgentPay, AccountType, FeeLevel } from 'omniagentpay';

const client = new OmniAgentPay();

async function main() {
    // 1. Create a Wallet
    const walletSet = await client.createWalletSet({ name: 'my-agent' });
    const wallet = await client.createWallet({
        wallet_set_id: walletSet.id,
        blockchain: 'ETH-SEPOLIA',
        account_type: AccountType.EOA
    });
    console.log('Wallet:', wallet.address);

    // 2. Check Balance
    const balance = await client.getBalance({ wallet_id: wallet.id });
    console.log('Balance:', balance, 'USDC');

    // 3. Simulate Payment (No funds required)
    const sim = await client.simulate({
        wallet_id: wallet.id,
        recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount: 10.00
    });
    console.log('Would succeed:', sim.would_succeed, 'Route:', sim.route);

    // 4. Make Payment (When funded)
    if (sim.would_succeed) {
        const result = await client.pay({
            wallet_id: wallet.id,
            recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            amount: 10.00
        });
        console.log('Payment:', result.transaction_id);
    }

    // Cleanup
    client.stop();
}

main();
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `CIRCLE_API_KEY` | Your Circle Developer Console API Key |
| `ENTITY_SECRET` | Your Entity Secret for signing transactions |
| `OMNIAGENTPAY_LOG_LEVEL` | Logging verbosity (`INFO`, `DEBUG`) |

### Constructor Options

```typescript
const client = new OmniAgentPay({
    apiKey: 'your_api_key',           // Or use CIRCLE_API_KEY env
    entitySecret: 'your_secret',      // Or use ENTITY_SECRET env
    binaryPath: '/path/to/binary'     // Optional: custom binary location
});
```

---

## 💰 The Payment API

### Single Payment

```typescript
const result = await client.pay({
    wallet_id: 'wallet-123',
    recipient: '0x...',               // Address or URL (x402)
    amount: 10.00,                    // USDC amount
    destination_chain: 'BASE',        // Optional: for cross-chain
    fee_level: FeeLevel.MEDIUM,       // Optional: LOW, MEDIUM, HIGH
    purpose: 'API subscription',      // Optional: for logging
    skip_guards: false,               // Optional: bypass guards
    wait_for_completion: true,        // Optional: wait for confirm
    metadata: { order_id: '123' }     // Optional: custom data
});

console.log(result.success);          // true/false
console.log(result.transaction_id);   // Circle transaction ID
console.log(result.method);           // 'TRANSFER', 'X402', 'CROSSCHAIN'
```

### Simulate Payment (No Funds Required)

```typescript
const sim = await client.simulate({
    wallet_id: 'wallet-123',
    recipient: '0x...',
    amount: 10.00
});

console.log(sim.would_succeed);  // true if payment would work
console.log(sim.route);          // 'TRANSFER', 'X402', or 'CROSSCHAIN'
console.log(sim.reason);         // Error reason if would fail
```

### Batch Payments

```typescript
const result = await client.batchPay({
    requests: [
        { wallet_id: 'w1', recipient: '0xA...', amount: 10 },
        { wallet_id: 'w1', recipient: '0xB...', amount: 20 },
        { wallet_id: 'w1', recipient: '0xC...', amount: 30 }
    ],
    concurrency: 5
});

console.log(`${result.succeeded}/${result.total} succeeded`);
```

### Payment Routing

```typescript
// Check if a recipient can be paid
const canPay = await client.canPay({ recipient: '0x...' });

// Detect which method would be used
const method = await client.detectMethod({ recipient: 'https://api.example.com' });
// Returns: 'TRANSFER', 'X402', or null
```

---

## 🏦 Wallet Management

### Create Wallet Set & Wallet

```typescript
// Create a wallet set (container)
const set = await client.createWalletSet({ name: 'production-agent' });

// Create a wallet in the set
const wallet = await client.createWallet({
    wallet_set_id: set.id,
    blockchain: 'ETH-SEPOLIA',
    account_type: AccountType.EOA  // or SCA for smart contract
});
```

### List & Get Wallets

```typescript
// List all wallet sets
const sets = await client.listWalletSets();

// List all wallets (optionally filter by set)
const wallets = await client.listWallets({ wallet_set_id: set.id });

// Get single wallet details
const wallet = await client.getWallet({ wallet_id: 'wallet-123' });

// Get wallet balance
const balance = await client.getBalance({ wallet_id: 'wallet-123' });
```

### List Transactions

```typescript
const transactions = await client.listTransactions({
    wallet_id: 'wallet-123',        // Optional filter
    blockchain: 'ETH-SEPOLIA'       // Optional filter
});
```

---

## 🛡️ Guard System (Safety Kernel)

Guards enforce spending policies atomically—even under concurrent load.

### Budget Guard

```typescript
// Limit spending over time
await client.addBudgetGuard({
    wallet_id: 'wallet-123',
    daily_limit: 100,         // Max $100/day
    hourly_limit: 20,         // Max $20/hour
    total_limit: 1000,        // Max $1000 lifetime
    name: 'spending-limit'
});
```

### Single Transaction Guard

```typescript
// Limit per-transaction amount
await client.addSingleTxGuard({
    wallet_id: 'wallet-123',
    max_amount: 50,           // Max $50 per transaction
    min_amount: 0.01,         // Min $0.01 (optional)
    name: 'tx-limit'
});
```

### Rate Limit Guard

```typescript
// Limit transaction frequency
await client.addRateLimitGuard({
    wallet_id: 'wallet-123',
    max_per_minute: 5,
    max_per_hour: 50,
    max_per_day: 100,
    name: 'rate-limit'
});
```

### Recipient Guard

```typescript
// Whitelist/blacklist recipients
await client.addRecipientGuard({
    wallet_id: 'wallet-123',
    mode: 'whitelist',        // 'whitelist' or 'blacklist'
    addresses: ['0xTrusted1...', '0xTrusted2...'],
    domains: ['api.trusted.com'],
    name: 'recipient-filter'
});
```

### Confirmation Guard

```typescript
// Require manual approval for large amounts
await client.addConfirmGuard({
    wallet_id: 'wallet-123',
    threshold: 100,           // Amounts > $100 need approval
    always_confirm: false,    // Or true for all transactions
    name: 'approval-required'
});
```

### Wallet Set Guards

All guards can be applied to wallet sets (applies to ALL wallets in set):

```typescript
await client.addBudgetGuardForSet({ wallet_set_id: 'set-123', ... });
await client.addRateLimitGuardForSet({ wallet_set_id: 'set-123', ... });
await client.addRecipientGuardForSet({ wallet_set_id: 'set-123', ... });
await client.addConfirmGuardForSet({ wallet_set_id: 'set-123', ... });
```

### List Guards

```typescript
const guards = await client.listGuards({ wallet_id: 'wallet-123' });
// Returns: ['spending-limit', 'tx-limit', 'rate-limit']

const setGuards = await client.listGuardsForSet({ wallet_set_id: 'set-123' });
```

---

## 🎫 Payment Intents (Auth/Capture)

For "authorize-then-capture" workflows.

```typescript
// 1. Create intent (authorize)
const intent = await client.createPaymentIntent({
    wallet_id: 'wallet-123',
    recipient: '0x...',
    amount: 50.00,
    purpose: 'Service deposit'
});
console.log('Intent ID:', intent.id);

// 2. Get intent status
const status = await client.getPaymentIntent({ intent_id: intent.id });

// 3. Either confirm (capture) or cancel
const result = await client.confirmPaymentIntent({ intent_id: intent.id });
// OR
await client.cancelPaymentIntent({ intent_id: intent.id });
```

---

## 📊 Observability

### Health Check

```typescript
const health = await client.health();
console.log(health.status);   // 'ok'
console.log(health.version);  // '0.0.1'
```

### Ledger Sync

```typescript
// Sync a ledger entry with blockchain status
const entry = await client.syncTransaction({ entry_id: 'entry-123' });
```

---

## 🧪 Testing

Run the comprehensive test suite:

```bash
cd omniagentpay-js
npm test              # Run all 30 tests
npm run test:coverage # With coverage report
```

Tests cover:
- ✅ All 31 methods verified
- ✅ Wallet operations (create, list, get, balance)
- ✅ Payment simulation (routing, balance checks)
- ✅ Guards (all 5 types, wallet + set level)
- ✅ Payment intents
- ✅ Batch payments
- ✅ Type exports

---

## 📋 Full API Reference

### Payment Methods (5)
| Method | Description |
|--------|-------------|
| `pay(params)` | Execute payment with automatic routing |
| `simulate(params)` | Simulate payment without executing |
| `canPay(params)` | Check if recipient can be paid |
| `detectMethod(params)` | Detect payment method for recipient |
| `batchPay(params)` | Execute multiple payments |

### Wallet Methods (7)
| Method | Description |
|--------|-------------|
| `createWalletSet(params)` | Create wallet container |
| `listWalletSets()` | List all wallet sets |
| `createWallet(params)` | Create new wallet |
| `listWallets(params)` | List wallets |
| `getWallet(params)` | Get wallet details |
| `getBalance(params)` | Get USDC balance |
| `listTransactions(params)` | List transactions |

### Guard Methods (12)
| Method | Description |
|--------|-------------|
| `addBudgetGuard(params)` | Add budget limits |
| `addSingleTxGuard(params)` | Add per-tx limits |
| `addRecipientGuard(params)` | Add recipient filter |
| `addRateLimitGuard(params)` | Add rate limits |
| `addConfirmGuard(params)` | Add confirmation requirement |
| `listGuards(params)` | List wallet guards |
| `addBudgetGuardForSet(params)` | Budget for set |
| `addRateLimitGuardForSet(params)` | Rate limit for set |
| `addRecipientGuardForSet(params)` | Recipients for set |
| `addConfirmGuardForSet(params)` | Confirm for set |
| `addSingleTxGuardForSet(params)` | Single tx for set |
| `listGuardsForSet(params)` | List set guards |

### Intent Methods (4)
| Method | Description |
|--------|-------------|
| `createPaymentIntent(params)` | Authorize payment |
| `getPaymentIntent(params)` | Get intent status |
| `confirmPaymentIntent(params)` | Capture payment |
| `cancelPaymentIntent(params)` | Cancel intent |

### Other (3)
| Method | Description |
|--------|-------------|
| `syncTransaction(params)` | Sync ledger entry |
| `health()` | Check service health |
| `stop()` | Stop sidecar process |

---

## 🔗 Related

- **Python SDK**: [omniagentpay](https://pypi.org/project/omniagentpay/)
- **x402 Protocol**: [x402.org](https://x402.org)
- **Circle Developer Console**: [developers.circle.com](https://developers.circle.com)

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.
