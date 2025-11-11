# Token Guard Risk Algorithm - Complete Technical Documentation

## Overview

The Token Guard risk algorithm is a sophisticated 10-factor assessment system that evaluates cryptocurrency tokens across multiple blockchain networks. It combines traditional security metrics with AI-powered classification and chain-adaptive scoring to provide accurate risk assessments.

## Algorithm Architecture

### Core Components

1. **Stablecoin Override System** - Automatic low-risk classification for major stablecoins
2. **AI Meme Detection** - Google Gemini-powered token classification
3. **Chain-Adaptive Weights** - Specialized scoring for different blockchain networks
4. **10-Factor Risk Assessment** - Comprehensive evaluation across multiple risk dimensions
5. **Critical Flags System** - Automatic penalty application for severe security issues

### Processing Pipeline

```
Input Data → Stablecoin Check → AI Classification → Weight Selection → Factor Calculation → Weighted Scoring → Critical Overrides → Final Risk Score
```

## Step-by-Step Algorithm Flow

### Step 0: Stablecoin Override (Priority Override)

**Purpose**: Major stablecoins receive automatic LOW risk scores regardless of calculated metrics.

```typescript
function checkIfStablecoin(tokenSymbol: string | undefined, marketCap: number): boolean {
  const STABLECOIN_SYMBOLS = ['USDT', 'USDC', 'DAI', 'BUSD', 'FRAX', 'TUSD', 'USDP', 'USDD']
  return STABLECOIN_SYMBOLS.includes(tokenSymbol?.toUpperCase() || '') && marketCap > 100_000_000
}
```

**Logic**:
- Symbol must match known stablecoin list
- Market cap must exceed $100M to prevent fake stablecoins
- If matched: Returns score 10 (LOW) with 99% confidence

**Example**: USDT with $80B market cap → Score 10 (LOW)

### Step 1: AI Meme Detection

**Purpose**: Classify tokens as MEME or UTILITY to select appropriate weight profiles.

**Process**:
1. Check for manual user classification override
2. If no override, use Google Gemini AI to analyze token metadata
3. Apply confidence scoring (0-100%)

**Weight Selection**:
- **MEME Tokens**: Use MEME_WEIGHTS (higher emphasis on whale concentration, liquidity, social adoption)
- **UTILITY Tokens**: Use chain-specific weights (EVM, Solana, Cardano)

### Step 2: Twitter Social Metrics (Premium Only)

**Purpose**: Incorporate social adoption data from Twitter.

**Process**:
- Fetch follower count, engagement rate, recent tweets
- Calculate adoption risk score (0-100)
- Integrate into overall adoption factor

### Step 3: 10-Factor Risk Calculation

All 10 factors are calculated simultaneously using real-time data from Mobula, GoPlus, and Moralis APIs.

#### Factor 1: Supply Dilution (20% weight for standard tokens)

**Purpose**: Evaluate inflation risk and supply control.

**Metrics**:
- FDV/Market Cap ratio (primary)
- Mintable contract flag (+20 penalty)
- Unlimited supply without burns (+15 penalty)

**Scoring Logic**:
```typescript
const fdvToMcap = data.fdv / data.marketCap
if (fdvToMcap <= 1) score = 10
else if (fdvToMcap <= 2) score = 30
else if (fdvToMcap <= 5) score = 50
else if (fdvToMcap <= 10) score = 70
else score = 90
```

#### Factor 2: Holder Concentration (18% weight)

**Purpose**: Assess whale manipulation risk.

**Metrics**:
- Top 10 holders percentage
- Total holder count

**Scoring Logic**:
- Top 10 > 80%: +50 points
- Top 10 > 70%: +40 points
- Holders < 50: +35 points
- Holders < 100: +30 points

#### Factor 3: Liquidity Depth (16% weight)

**Purpose**: Evaluate rug pull and slippage risk.

**Critical Guard**: Liquidity < $10K = Score 100 (CRITICAL)

