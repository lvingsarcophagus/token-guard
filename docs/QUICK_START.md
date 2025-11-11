# Token Guard - Quick Start Guide

## ✅ Setup Complete!

Your Token Guard application now has **real-time token scanning** integrated with all 4 APIs:
- ✓ Mobula API
- ✓ CoinMarketCap API  
- ✓ CoinGecko API
- ✓ GoPlus API (Security Analysis)
- ✓ Firebase Authentication & Database

## 🚀 How to Test Real-time Scanning

### 1. Start the Development Server

```powershell
pnpm dev
```

### 2. Enable Firebase Authentication

**IMPORTANT:** Before testing, you need to enable Email/Password authentication:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **token-guard-91e5b**
3. Click **Authentication** in the left sidebar
4. Click **Sign-in method** tab
5. Enable **Email/Password**
6. Click **Save**

### 3. Test the Application

#### Option A: Use the Debug Page (Recommended)
1. Navigate to `http://localhost:3000/debug`
2. Click "Test All APIs (Real-time)" button
3. View results for each API

#### Option B: Use the Dashboard
1. Create an account at `http://localhost:3000/signup`
2. Go to Dashboard
3. Toggle the mode from "Dummy" to "Realtime"
4. Try scanning a token:
   - **By Address**: `0xdac17f958d2ee523a2206206994597c13d831ec7` (USDT)
   - **By Symbol**: `BTC`, `ETH`, `USDT`

## 📊 What Each API Does

### Mobula API
- **Purpose**: Real-time token price data and market information
- **Provides**: Price, Market Cap, Volume, 24h Changes
- **Best for**: Token addresses and market data

### CoinGecko API
- **Purpose**: Cryptocurrency price and market data
- **Provides**: Price, Market Cap, Volume, 24h Changes
- **Best for**: Popular token symbols (BTC, ETH, etc.)

### CoinMarketCap API
- **Purpose**: Comprehensive cryptocurrency data
- **Provides**: Price, Market Cap, Volume, 24h Changes
- **Best for**: Symbol-based lookups

### GoPlus API
- **Purpose**: Security analysis and token safety checks
- **Provides**: Honeypot detection, Contract risks, Tax analysis
- **Best for**: Smart contract security audits
- **Note**: Works with contract addresses only

## 🔄 How Token Scanning Works

When you search for a token:

1. **System auto-detects** chain from address format:
   - `0x...` addresses = EVM chains (Ethereum, BSC, Polygon, etc.)
   - Base58 addresses (32-44 chars) = Solana
   - Symbols (BTC, ETH, SOL) = Default to Ethereum
2. **Price Data**: Tries Mobula → CoinGecko → CoinMarketCap (in order)
   - Works for **all chains** (Ethereum, Solana, etc.)
3. **Security Data**: If EVM address, scans with GoPlus API
   - **EVM chains only** (Ethereum, BSC, Polygon, Arbitrum, Optimism, Base)
   - **Solana and non-EVM chains**: Shows warning that security analysis is not available
4. **Results** are combined and displayed with:
   - Current price and market data
   - 24h price changes
   - Security risk score (0-100) - **EVM only**
   - Safety checks (Honeypot, Ownership, Taxes, etc.) - **EVM only**
   - Detected issues and warnings - **EVM only**

## 🧪 Test Examples

### Test with Popular Tokens
```
Symbol: BTC
Symbol: ETH  
Symbol: USDT
```

### Test with Contract Addresses

**Ethereum (Full Security Analysis):**
```
USDT: 0xdac17f958d2ee523a2206206994597c13d831ec7
USDC: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
DAI: 0x6b175474e89094c44da98b954eedeac495271d0f
```

**Solana (Price Data Only):**
```
USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
SOL: So11111111111111111111111111111111111111112
```

## 🎯 Features

### Real-time Scanning (Always On)
- Live API calls to all services
- Real security analysis (EVM chains only)
- Actual market data (all chains)
- Complete token scanning
- Automatic chain detection

### Chain Support
- **EVM Chains**: Full support (price + security analysis)
  - Ethereum, BSC, Polygon, Arbitrum, Optimism, Base
- **Solana**: Price data only (security analysis not available)
- **Other Chains**: Price data via Mobula (when available)

## 🔧 Troubleshooting

### "Token not found"
- Try using the full contract address instead of symbol
- Ensure the token exists on Ethereum mainnet (chain ID: 1)

### "API Error"
- Check your internet connection
- Verify API keys are set in `.env.local`
- Some free tier APIs have rate limits

### Firebase Auth Error
- Make sure Email/Password is enabled in Firebase Console
- Check that your `.env.local` has the correct Firebase config

## 📁 Key Files

- `/app/api/token/price/route.ts` - Price data API endpoint
- `/app/api/token/analyze/route.ts` - Security analysis endpoint
- `/lib/token-scan-service.ts` - Main scanning service
- `/lib/api-services.ts` - Individual API integrations
- `/components/token-search.tsx` - Search component
- `/components/token-analysis.tsx` - Results display

## 🎨 Mode Toggle

The mode toggle in the dashboard switches between:
- **Dummy Mode**: Fast, simulated data for testing
- **Realtime Mode**: Live API calls with real data

## 💡 Pro Tips

1. **Use addresses for full analysis**: Contract addresses get both price AND security data
2. **Symbols for quick price checks**: Faster but security analysis not available
3. **Check the debug page**: Great for testing all APIs at once
4. **Watch for rate limits**: Free tier APIs may limit requests

## Next Steps

1. Enable Firebase Authentication ✓
2. Test with the debug page
3. Create an account
4. Try scanning different tokens
5. Toggle between dummy and realtime modes
6. Check the security analysis features

Enjoy your fully functional token scanning application! 🚀
