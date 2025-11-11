# 🛡️ TokenGuard Pro: Complete Integration & Architecture Guide

## Table of Contents
1. [Overview](#overview)
2. [Core APIs & Integration](#core-apis--integration)
3. [Risk Assessment Algorithm](#risk-assessment-algorithm)
4. [AI Integration (Future Enhancement)](#ai-integration-future-enhancement)
5. [API Services Architecture](#api-services-architecture)
6. [Token Scanning Flow](#token-scanning-flow)
7. [Implementation Guide](#implementation-guide)
8. [Security & Compliance](#security--compliance)
9. [Cost & Deployment](#cost--deployment)
10. [Troubleshooting](#troubleshooting)

---

## Overview

**TokenGuard Pro** is a multi-chain risk analysis platform for cryptocurrency tokens, designed to deliver real-time security, tokenomics, liquidity, and market risk insights for cryptocurrency tokens.

**Note**: Full security analysis (GoPlus) is available for EVM chains only (Ethereum, BSC, Polygon, Arbitrum, Optimism, Base). Non-EVM chains like Solana can fetch price data but will show a warning that security analysis is not available.

### Key Features
- **Real-time Security Analysis**: Honeypot detection, contract vulnerabilities, ownership analysis (EVM chains only)
- **Multi-chain Support**: Ethereum, BSC, Polygon, Solana, and 100+ chains via Mobula
- **Chain Auto-Detection**: Automatically detects chain from address format (0x = EVM, base58 = Solana)
- **Comprehensive Risk Scoring**: 0-100 risk score with detailed breakdowns (EVM chains only)
- **Tokenomics Analysis**: Holder distribution, whale tracking, vesting schedules
- **Market Intelligence**: Price tracking, volume analysis, liquidity metrics (all chains)
- **AI-Powered Insights** (Future): Natural language explanations, chatbot assistance
- **API Testing Suite**: Built-in testing page at `/test` to verify all APIs

### Supported APIs
- **Mobula**: Primary source for market data, tokenomics, and multi-chain analysis
- **GoPlus Security**: Contract security and scam detection
- **CoinMarketCap**: Token search and branding data (name → address mapping)
- **CoinGecko**: Backup source for price and market data

---

## Core APIs & Integration

### 1. Mobula API

**Purpose**: Primary source for token discovery, market data, wallet transactions, and vesting analysis across 100+ blockchains.

**Documentation**: https://docs.mobula.io/

#### Key Endpoints

##### `/market/data`
- **Function**: Real-time price, liquidity, market cap, volume data
- **Method**: GET
- **Parameters**: `asset` (address or symbol)
- **Example**:
  ```typescript
  GET https://api.mobula.io/api/1/market/data?asset=0xdac17f958d2ee523a2206206994597c13d831ec7
  ```
- **Response**:
  ```json
  {
    "data": {
      "name": "Tether USD",
      "symbol": "USDT",
      "price": 1.001,
      "market_cap": 95000000000,
      "volume": 45000000000,
      "price_change_24h": 0.01,
      "liquidity": 85000000000
    }
  }
  ```

##### `/wallet/transactions`
- **Function**: Holder activity, whale tracking, transaction analysis
- **Use Case**: Detect suspicious wallet movements, track large holders

##### `/token/vesting`
- **Function**: Vesting/unlock schedules for supply risk analysis
- **Use Case**: Identify upcoming token unlocks that could impact price

##### `/token/metadata`
- **Function**: Contract details, symbol, name, decimals
- **Use Case**: Token identification and verification

#### Best Practices
- Use Mobula for **all real-time token scans** and tokenomics analysis
- Cache results for **5-10 minutes** to optimize API usage
- Always include `Authorization` header with API key
- Handle both address (0x...) and symbol inputs

#### Implementation
```typescript
// lib/api-services.ts
export class MobulaService {
  static async getTokenData(tokenAddress: string): Promise<TokenData | null> {
    const url = `https://api.mobula.io/api/1/market/data?asset=${tokenAddress}`
    const response = await fetch(url, {
      headers: {
        'Authorization': process.env.MOBULA_API_KEY || '',
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Mobula API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    return {
      name: data.data.name,
      symbol: data.data.symbol,
      price: data.data.price,
      marketCap: data.data.market_cap,
      volume24h: data.data.volume,
      priceChange24h: data.data.price_change_24h,
    }
  }
}
```

---

### 2. GoPlus Security API

**Purpose**: Industry-standard contract security and scam detection (honeypot, blacklist, mint control, proxy detection).

**Documentation**: https://docs.gopluslabs.io/

#### Key Endpoints

##### `/token_security/{chainId}/{address}`
- **Function**: Comprehensive security scan for vulnerabilities
- **Method**: GET
- **Parameters**: 
  - `chainId`: Ethereum (1), BSC (56), Polygon (137), etc.
  - `address`: Contract address
- **Example**:
  ```typescript
  GET https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=0xdac17f958d2ee523a2206206994597c13d831ec7
  ```
- **Response**:
  ```json
  {
    "result": {
      "0xdac17f958d2ee523a2206206994597c13d831ec7": {
        "is_honeypot": "0",
        "is_blacklisted": "0",
        "is_proxy": "0",
        "is_mintable": "0",
        "owner_change_balance": "0",
        "hidden_owner": "0",
        "selfdestruct": "0",
        "buy_tax": "0",
        "sell_tax": "0",
        "cannot_sell_all": "0",
        "trading_cooldown": "0"
      }
    }
  }
  ```

##### `/address_security/{address}`
- **Function**: Check if an address is flagged as malicious/compromised
- **Use Case**: Wallet safety checks before transactions

##### `/approval_security/{chainId}`
- **Function**: Analyze token approval risks
- **Use Case**: Detect excessive approvals that could lead to theft

#### Best Practices
- **Always run GoPlus scan** before generating investment advice/score
- Use binary honeypot results to automatically set safety flags
- Integrate GoPlus directly for instant notification and audit breakdowns
- Handle different response formats (string "1"/"0", numbers, booleans)

#### Implementation
```typescript
// lib/api-services.ts
export class GoPlusService {
  static async getSecurityAnalysis(
    chainId: string, 
    contractAddress: string
  ): Promise<SecurityAnalysis | null> {
    const normalizedAddress = contractAddress.toLowerCase()
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${normalizedAddress}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`GoPlus API error: ${response.status}`)
    }

    const data = await response.json()
    const securityData = data.result?.[normalizedAddress]

    if (!securityData) {
      return {
        contractAddress,
        isHoneypot: false,
        riskLevel: 'medium',
        issues: ['Token data not available from GoPlus API'],
      }
    }

    // Parse security flags
    const issues: string[] = []
    const checkFlag = (value: any) => {
      if (typeof value === 'string') return value === '1'
      if (typeof value === 'number') return value === 1
      return value === true
    }

    if (checkFlag(securityData.is_honeypot)) {
      issues.push('Potential honeypot detected')
    }
    // ... more checks

    return {
      contractAddress,
      isHoneypot: checkFlag(securityData.is_honeypot),
      riskLevel: issues.length === 0 ? 'low' : issues.length <= 3 ? 'medium' : 'high',
      issues,
    }
  }
}
```

---

### 3. CoinMarketCap API

**Purpose**: Branding source for token search. Main function: enable user search by name to fetch contract addresses.

**Documentation**: https://coinmarketcap.com/api/documentation/v1/

#### Key Endpoints

##### `/cryptocurrency/map`
- **Function**: Token lookup (name/symbol → contract address, chain info)
- **Method**: GET
- **Parameters**: `symbol` (e.g., "BTC", "ETH")
- **Example**:
  ```typescript
  GET https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=BTC
  ```
- **Response**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "name": "Bitcoin",
        "symbol": "BTC",
        "slug": "bitcoin",
        "platform": {
          "id": 1027,
          "name": "Ethereum",
          "symbol": "ETH",
          "slug": "ethereum",
          "token_address": "0x..."
        }
      }
    ]
  }
  ```

##### `/cryptocurrency/quotes/latest`
- **Function**: Real-time price, market cap, volume
- **Method**: GET
- **Parameters**: `symbol` (e.g., "BTC", "ETH")
- **Example**:
  ```typescript
  GET https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC
  ```

#### Best Practices
- **Cache `/map` results** for 24 hours for efficient repeated searches
- Implement server-side route to receive user input and return mapped addresses
- Filter for Ethereum tokens when multiple chains are available
- Use as primary search mechanism when user enters token name/symbol

#### Implementation
```typescript
// Two-step process: Map symbol to address, then get price
async function searchTokenBySymbol(symbol: string) {
  // Step 1: Map symbol to address
  const mapUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=${symbol.toUpperCase()}`
  const mapResponse = await fetch(mapUrl, {
    headers: {
      'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '',
    },
  })
  
  const mapData = await mapResponse.json()
  const ethToken = mapData.data?.find((t: any) => 
    t.platform?.slug === 'ethereum'
  )
  const contractAddress = ethToken?.platform?.token_address

  // Step 2: Get price data
  if (contractAddress) {
    // Use Mobula or other API with address
  }
}
```

---

### 4. CoinGecko API (Backup)

**Purpose**: Reliable backup for price, liquidity, market, and honeypot filter data.

**Documentation**: https://www.coingecko.com/api/documentation

#### Key Endpoints

##### `/simple/price`
- **Function**: Price data for multiple tokens
- **Method**: GET
- **Parameters**: `ids`, `vs_currencies=usd`
- **Example**:
  ```typescript
  GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true
  ```

##### `/coins/markets`
- **Function**: Market filters and backup data
- **Use Case**: When Mobula/CoinMarketCap fail

##### `/coins/{id}/market_chart`
- **Function**: Historical price backup
- **Use Case**: Price charts and historical analysis

#### Best Practices
- **Use when Mobula or CoinMarketCap credits are exhausted**
- Cache results for **10-15 minutes** to minimize rate restrictions
- Use as **secondary price source** for cross-validation
- No API key required for free tier (but recommended)

#### Implementation
```typescript
// lib/api-services.ts - Fallback pattern
async function getTokenPrice(addressOrSymbol: string) {
  try {
    // Try Mobula first
    return await MobulaService.getTokenData(addressOrSymbol)
  } catch (error) {
    console.error('Mobula failed, trying CoinGecko...')
    try {
      // Fallback to CoinGecko
      return await CoinGeckoService.getTokenData(addressOrSymbol)
    } catch (error) {
      throw new Error('All price APIs failed')
    }
  }
}
```

---

## Risk Assessment Algorithm

TokenGuard Pro calculates a **0-100 risk score** using weighted factors from all APIs:

### Formula

```
Risk Score = (Security × 0.35) + (Tokenomics × 0.30) + (Liquidity × 0.20) + (Market × 0.15)
```

### Component Details

#### Security (35% weight) - GoPlus API
- **Honeypot detection**: Binary flag (high severity)
- **Ownership**: Owner privileges, hidden owners
- **Taxes**: Buy/sell tax percentages
- **Blacklist**: Blacklisted addresses
- **Mint/Proxy controls**: Supply manipulation risks
- **Contract age**: Newer contracts = higher risk

**Scoring**:
- Honeypot: +50 risk
- Blacklisted: +30 risk
- Cannot sell all: +40 risk
- Self-destruct: +35 risk
- Hidden owner: +25 risk
- Owner can change balance: +20 risk
- High taxes (>20%): +15 risk
- Mintable: +10 risk
- Trading cooldown: +10 risk
- Proxy contract: +5 risk

#### Tokenomics (30% weight) - Mobula API
- **Holder concentration**: Top 10 holders percentage
- **Deployer retention**: Original deployer still holds tokens
- **Dead wallet analysis**: Burned/locked tokens
- **EOA ratio**: Contract vs. EOA holders
- **Whale emergence**: Recent large holder changes

**Scoring**:
- Top 10 holders > 70%: +25 risk
- Deployer holds > 50%: +20 risk
- Low holder count (< 100): +15 risk
- High contract holder ratio: +10 risk

#### Liquidity (20% weight) - Mobula, CoinGecko
- **Pool depth**: Total liquidity amount
- **Lock status**: Locked liquidity percentage
- **DEX count**: Number of exchanges
- **Volume-to-liquidity ratio**: Trading health

**Scoring**:
- Liquidity < $50k: +30 risk
- Volume/Liquidity > 10: +15 risk (potential pump)
- Single DEX: +10 risk
- No locked liquidity: +20 risk

#### Market (15% weight) - Mobula, CoinMarketCap
- **Volatility**: 24h price swings
- **Volume stability**: Consistent trading volume
- **Market cap**: Size and legitimacy
- **Pump/dump patterns**: Price manipulation indicators
- **Bot detection**: Automated trading patterns

**Scoring**:
- Price change > 50%: +15 risk
- Low market cap (< $100k): +20 risk
- Volume spikes > 1000%: +25 risk
- Low volume (< $10k/24h): +15 risk

### Risk Classification

- **80-100**: **Low Risk** (Green) - Safe to trade, verified contracts
- **60-79**: **Moderate Risk** (Yellow) - Caution advised, review details
- **0-59**: **High Risk** (Red) - Significant concerns, avoid or extreme caution

### Implementation
```typescript
// lib/token-scan-service.ts
private static calculateRiskScore(
  securityData: { isHoneypot: boolean; issues: string[] },
  tokenomicsData?: any,
  liquidityData?: any,
  marketData?: any
): number {
  let score = 0

  // Security (35% weight)
  if (securityData.isHoneypot) score += 50
  if (securityData.issues.includes('Token is blacklisted')) score += 30
  // ... more security checks
  const securityScore = Math.min(100, score)

  // Tokenomics (30% weight)
  let tokenomicsScore = 0
  if (tokenomicsData?.top10Holders > 0.7) tokenomicsScore += 25
  // ... more tokenomics checks

  // Liquidity (20% weight)
  let liquidityScore = 0
  if (liquidityData?.liquidity < 50000) liquidityScore += 30
  // ... more liquidity checks

  // Market (15% weight)
  let marketScore = 0
  if (marketData?.marketCap < 100000) marketScore += 20
  // ... more market checks

  // Weighted combination
  const finalScore = 
    (securityScore * 0.35) +
    (tokenomicsScore * 0.30) +
    (liquidityScore * 0.20) +
    (marketScore * 0.15)

  return Math.min(100, Math.max(0, finalScore))
}
```

---

## AI Integration (Future Enhancement)

### Overview
Use **Groq API** (or equivalent LLM) to provide human-readable risk explanations and interactive chatbot features.

**Groq Documentation**: https://groq.com/

### 1. Risk Explanation Module

Generate natural language summaries of risk analysis:

```typescript
// lib/ai-service.ts (Future implementation)
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function explainRisk(tokenData: CompleteTokenData): Promise<string> {
  const prompt = `
Summarize the risk as an AI security expert:
- Token name: ${tokenData.priceData?.name || 'Unknown'}
- Security: ${JSON.stringify(tokenData.securityData)}
- Tokenomics: ${tokenData.priceData?.liquidity || 'N/A'}
- Liquidity: ${tokenData.priceData?.liquidity || 'N/A'}
- Risk score: ${tokenData.securityData?.riskScore || 0}/100

Explain for non-experts in 2-3 sentences. Be clear about risks.
  `

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a crypto security expert who explains risks in simple terms.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'mixtral-8x7b-32768', // Fast, cost-effective model
    temperature: 0.7,
  })

  return completion.choices[0]?.message?.content || 'Unable to generate explanation'
}
```

### 2. Interactive Chatbot

Allow users to ask questions about token risks:

```typescript
export async function chatAboutToken(
  tokenData: CompleteTokenData,
  userQuestion: string
): Promise<string> {
  const prompt = `
Based on this token analysis, answer the user's question:

Token: ${tokenData.priceData?.name}
Security Issues: ${tokenData.securityData?.issues.join(', ')}
Risk Score: ${tokenData.securityData?.riskScore}/100

User Question: ${userQuestion}

Provide a helpful, accurate answer.
  `

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful crypto security advisor.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'mixtral-8x7b-32768',
  })

  return completion.choices[0]?.message?.content || 'Unable to answer'
}
```

### 3. Source Code Analysis

For verified contracts, analyze source code for vulnerabilities:

```typescript
export async function analyzeSourceCode(
  sourceCode: string,
  contractAddress: string
): Promise<string[]> {
  const prompt = `
Analyze this Solidity contract for security vulnerabilities:
- Reentrancy attacks
- Unchecked external calls
- Owner-only functions with high privileges
- Integer overflow/underflow
- Access control issues

Contract Address: ${contractAddress}
Source Code:
${sourceCode}

List all vulnerabilities found with severity levels.
  `

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a smart contract security auditor.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'mixtral-8x7b-32768',
  })

  // Parse response to extract vulnerabilities
  return parseVulnerabilities(completion.choices[0]?.message?.content || '')
}
```

---

## API Services Architecture

### Service Layer Pattern

```typescript
// lib/api-services.ts
export class TokenGuardAPI {
  /**
   * Get security analysis from GoPlus
   */
  async getSecurity(chainId: number, address: string) {
    return await GoPlusService.getSecurityAnalysis(chainId.toString(), address)
  }

  /**
   * Get token market data (tries Mobula, falls back to CoinGecko)
   */
  async getTokenData(address: string) {
    try {
      return await MobulaService.getTokenData(address)
    } catch (error) {
      console.error('Mobula failed, trying CoinGecko...', error)
      return await CoinGeckoService.getTokenData(address)
    }
  }

  /**
   * Search for token by symbol/name (uses CoinMarketCap map)
   */
  async searchToken(symbol: string) {
    // Step 1: Map symbol to address via CoinMarketCap
    const mapData = await CoinMarketCapService.mapSymbol(symbol)
    
    // Step 2: Get full data with address
    if (mapData?.address) {
      const [marketData, securityData] = await Promise.all([
        this.getTokenData(mapData.address),
        this.getSecurity(1, mapData.address), // Ethereum chain
      ])
      
      return {
        address: mapData.address,
        marketData,
        securityData,
      }
    }
    
    throw new Error('Token not found')
  }

  /**
   * Generate AI explanation (future)
   */
  async explainRisk(data: CompleteTokenData) {
    // Future: Integrate Groq API
    // return await GroqService.explainRisk(data)
    return 'AI explanations coming soon'
  }
}
```

### API Route Structure

```
/app/api/
  /token/
    /price/route.ts          # Price data endpoint (Mobula → CoinGecko → CoinMarketCap)
    /analyze/route.ts        # Security analysis (GoPlus)
    /search/route.ts         # Token search by name/symbol (CoinMarketCap map)
  /ai/
    /explain/route.ts        # AI risk explanation (Future - Groq)
    /chat/route.ts           # Interactive chatbot (Future - Groq)
```

---

## Token Scanning Flow

### Complete User Journey

1. **User enters token name/symbol or address**
   ```
   Input: "BTC" or "0xdac17f958d2ee523a2206206994597c13d831ec7"
   ```

2. **System detects input type**
   ```typescript
   const isAddress = input.startsWith('0x')
   ```

3. **If symbol provided: Search via CoinMarketCap**
   ```typescript
   if (!isAddress) {
     // Query CoinMarketCap /map to get contract address
     const address = await CoinMarketCapService.mapSymbol(input)
   }
   ```

4. **Fetch data in parallel**
   ```typescript
   const [priceData, securityData] = await Promise.all([
     TokenGuardAPI.getTokenData(address),  // Mobula → CoinGecko
     TokenGuardAPI.getSecurity(1, address), // GoPlus
   ])
   ```

5. **Calculate risk score**
   ```typescript
   const riskScore = calculateRiskScore(
     securityData,
     tokenomicsData,
     liquidityData,
     marketData
   )
   ```

6. **Generate AI explanation** (Future)
   ```typescript
   const explanation = await TokenGuardAPI.explainRisk(completeData)
   ```

7. **Display results**
   - Price and market data
   - Security analysis
   - Risk score (0-100)
   - Safety checks
   - AI explanation

### Implementation Example

```typescript
// components/token-search.tsx
const handleSearch = async () => {
  const input = search.trim()
  
  // Determine if input is address or symbol
  const isAddress = input.startsWith('0x')
  const chain = '1' // Ethereum
  
  try {
    // Complete scan
    const tokenData = await TokenScanService.scanToken(input, chain)
    
    // Validate results
    if (!tokenData.priceData && !tokenData.securityData) {
      throw new Error('Token not found')
    }
    
    // Display results
    onTokenSelect(tokenData)
  } catch (error) {
    setError('Failed to analyze token')
  }
}
```

---

## Implementation Guide

### Step 1: Environment Variables

Create `.env.local`:

```env
# Mobula API
MOBULA_API_KEY=your_mobula_api_key_here

# GoPlus API (usually no key required, but check docs)
GOPLUS_API_KEY=

# CoinMarketCap API
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here

# CoinGecko API (optional, free tier doesn't require key)
COINGECKO_API_KEY=

# Groq API (Future - AI features)
GROQ_API_KEY=your_groq_api_key_here
```

### Step 2: Install Dependencies

```bash
npm install groq-sdk  # For future AI features
```

### Step 3: API Service Implementation

Follow the patterns in `lib/api-services.ts`:
- MobulaService
- GoPlusService
- CoinMarketCapService
- CoinGeckoService

### Step 4: Token Scan Service

Use `lib/token-scan-service.ts` as the main orchestration layer:
- Combines all API calls
- Calculates risk scores
- Generates safety checks

### Step 5: Next.js API Routes

Create server-side routes:
- `/app/api/token/price/route.ts` - Price data
- `/app/api/token/analyze/route.ts` - Security analysis
- `/app/api/token/search/route.ts` - Token search

### Step 6: Frontend Components

- `components/token-search.tsx` - Search input
- `components/token-analysis.tsx` - Results display

---

## Security & Compliance

### API Key Security

1. **Never expose API keys in client-side code**
   - All API calls must be server-side (Next.js API routes)
   - Store keys in `.env.local` (not committed to git)

2. **Rate Limiting**
   - Implement rate limiting per user/IP
   - Cache responses to minimize API calls
   - Use API keys with appropriate tier limits

3. **Error Handling**
   - Don't expose API errors to users
   - Log errors server-side only
   - Provide generic error messages

### User Data Privacy

1. **Token Search History**
   - Optional: Store search history locally (not server)
   - Don't track user wallets without consent

2. **Disclaimer**
   - Display clear disclaimer: "Informational risk analysis only, not investment advice"
   - Always emphasize users should do their own research

### Best Practices

```typescript
// Good: Server-side API route
export async function POST(request: NextRequest) {
  const apiKey = process.env.MOBULA_API_KEY // ✅ Server-side only
  
  const response = await fetch(url, {
    headers: { 'Authorization': apiKey },
  })
  
  // Process and return safe data only
  return NextResponse.json({ data: sanitizedData })
}

// Bad: Client-side API call
// ❌ DON'T expose API keys in frontend
const apiKey = 'public_key' // ❌ Never do this
```

---

## Cost & Deployment

### API Pricing Summary

| API | Use Case | Auth Needed | Free Tier | Key Feature |
|-----|----------|-------------|-----------|-------------|
| **Mobula** | Market/tokenomics | Yes | ✅ Yes | Multi-chain, vesting |
| **GoPlus** | Contract security | No | ✅ Yes | Honeypot, blacklist |
| **CoinMarketCap** | Token search/price | Yes | ✅ Yes | Name-to-address |
| **CoinGecko** | Backup market/liquidity | Optional | ✅ Yes | Filter, fallback |
| **Groq (AI)** | Risk explanations | Yes | ✅ Yes | Fast LLM, summaries |

### Free Tier Limits

- **Mobula**: Generous free tier, suitable for MVP
- **GoPlus**: No API key required for basic usage
- **CoinMarketCap**: Free tier sufficient for search
- **CoinGecko**: No API key needed for basic calls
- **Groq**: Free tier available with rate limits

### Deployment Considerations

1. **Environment Variables**
   - Set all API keys in production environment
   - Use Next.js environment variable system
   - Never commit `.env.local` to git

2. **Caching Strategy**
   - Cache CoinMarketCap `/map` results: 24 hours
   - Cache price data: 5-10 minutes
   - Cache security scans: 15 minutes (for same address)

3. **Rate Limiting**
   - Implement user-level rate limiting
   - Use Next.js middleware or external service
   - Respect API provider rate limits

4. **Monitoring**
   - Track API call success rates
   - Monitor error rates and responses
   - Set up alerts for API failures

---

## Troubleshooting

### Token Not Found Errors

**Problem**: "Token not found in any API"

**Solutions**:
1. **Check input format**
   - **EVM addresses**: Must start with `0x` and be 42 characters
   - **Solana addresses**: Base58 encoded, 32-44 characters (no `0x`)
   - **Symbols**: Should be uppercase (BTC, ETH, SOL)
   - Try full contract address instead of symbol

2. **Verify token exists**
   - Check if token is on supported chain
   - Some tokens only exist on specific chains
   - Solana tokens work for price data but not security analysis

3. **API fallback order**
   ```
   Price: Mobula → CoinGecko → CoinMarketCap
   Search: CoinMarketCap → Mobula
   Security: GoPlus (EVM only) → Not available for Solana
   ```

4. **Solana-specific**
   - Use Solana addresses (base58) or SOL symbol
   - Price data works via Mobula/CoinGecko
   - Security analysis shows warning that GoPlus doesn't support Solana

### API Errors

**Problem**: "Failed to fetch price data"

**Solutions**:
1. **Check API keys**
   ```bash
   # Verify keys are set
   echo $MOBULA_API_KEY
   echo $COINMARKETCAP_API_KEY
   ```

2. **Verify network connectivity**
   - Test API endpoints directly
   - Check firewall/proxy settings

3. **Check rate limits**
   - Reduce API call frequency
   - Implement caching
   - Check API provider dashboard for limits

### GoPlus Security Scan Fails

**Problem**: "Token not found in GoPlus database" or "Security analysis not available"

**Solutions**:
1. **Check if token is on EVM chain**
   - GoPlus only supports EVM chains (Ethereum, BSC, Polygon, Arbitrum, Optimism, Base)
   - **Solana and other non-EVM chains cannot use GoPlus security analysis**
   - For Solana tokens, only price data will be available

2. **New tokens may not be indexed**
   - Wait 24-48 hours for new tokens
   - Use fallback analysis

3. **Check chain ID**
   - Ethereum: 1
   - BSC: 56
   - Polygon: 137
   - Arbitrum: 42161
   - Optimism: 10
   - Base: 8453

4. **Normalize address**
   - Always use lowercase addresses for EVM
   - Remove any whitespace
   - For Solana: Use base58 addresses (32-44 characters)

### CoinMarketCap Search Issues

**Problem**: "Symbol not found"

**Solutions**:
1. **Use correct symbol format**
   - Uppercase (BTC, not btc)
   - No spaces or special characters

2. **Check token popularity**
   - Very new or obscure tokens may not be indexed
   - Try searching by full name instead

3. **Cache `/map` results**
   - Reduce API calls
   - Improve response times

---

## Additional Resources

### API Documentation Links

- **Mobula**: https://docs.mobula.io/
- **GoPlus**: https://docs.gopluslabs.io/
- **CoinMarketCap**: https://coinmarketcap.com/api/documentation/v1/
- **CoinGecko**: https://www.coingecko.com/api/documentation
- **Groq**: https://groq.com/ (for future AI features)

### Useful Tools

- **Etherscan**: https://etherscan.io/ - Verify contract addresses
- **DexScreener**: https://dexscreener.com/ - Token analytics
- **Uniswap Info**: https://info.uniswap.org/ - Liquidity data

### Best Practices Summary

1. ✅ **Always use Mobula for primary market data**
2. ✅ **Run GoPlus security scan before showing results**
3. ✅ **Use CoinMarketCap for name/symbol search**
4. ✅ **Cache API responses appropriately**
5. ✅ **Handle errors gracefully with fallbacks**
6. ✅ **Never expose API keys client-side**
7. ✅ **Display clear disclaimers to users**
8. ✅ **Implement rate limiting**
9. ✅ **Monitor API usage and costs**
10. ✅ **Test with popular tokens first (BTC, ETH, USDT)**

---

## Summary

TokenGuard Pro integrates:
- **Mobula**: Primary source for market data and tokenomics
- **GoPlus**: Contract security and scam detection
- **CoinMarketCap**: Token search and address mapping
- **CoinGecko**: Backup price and market data
- **Groq (Future)**: AI-powered risk explanations

The system calculates a comprehensive risk score (0-100) using weighted factors from all sources, providing users with actionable security insights for cryptocurrency tokens.

For questions or improvements, refer to the codebase in:
- `/lib/api-services.ts` - API service implementations
- `/lib/token-scan-service.ts` - Main scanning logic
- `/app/api/token/` - API route handlers
- `/components/token-search.tsx` - User interface