**Metrics**:
- Absolute liquidity amount
- Market cap to liquidity ratio
- LP lock status

**Scoring Logic**:
- Liquidity < $25K: +42 points
- MC/Liq ratio > 500x: +38 points
- LP not locked: +30 points

#### Factor 4: Vesting & Unlock Schedule (Removed from weighted calculation)

**Purpose**: Track upcoming token unlocks.

**Metrics**:
- Next 30 days unlock percentage
- Team vesting duration

**Used for**: Critical flags and upcoming risks (not weighted scoring)

#### Factor 5: Contract Control (15% weight, 35% for Solana)

**Purpose**: Assess smart contract security and centralization.

**Critical Flags**:
- Honeypot detection: +60 points
- Mintable contract: +50 points
- Solana freeze authority: +70 points
- LP not locked: +40 points

**Chain-Specific Logic**:
- **Solana**: Freeze authority detection with conservative defaults
- **EVM**: Honeypot, mintable, owner renounced checks
- **Fallback**: Holder concentration proxies when GoPlus unavailable

#### Factor 6: Tax & Fee Structure (11% weight, 0% for Solana)

**Purpose**: Evaluate hidden costs and manipulation potential.

**Metrics** (GoPlus data):
- Buy/sell tax rates
- Tax modifiability

**Scoring Logic**:
- Sell tax > 30%: +60 points
- Sell tax > 20%: +40 points
- Tax modifiable: +30 points

#### Factor 7: Distribution & Allocation (10% weight)

**Purpose**: Assess token distribution fairness.

**Metrics**:
- Team allocation percentage
- Top 10 holders concentration

**Scoring Logic**:
- Team allocation > 40%: +35 points
- Top 10 > 80%: +55 points

#### Factor 8: Burn & Deflation Mechanisms (6% weight)

**Purpose**: Evaluate supply reduction mechanisms.

**Logic**:
- Burn ratio = burned supply / total supply
- Capped supply bonus
- High burn ratios reduce risk

#### Factor 9: Adoption & Usage (10% weight, 15% for memes)

**Purpose**: Measure real-world usage and activity.

**Metrics**:
- 24h transaction count
- Volume to market cap ratio
- Token age (with reduced penalties for new tokens)

**Age Adjustments**: New tokens (<7 days) get 30% reduced penalties

#### Factor 10: Audit & Transparency (4% weight)

**Purpose**: Assess code verification and openness.

**Metrics**:
- Open source status
- LP lock verification
- Audit availability

### Step 4: Weighted Scoring

**Process**:
1. Select weight profile based on token type and chain
2. Calculate weighted sum: `score = Σ(factor_score × weight)`
3. Apply meme baseline (+15 points for meme tokens)

**Weight Profiles**:

#### Standard Tokens (EVM Default):
```typescript
{
  supply_dilution: 0.20,      // 20%
  holder_concentration: 0.18, // 18%
  liquidity_depth: 0.16,      // 16%
  contract_control: 0.15,     // 15%
  tax_fee: 0.11,             // 11%
  distribution: 0.10,         // 10%
  burn_deflation: 0.06,       // 6%
  adoption: 0.10,             // 10%
  audit: 0.04                 // 4%
}
```

#### Meme Tokens:
```typescript
{
  supply_dilution: 0.16,      // 16%
  holder_concentration: 0.22, // 22% (HIGHER)
  liquidity_depth: 0.20,      // 20% (HIGHER)
  contract_control: 0.12,     // 12%
  tax_fee: 0.10,             // 10%
  distribution: 0.08,         // 8%
  burn_deflation: 0.02,       // 2% (LOWER)
  adoption: 0.15,             // 15% (HIGHER)
  audit: 0.01                 // 1% (LOWER)
}
```

#### Solana Tokens:
```typescript
{
  supply_dilution: 0.15,      // 15%
  holder_concentration: 0.18, // 18%
  liquidity_depth: 0.18,      // 18%
  contract_control: 0.35,     // 35% (HIGHEST)
  tax_fee: 0.00,             // 0% (N/A)
  distribution: 0.08,         // 8%
  burn_deflation: 0.04,       // 4%
  adoption: 0.10,             // 10%
  audit: 0.02                 // 2%
}
```

