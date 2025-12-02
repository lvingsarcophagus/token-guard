# x402 Payment System - Complete Technical Documentation

**Last Updated**: December 1, 2025  
**Version**: 2.0  
**Status**: Production Ready (Testnet & Mainnet)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Payment Flow](#payment-flow)
5. [Currency Conversion](#currency-conversion)
6. [Network Detection](#network-detection)
7. [Transaction Verification](#transaction-verification)
8. [Troubleshooting](#troubleshooting)
9. [Testing Guide](#testing-guide)

---

## 1. Overview

### 1.1 What is x402?

The x402 protocol is a payment standard that enables micropayments for API endpoints using cryptocurrency. It implements HTTP 402 (Payment Required) status code with blockchain payment verification.

### 1.2 Supported Assets

- **SOL** (Solana native token) - Testnet & Mainnet
- **USDC** (USD Coin on Solana) - Mainnet only

### 1.3 Key Features

- ✅ Automatic testnet/mainnet detection
- ✅ Real-time wallet balance checking
- ✅ EUR to crypto conversion
- ✅ Transaction verification with retries
- ✅ Phantom wallet integration
- ✅ Admin configuration panel
- ✅ Separate recipient addresses for SOL/USDC

---

## 2. Architecture

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                           │
│  • Payment Confirmation Modal                                │
│  • Transaction Loading Modal                                 │
│  • Wallet Balance Detection                                  │
│  • useX402Payment Hook                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   MIDDLEWARE LAYER                           │
│  • withX402Payment() wrapper                                 │
│  • Payment verification logic                                │
│  • Network detection (testnet/mainnet)                       │
│  • Transaction confirmation                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND LAYER                              │
│  • /api/credits/add - Credit purchase endpoint               │
│  • /api/payment-config - Public config endpoint              │
│  • /api/admin/x402-settings - Admin settings                 │
│  • Firestore: admin_settings/x402                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   BLOCKCHAIN LAYER                           │
│  • Solana Devnet RPC (testnet)                               │
│  • Helius RPC (mainnet)                                      │
│  • Phantom Wallet                                            │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 File Structure

```
lib/
├── middleware/
│   └── x402.ts                    # Core x402 middleware
hooks/
└── use-x402-payment.tsx           # React hook for payments
components/
├── payment-confirmation-modal.tsx # Payment UI
└── transaction-loading-modal.tsx  # Loading states
app/
├── api/
│   ├── credits/
│   │   └── add/route.ts          # Credit purchase endpoint
│   ├── payment-config/route.ts   # Public config endpoint
│   └── admin/
│       └── x402-settings/route.ts # Admin settings
└── pay-per-scan/page.tsx         # Payment UI page
scripts/
└── init-x402-settings.js         # Settings initialization
```

---

## 3. Configuration

### 3.1 Environment Variables

**File**: `.env.local`

```bash
# x402 Payment Protocol
X402_RECIPIENT_ADDRESS=<your-wallet-address>
X402_SOL_RECIPIENT_ADDRESS=<your-wallet-address>
X402_USDC_RECIPIENT_ADDRESS=<your-wallet-address>
X402_USE_TESTNET=true  # Set to false for mainnet

# Helius API (for mainnet)
HELIUS_API_KEY=<your-helius-api-key>
```

### 3.2 Firestore Configuration

**Collection**: `admin_settings`  
**Document**: `x402`

```typescript
interface X402Settings {
  recipientAddress: string        // Legacy field
  solRecipientAddress: string     // SOL payments
  usdcRecipientAddress: string    // USDC payments
  useTestnet: boolean             // Network mode
  price: string                   // Default price (e.g., "29.00")
  asset: 'SOL' | 'USDC'          // Default asset
  updatedAt: Timestamp
  updatedBy: string
}
```

### 3.3 Initialize Settings

Run the initialization script to set up Firestore:

```bash
node scripts/init-x402-settings.js
```

**Output**:
```
🔧 Initializing x402 settings...
   Recipient Address: UpBuwdHP6en13y8HW9en9rHAVxLNU8X4MNgKtgH4FUS
   SOL Address: UpBuwdHP6en13y8HW9en9rHAVxLNU8X4MNgKtgH4FUS
   USDC Address: UpBuwdHP6en13y8HW9en9rHAVxLNU8X4MNgKtgH4FUS
   Testnet Mode: true
✅ x402 settings initialized successfully!
```

### 3.4 Admin Panel Configuration

Navigate to `/admin/dashboard` → Payments section → Click "CONFIGURE"

**Options**:
- **Payment Asset**: SOL (Testnet) or USDC (Mainnet)
- **Price Amount**: Default subscription price
- **Network Mode**: Automatically switches based on asset selection

---

## 4. Payment Flow

### 4.1 Complete Flow Diagram

```
User Selects Amount (e.g., 1 EUR)
        ↓
Frontend: Calculate Crypto Amount
  • 1 EUR × 1.09 = 1.09 USD
  • 1.09 USD ÷ 140 SOL/USD = 0.007786 SOL
        ↓
User Clicks "PAY"
        ↓
Frontend: Call /api/credits/add
  • Headers: Authorization, X-Payment-Asset: SOL
  • Body: { amount: 1, credits: 10 }
        ↓
Backend: Convert EUR to Crypto
  • Fetch x402 settings from Firestore
  • Calculate: cryptoAmount = (amount × EUR_TO_USD) / SOL_PRICE_USD
  • Create x402Config with cryptoAmount
        ↓
Backend: Return 402 Payment Required
  • Headers: X-Payment-Price, X-Payment-Asset, X-Payment-Address
  • Body: { payment: { price, asset, chain, address, nonce } }
        ↓
Frontend: useX402Payment Hook Intercepts
        ↓
Check Wallet Balance
  • Fetch testnet mode from /api/payment-config
  • Connect to appropriate RPC (devnet/mainnet)
  • Query SOL balance via connection.getBalance()
  • Query USDC balance via getAccount() (mainnet only)
        ↓
Show Payment Confirmation Modal
  • Display: "PAYMENT AMOUNT: 0.007786 SOL"
  • Display: "YOUR SOL BALANCE: 4.9998 SOL"
  • Display: "✓ Sufficient SOL balance available"
  • User selects asset (SOL/USDC)
        ↓
User Clicks "CONFIRM PAYMENT"
        ↓
Execute Payment Transaction
  • Fetch testnet mode from /api/payment-config
  • Connect to appropriate RPC
  • Create Solana transaction:
    - SystemProgram.transfer() for SOL
    - createTransferInstruction() for USDC
  • Get recent blockhash
  • Sign transaction via Phantom
  • Send transaction to blockchain
  • Wait for confirmation
        ↓
Show Transaction Loading Modal
  • Status: "Connecting to wallet..."
  • Status: "Awaiting signature..."
  • Status: "Confirming transaction..."
  • Status: "Success!"
        ↓
Retry API Request with Payment Proof
  • Headers: X-Payment-TxHash, X-Payment-Nonce
  • Backend verifies transaction
        ↓
Backend: Verify Transaction
  • Fetch testnet mode from Firestore
  • Connect to appropriate RPC
  • For testnet: Retry 5 times with 3-second delays
  • For mainnet: Use Helius Enhanced Transactions API
  • Verify recipient and amount match
        ↓
Backend: Add Credits
  • Update user document: credits += amount × 10
  • Log transaction in credit_transactions
  • Log activity in activity_logs
        ↓
Frontend: Show Success
  • Toast: "Successfully added 10 credits!"
  • Reload page to refresh balance
```

### 4.2 Code Example

**Frontend** (`app/pay-per-scan/page.tsx`):
```typescript
const handlePurchase = async () => {
  const amount = 1 // EUR
  const credits = amount * 10
  
  const token = await user?.getIdToken()
  
  const result = await fetchWithPayment('/api/credits/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Payment-Asset': 'SOL',
    },
    body: JSON.stringify({ amount, credits })
  })
  
  toast.success(`Successfully added ${credits} credits!`)
}
```

**Backend** (`app/api/credits/add/route.ts`):
```typescript
export async function POST(request: NextRequest) {
  const body = await request.clone().json()
  const { amount } = body
  const selectedAsset = request.headers.get('X-Payment-Asset') || 'USDC'
  
  // Convert EUR to crypto
  const EUR_TO_USD = 1.09
  const SOL_PRICE_USD = 140
  const usdAmount = amount * EUR_TO_USD
  const cryptoAmount = usdAmount / SOL_PRICE_USD
  
  // Get recipient address
  const db = getAdminDb()
  const settings = await db.collection('admin_settings').doc('x402').get()
  const recipientAddress = selectedAsset === 'SOL' 
    ? settings.data()?.solRecipientAddress 
    : settings.data()?.usdcRecipientAddress
  
  // Create x402 config
  const x402Config = {
    endpoint: '/api/credits/add',
    price: cryptoAmount.toFixed(6),
    asset: selectedAsset,
    chain: 'solana' as const,
    recipientAddress
  }
  
  // Wrap with x402 middleware
  const handler = withX402Payment(x402Config, handleAddCredits)
  return handler(request)
}
```

---

## 5. Currency Conversion

### 5.1 Conversion Logic

**EUR → USD → Crypto**

```typescript
// Constants (should be fetched from API in production)
const EUR_TO_USD = 1.09
const SOL_PRICE_USD = 140
const USDC_PRICE_USD = 1

// Conversion
const eurAmount = 1
const usdAmount = eurAmount * EUR_TO_USD  // 1.09 USD
const cryptoAmount = usdAmount / SOL_PRICE_USD  // 0.007786 SOL
```

### 5.2 Price Precision

- **SOL**: 6 decimal places (e.g., `0.007786`)
- **USDC**: 2 decimal places (e.g., `1.09`)

### 5.3 Real-Time Price Fetching (Future Enhancement)

```typescript
// TODO: Implement real-time price fetching
async function getCryptoPrices() {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
  const data = await response.json()
  return {
    sol: data.solana.usd,
    usdc: 1
  }
}
```

---

## 6. Network Detection

### 6.1 Testnet vs Mainnet

**Configuration Source**: Firestore `admin_settings/x402`

**Public Endpoint**: `/api/payment-config/route.ts`

```typescript
export async function GET() {
  const db = getAdminDb()
  const settingsDoc = await db.collection('admin_settings').doc('x402').get()
  const settings = settingsDoc.data()
  
  const useTestnet = settings?.useTestnet ?? (process.env.X402_USE_TESTNET === 'true')
  
  return NextResponse.json({ useTestnet, chain: 'solana' })
}
```

### 6.2 RPC Endpoints

**Testnet (Devnet)**:
```typescript
const rpcUrl = 'https://api.devnet.solana.com'
```

**Mainnet**:
```typescript
const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
```

### 6.3 Balance Checking

**Frontend** (`hooks/use-x402-payment.tsx`):
```typescript
async function checkBalances(payment: PaymentInfo) {
  // Fetch testnet mode
  const settingsResponse = await fetch('/api/payment-config')
  const { useTestnet } = await settingsResponse.json()
  
  // Connect to appropriate RPC
  const rpcUrl = useTestnet
    ? 'https://api.devnet.solana.com'
    : 'https://mainnet.helius-rpc.com/?api-key=...'
  
  const connection = new Connection(rpcUrl)
  
  // Check SOL balance
  const balance = await connection.getBalance(solana.publicKey)
  const solBalance = balance / LAMPORTS_PER_SOL
  
  // Check USDC balance (mainnet only)
  let usdcBalance = 0
  if (!useTestnet) {
    const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
    const tokenAccount = await getAssociatedTokenAddress(USDC_MINT, solana.publicKey)
    const accountInfo = await getAccount(connection, tokenAccount)
    usdcBalance = Number(accountInfo.amount) / 1e6
  }
  
  return { solBalance, usdcBalance }
}
```

### 6.4 Payment Execution

**Frontend** (`hooks/use-x402-payment.tsx`):
```typescript
async function executeSolanaPayment(payment: PaymentInfo) {
  // Fetch testnet mode
  const settingsResponse = await fetch('/api/payment-config')
  const { useTestnet } = await settingsResponse.json()
  
  // Connect to appropriate RPC
  const rpcUrl = useTestnet
    ? 'https://api.devnet.solana.com'
    : 'https://mainnet.helius-rpc.com/?api-key=...'
  
  const connection = new Connection(rpcUrl)
  
  // Create transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: solana.publicKey,
      toPubkey: new PublicKey(payment.address),
      lamports: parseFloat(payment.price) * LAMPORTS_PER_SOL,
    })
  )
  
  // Sign and send
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = solana.publicKey
  
  const signed = await solana.signTransaction(transaction)
  const signature = await connection.sendRawTransaction(signed.serialize())
  
  // Wait for confirmation
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight })
  
  return signature
}
```

---

## 7. Transaction Verification

### 7.1 Verification Flow

**Backend** (`lib/middleware/x402.ts`):
```typescript
async function verifySolanaPayment(txHash: string, config: X402Config) {
  // Fetch testnet mode from Firestore
  const { getAdminDb } = await import('@/lib/firebase-admin')
  const db = getAdminDb()
  const settingsDoc = await db.collection('admin_settings').doc('x402').get()
  const isTestnet = settingsDoc.data()?.useTestnet || false
  
  if (isTestnet) {
    return verifyDevnetTransaction(txHash, config)
  } else {
    return verifyMainnetTransaction(txHash, config)
  }
}
```

### 7.2 Devnet Verification

**Retry Logic**: 5 attempts with 3-second delays (15 seconds total)

```typescript
async function verifyDevnetTransaction(txHash: string, config: X402Config) {
  const rpcUrl = 'https://api.devnet.solana.com'
  
  for (let attempt = 1; attempt <= 5; attempt++) {
    console.log(`[x402] Attempt ${attempt}/5 - waiting 3 seconds...`)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [txHash, { encoding: 'json', maxSupportedTransactionVersion: 0 }]
      }),
    })
    
    const data = await response.json()
    
    if (data.result) {
      console.log('[x402] TESTNET transaction confirmed')
      return { valid: true, txHash }
    }
  }
  
  return { valid: false, error: 'Transaction not confirmed yet' }
}
```

### 7.3 Mainnet Verification

**Uses Helius Enhanced Transactions API**:

```typescript
async function verifyMainnetTransaction(txHash: string, config: X402Config) {
  const heliusEndpoint = `https://api.helius.xyz/v0/transactions/?api-key=${HELIUS_API_KEY}`
  
  // Wait 2 seconds for transaction to propagate
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const response = await fetch(heliusEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions: [txHash] }),
  })
  
  const data = await response.json()
  const tx = Array.isArray(data) ? data[0] : data
  
  if (!tx) {
    return { valid: false, error: 'Transaction not found' }
  }
  
  // Verify native SOL transfers
  const nativeTransfers = tx.nativeTransfers || []
  for (const transfer of nativeTransfers) {
    if (
      transfer.toUserAccount.toLowerCase() === config.recipientAddress.toLowerCase() &&
      transfer.amount >= parseFloat(config.price) * 1e9
    ) {
      return { valid: true, txHash }
    }
  }
  
  // Verify USDC transfers
  const tokenTransfers = tx.tokenTransfers || []
  for (const transfer of tokenTransfers) {
    if (
      transfer.toUserAccount.toLowerCase() === config.recipientAddress.toLowerCase() &&
      transfer.tokenAmount >= parseFloat(config.price) * 1e6
    ) {
      return { valid: true, txHash }
    }
  }
  
  return { valid: false, error: 'Payment amount or recipient mismatch' }
}
```

---

## 8. Troubleshooting

### 8.1 Common Issues

#### Issue 1: "SOL recipient address not configured"

**Cause**: Firestore settings not initialized

**Solution**:
```bash
node scripts/init-x402-settings.js
```

#### Issue 2: "Wallet balance shows 0 SOL"

**Causes**:
1. Phantom not connected to correct network
2. RPC endpoint mismatch

**Solutions**:
1. Check Phantom: Settings → Developer Settings → Change Network → Devnet
2. Verify testnet mode: Check `/api/payment-config` response
3. Check browser console for RPC logs

#### Issue 3: "Transaction simulation failed"

**Causes**:
1. Insufficient SOL for transaction fees
2. Recipient address doesn't exist on devnet

**Solutions**:
1. Get devnet SOL: https://faucet.solana.com
2. Send a small amount to recipient address first to initialize it

#### Issue 4: "Payment verification failed"

**Causes**:
1. Transaction not confirmed yet
2. Wrong network (mainnet tx on devnet verification)

**Solutions**:
1. Wait 15 seconds and retry
2. Verify testnet mode matches Phantom network
3. Check transaction on Solscan:
   - Devnet: https://solscan.io/tx/{txHash}?cluster=devnet
   - Mainnet: https://solscan.io/tx/{txHash}

#### Issue 5: "Showing 1.09 SOL instead of 0.007786 SOL"

**Cause**: Currency conversion not working

**Solution**: Check backend logs for conversion calculation:
```
[Credits Add] Conversion: {
  eurAmount: 1,
  usdAmount: 1.09,
  cryptoAmount: 0.007786,
  asset: 'SOL'
}
```

### 8.2 Debug Checklist

**Frontend**:
- [ ] Check browser console for balance check logs
- [ ] Verify Phantom is connected to correct network
- [ ] Check payment confirmation modal shows correct amount
- [ ] Verify transaction loading modal progresses through states

**Backend**:
- [ ] Check server logs for conversion calculation
- [ ] Verify x402 config has correct price
- [ ] Check Firestore settings document exists
- [ ] Verify recipient addresses are set

**Blockchain**:
- [ ] Check transaction on Solscan
- [ ] Verify recipient address has received funds
- [ ] Check wallet balance before/after transaction

---

## 9. Testing Guide

### 9.1 Testnet Testing

**Prerequisites**:
1. Phantom wallet installed
2. Phantom connected to Devnet
3. Devnet SOL in wallet (get from https://faucet.solana.com)

**Steps**:
1. Set `X402_USE_TESTNET=true` in `.env.local`
2. Run `node scripts/init-x402-settings.js`
3. Start dev server: `pnpm dev`
4. Navigate to `/pay-per-scan`
5. Enter amount (e.g., 0.1 EUR)
6. Click "PAY"
7. Verify modal shows correct SOL amount
8. Confirm payment in Phantom
9. Wait for confirmation
10. Verify credits added

**Expected Results**:
- Balance check shows devnet SOL
- Payment amount is small (e.g., 0.000778 SOL for 0.1 EUR)
- Transaction confirms within 15 seconds
- Credits added to account

### 9.2 Mainnet Testing

**Prerequisites**:
1. Phantom wallet with real SOL or USDC
2. Phantom connected to Mainnet
3. Helius API key configured

**Steps**:
1. Set `X402_USE_TESTNET=false` in `.env.local`
2. Run `node scripts/init-x402-settings.js`
3. Start dev server
4. Navigate to `/pay-per-scan`
5. Enter amount
6. Select USDC or SOL
7. Confirm payment
8. Verify transaction on Solscan mainnet

**Expected Results**:
- Balance check shows mainnet SOL/USDC
- Payment amount matches real prices
- Transaction confirms within 5 seconds
- Credits added to account

### 9.3 Admin Panel Testing

**Steps**:
1. Login as admin
2. Navigate to `/admin/dashboard`
3. Click "Payments" tab
4. Click "CONFIGURE"
5. Toggle between SOL (Testnet) and USDC (Mainnet)
6. Update price
7. Save changes
8. Verify settings in Firestore

---

## 10. Production Deployment

### 10.1 Pre-Deployment Checklist

- [ ] Set `X402_USE_TESTNET=false`
- [ ] Configure mainnet recipient addresses
- [ ] Add Helius API key
- [ ] Test with small real transaction
- [ ] Verify Firestore security rules
- [ ] Enable transaction logging
- [ ] Set up monitoring alerts

### 10.2 Monitoring

**Key Metrics**:
- Payment success rate
- Average confirmation time
- Failed transaction reasons
- Revenue tracking

**Firestore Queries**:
```typescript
// Get recent payments
const payments = await db.collection('credit_transactions')
  .where('status', '==', 'completed')
  .orderBy('createdAt', 'desc')
  .limit(50)
  .get()

// Get failed payments
const failed = await db.collection('credit_transactions')
  .where('status', '==', 'failed')
  .orderBy('createdAt', 'desc')
  .get()
```

### 10.3 Security Considerations

1. **Recipient Address**: Store in Firestore, not in code
2. **API Keys**: Use environment variables
3. **Transaction Verification**: Always verify on-chain
4. **Rate Limiting**: Implement per-user limits
5. **Logging**: Log all payment attempts for audit

---

## 11. Future Enhancements

### 11.1 Planned Features

- [ ] Real-time crypto price fetching
- [ ] Multiple payment currencies (ETH, MATIC, etc.)
- [ ] Subscription management
- [ ] Refund system
- [ ] Payment analytics dashboard
- [ ] Webhook notifications
- [ ] Invoice generation

### 11.2 Optimization Opportunities

- [ ] Cache crypto prices (5-minute TTL)
- [ ] Batch transaction verification
- [ ] Implement payment queue for high volume
- [ ] Add payment retry logic
- [ ] Optimize RPC calls

---

## Appendix

### A. API Reference

#### POST /api/credits/add
**Purpose**: Purchase credits via x402 payment

**Headers**:
- `Authorization`: Bearer {firebase-token}
- `X-Payment-Asset`: SOL | USDC
- `X-Payment-TxHash`: {transaction-hash} (on retry)
- `X-Payment-Nonce`: {payment-nonce} (on retry)

**Body**:
```json
{
  "amount": 1,
  "credits": 10,
  "transactionId": "credit-purchase-1234567890"
}
```

**Response (402)**:
```json
{
  "error": "Payment Required",
  "message": "This endpoint requires payment of 0.007786 SOL on solana",
  "payment": {
    "price": "0.007786",
    "asset": "SOL",
    "chain": "solana",
    "address": "UpBuwdHP6en13y8HW9en9rHAVxLNU8X4MNgKtgH4FUS",
    "nonce": "1733097600000-abc123"
  }
}
```

**Response (200)**:
```json
{
  "success": true,
  "credits": 10,
  "added": 10
}
```

#### GET /api/payment-config
**Purpose**: Get public payment configuration

**Response**:
```json
{
  "useTestnet": true,
  "chain": "solana"
}
```

### B. Glossary

- **x402**: HTTP 402 Payment Required protocol
- **Devnet**: Solana test network
- **Mainnet**: Solana production network
- **Lamports**: Smallest unit of SOL (1 SOL = 1,000,000,000 lamports)
- **USDC**: USD Coin stablecoin
- **RPC**: Remote Procedure Call endpoint
- **Phantom**: Solana wallet browser extension
- **Helius**: Solana RPC provider with enhanced APIs

---

**End of Documentation**
