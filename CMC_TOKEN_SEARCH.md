# CoinMarketCap Token Search Integration

## Overview

We've implemented a comprehensive token search feature that uses CoinMarketCap API to resolve token names/symbols into contract addresses, which are then fed to our multi-source analysis engine (Mobula + Moralis + Helius + GoPlus).

## New Features

### 1. Token Search API (`/api/search-token`)

Two endpoints for flexible searching:

#### GET: Symbol Search (Fast)
```bash
GET /api/search-token?query=BONK
```

Returns tokens matching the symbol exactly. Best for known tickers.

#### POST: Advanced Name Search (Comprehensive)
```bash
POST /api/search-token
Content-Type: application/json

{
  "query": "dogwifhat",
  "limit": 10
}
```

Searches both name and symbol. Retrieves full contract info for each result.

### 2. React Component (`components/token-search-cmc.tsx`)

Reusable search component with:
- Real-time search input
- Loading states
- Error handling
- Result cards with token details
- Automatic address extraction
- One-click token selection

**Props:**
```typescript
interface TokenSearchProps {
  onTokenSelect: (address: string, chain: string, symbol: string, name: string) => void
}
```

### 3. Demo Page (`/token-search`)

Interactive demonstration page showing complete workflow:
1. Search for token by name/symbol
2. View search results from CoinMarketCap
3. Select a token
4. Analyze token using our risk engine
5. View comprehensive risk assessment

## How It Works

### Workflow Diagram

```
User Input (e.g., "BONK")
    ↓
CoinMarketCap API Search
    ↓
Token Info + Contract Address + Blockchain
    ↓
Chain Detection (Ethereum/BSC/Solana/etc.)
    ↓
Multi-Source Data Fetching:
  • Mobula API (market data)
  • Moralis API (on-chain data)
  • Helius API (Solana security)
  • GoPlus API (contract security)
    ↓
10-Factor Risk Algorithm
    ↓
Risk Score + Analysis Results
```

## Implementation Details

### API Response Format

**Search Results:**
```json
{
  "results": [
    {
      "name": "Bonk",
      "symbol": "BONK",
      "address": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      "chain": "Solana",
      "cmcId": 23095,
      "rank": 98,
      "slug": "bonk"
    }
  ],
  "query": "BONK"
}
```

**Analysis Results:**
```json
{
  "riskScore": 47,
  "riskLevel": "MEDIUM",
  "data_sources": ["Mobula", "Moralis", "Helius", "GoPlus Security"],
  "marketCap": 1040000000,
  "liquidityUSD": 50000000,
  "holderCount": 100000,
  "volume24h": 75000000,
  "criticalFlags": []
}
```

### Chain Detection Logic

The system automatically maps blockchain names to chainIds:

| CMC Chain Name | ChainId | Network |
|---------------|---------|---------|
| Ethereum | 1 | Mainnet |
| BNB Smart Chain | 56 | BSC |
| Solana | 1399811149 | Mainnet |
| Polygon | 137 | Mainnet |
| Arbitrum | 42161 | Arbitrum One |

### Error Handling

- **No API Key**: Returns 500 with message "CoinMarketCap API key not configured"
- **No Results**: Returns empty array with 200 status
- **Native Tokens**: Displays message "No contract address (native token)" for BTC, ETH, SOL, etc.
- **API Rate Limit**: Caught and logged; returns null gracefully

## Usage Examples

### Basic Search

```typescript
import TokenSearchComponent from '@/components/token-search-cmc'

export default function MyPage() {
  const handleSelect = (address, chain, symbol, name) => {
    console.log(`Selected ${name} (${symbol}) on ${chain}`)
    console.log(`Contract: ${address}`)
    // Feed to analysis engine...
  }

  return <TokenSearchComponent onTokenSelect={handleSelect} />
}
```

### Direct API Call

```typescript
// Search by symbol
const response = await fetch('/api/search-token?query=BONK')
const data = await response.json()

if (data.results.length > 0) {
  const token = data.results[0]
  
  // Now analyze it
  const analysis = await fetch('/api/analyze-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: token.address,
      chainId: 1399811149 // Solana
    })
  })
}
```

### Advanced Name Search

```typescript
// Search by name (more flexible)
const response = await fetch('/api/search-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'dogwifhat',
    limit: 10
  })
})
```

## Benefits

### For Users
1. **No need to know contract addresses** - just search by name
2. **Verified addresses** - CoinMarketCap provides official contract addresses
3. **One-stop analysis** - search and analyze in one workflow
4. **Multi-chain support** - works across Ethereum, BSC, Solana, etc.

### For Developers
1. **Reusable component** - drop-in search functionality
2. **Type-safe** - full TypeScript support
3. **Error handling** - graceful fallbacks for all edge cases
4. **Extensible** - easy to add more data sources

## Testing

### Test the Demo Page

1. Start dev server: `pnpm dev`
2. Navigate to: `http://localhost:3000/token-search`
3. Try searching for:
   - "BONK" (Solana meme token)
   - "dogwifhat" (Solana meme token)
   - "PEPE" (Ethereum meme token)
   - "Bitcoin" (will show no contract - native token)

### Test the API Directly

```bash
# Symbol search
curl "http://localhost:3000/api/search-token?query=BONK"

# Name search
curl -X POST "http://localhost:3000/api/search-token" \
  -H "Content-Type: application/json" \
  -d '{"query":"dogwifhat","limit":5}'
```

## Configuration

### Required Environment Variable

Add to `.env.local`:
```bash
COINMARKETCAP_API_KEY=your_api_key_here
```

Current key (from existing config):
```bash
COINMARKETCAP_API_KEY=eab5df04ea5d4179a092d72d1634b52d
```

### API Rate Limits

CoinMarketCap Free Tier:
- 30 requests per minute
- 10,000 requests per month

**Recommendation**: Cache results for frequently searched tokens to stay within limits.

## Files Added/Modified

### New Files
- `app/api/search-token/route.ts` - Search API endpoints
- `components/token-search-cmc.tsx` - React search component
- `app/token-search/page.tsx` - Demo page
- `CMC_TOKEN_SEARCH.md` - This documentation

### Existing Files (No Changes Required)
- `lib/api/coinmarketcap.ts` - Already had CMC integration
- `.env.local` - Already had API key configured
- `lib/data/chain-adaptive-fetcher.ts` - Already supports multi-chain

## Future Enhancements

1. **Caching Layer**: Cache popular token searches to reduce API calls
2. **Autocomplete**: Real-time suggestions as user types
3. **Advanced Filters**: Filter by chain, market cap, volume
4. **Recent Searches**: Save user's recent token searches
5. **Favorites**: Let users save frequently analyzed tokens
6. **Batch Analysis**: Analyze multiple tokens at once

## Conclusion

The CoinMarketCap integration bridges the gap between user-friendly token names/symbols and blockchain contract addresses, making it much easier for users to analyze tokens without needing to know technical details like contract addresses or chain IDs.

The system is fully integrated with our existing multi-source risk analysis engine, providing a seamless experience from search to comprehensive risk assessment.