### Step 5: Critical Overrides

**Purpose**: Apply minimum risk scores for severe security issues.

**Logic**:
- 3+ critical flags: Minimum score 75
- 1+ critical flags: +15 penalty
- Critical flags include: honeypots, high taxes, unlocked LP, major unlocks

### Step 6: Risk Classification

**Final Score Ranges**:
- 75+: CRITICAL
- 50-74: HIGH
- 35-49: MEDIUM
- 20-34: LOW
- <20: LOW (minimum threshold)

### Step 7: AI Analysis Generation (Premium Only)

**Components**:
1. **AI Summary**: Comprehensive explanation using all factors
2. **Detailed Insights**: Human-readable risk explanations
3. **Critical Flags**: Specific security warnings
4. **Confidence Score**: Based on data availability

## Data Sources & Validation

### Primary APIs:
- **Mobula**: Market data, supply metrics, holder analysis
- **GoPlus**: Contract security, honeypot detection, tax analysis
- **Moralis**: Transaction data, blockchain activity
- **Helius**: Solana-specific data and freeze authority checks
- **Google Gemini**: AI-powered token classification

### Data Transparency:
- **Real Data Only**: API responses filter out estimated values
- **Source Attribution**: Each result includes data source information
- **Fallback Handling**: Graceful degradation when APIs unavailable

## Algorithm Limitations & Considerations

### Known Limitations:
1. **Data Dependency**: Risk scores depend on API data availability
2. **New Tokens**: Limited historical data affects accuracy
3. **DeFi Complexity**: Cannot detect all smart contract vulnerabilities
4. **Market Sentiment**: Does not account for broader market conditions

### Risk Mitigation:
- Conservative defaults for missing data
- Multiple data source validation
- Chain-specific logic for known platform risks
- Regular algorithm updates based on new threats

## Algorithm Evolution

### Version History:
- **v1.0**: Basic 10-factor weighted system
- **v2.0**: Added AI meme detection and chain-adaptive weights
- **v3.0**: Implemented stablecoin override and critical flags system
- **v4.0**: Added Solana freeze authority detection and data transparency
- **v5.0**: Enhanced holder concentration analysis (top50/100 + unique buyers), liquidity drop detection, and increased freeze authority penalty to +100 for Solana tokens

### Continuous Improvement:
- Regular weight calibration based on real-world outcomes
- New factor addition for emerging risks
- API integration expansion for better data coverage

## Usage Examples

### High-Risk Token (Score: 85):
- Honeypot contract: +60
- Low liquidity: +42
- High concentration: +40
- No burns: +20
- Weighted total with critical override: 85

### Low-Risk Token (Score: 15):
- Good liquidity: 0
- Renounced ownership: 0
- Reasonable distribution: 15
- Active adoption: 10
- Weighted total: 15

### Stablecoin Override (Score: 10):
- USDT detected: Automatic override
- Score: 10 (LOW) regardless of metrics

## Technical Implementation

### Function Signatures:
```typescript
async function calculateRisk(
  data: TokenData,
  plan: 'FREE' | 'PREMIUM',
  metadata?: TokenMetadata
): Promise<RiskResult>
```

### Key Data Structures:
```typescript
interface RiskBreakdown {
  supplyDilution: number;
  holderConcentration: number;
  liquidityDepth: number;
  contractControl: number;
  taxFee: number;
  distribution: number;
  burnDeflation: number;
  adoption: number;
  auditTransparency: number;
}

interface RiskResult {
  overall_risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence_score: number;
  breakdown: RiskBreakdown;
  critical_flags?: string[];
  ai_summary?: AISummary;
}
```

This algorithm represents a comprehensive, data-driven approach to cryptocurrency risk assessment, continuously evolving to address new threats while maintaining accuracy and transparency.