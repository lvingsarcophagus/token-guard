# Token Guard Pro - Risk Algorithm Explanation

**For: Grok AI Model (Claude Understanding)**  
**Purpose: Complete technical breakdown of how token risk scoring works**

---

## Executive Overview

Token Guard Pro analyzes cryptocurrency tokens and assigns a **risk score (0-100)** where:
- **0-19**: LOW risk ✅
- **20-34**: LOW risk ✅
- **35-49**: MEDIUM risk ⚠️
- **50-74**: HIGH risk 🔴
- **75-100**: CRITICAL risk 🚨

The algorithm evaluates **9 weighted factors** specific to each blockchain (EVM, Solana, Cardano).

---

## Algorithm Architecture

### Layer 1: Data Collection (Multi-Source)

```
Token Address
  ↓
1. Mobula API (Primary)
   ├─ Market Cap
   ├─ 24h Volume
   ├─ Liquidity
   ├─ Price
   ├─ Total/Circulating Supply
   └─ Holder Count

2. Moralis API (Parallel - EVM Only)
   ├─ Transaction History
   ├─ Token Metadata
   └─ Created Date

3. GoPlus Security (EVM Only)
   ├─ Honeypot Detection
   ├─ Mint Authority
   ├─ Owner Status
   ├─ Tax Info
   └─ LP Lock Status

4. Heuristic Fallbacks (When APIs Missing)
   ├─ Age Estimation (Volume/MC Ratio)
   └─ Transaction Count Estimation
```

**Key Point**: If data is estimated/heuristic, it's flagged internally and **NOT shown to users** in the API response. Users only see real fetched data.

---

## Layer 2: Risk Factor Calculation

### The 9 Factors (100% total weight)

#### Factor 1: **Supply Dilution** (15-25% weight depending on chain)
**What it measures**: Can the token supply increase (inflation risk)?

**How it works**:
```
IF token is_mintable:
  score = 80  (CRITICAL - unlimited supply possible)
  REASON: Owner can print infinite tokens

IF max_supply == null:
  score = 60  (HIGH - no supply cap)
  REASON: Unfixed supply is risky

IF max_supply < circulating_supply:
  score = 90  (CRITICAL - data error or burn happened)
  REASON: Impossible situation suggests issues

IF (total_supply - burned_supply) < max_supply:
  score = 40-60 (Medium-High based on % remaining)
  REASON: More supply can be released

OTHERWISE:
  score = 0-10 (LOW - fixed supply)
  REASON: Supply is capped, safe
```

**Example - PEPE**:
- Fixed supply ✓
- No mint authority ✓
- No burn risk ✓
- Score: 30/100 (Low supply risk)

**Example - MAGA**:
- Mintable: YES ✗
- Score: 80-90/100 (High supply risk)

---

#### Factor 2: **Holder Concentration** (15-22% weight)

**What it measures**: Are tokens concentrated in few wallets? (Whale risk)

**How it works**:
```
% in Top 10 Holders | Score | Risk
─────────────────────────────────
> 90%              | 95    | CRITICAL (Instant dump)
> 80%              | 80    | HIGH (Easy exit rug)
> 70%              | 70    | HIGH
> 60%              | 60    | MEDIUM-HIGH
> 50%              | 50    | MEDIUM
> 40%              | 40    | MEDIUM
> 30%              | 30    | MEDIUM-LOW
> 20%              | 20    | LOW
≤ 20%              | 0     | VERY LOW (Good distribution)

ALSO CHECK: Total unique holders
< 50 holders      → +20 penalty (rugpull likely)
< 100 holders     → +15 penalty
< 1000 holders    → +10 penalty
> 100k holders    → -10 bonus (real adoption)
```

**Example - BONK (Solana)**:
- Top 10: 34.2% ✓
- Holders: 242
- Score: 30 (Moderate concentration)

**Example - WIF (Solana)**:
- Top 10: 45.3% ✗
- Holders: 250
- Score: 38 (High concentration concern)

---

#### Factor 3: **Liquidity Depth** (14-20% weight)

**What it measures**: Can you actually exit your position? (Rug pull indicator)

**How it works**:
```
Liquidity/MarketCap Ratio | Score | Risk
─────────────────────────────────────
< 0.01 (1%)              | 80    | CRITICAL (No exit possible)
0.01-0.02 (1-2%)         | 70    | HIGH
0.02-0.05 (2-5%)         | 50    | MEDIUM
0.05-0.10 (5-10%)        | 30    | MEDIUM-LOW
0.10-0.20 (10-20%)       | 15    | LOW
> 0.20 (>20%)            | 0     | VERY LOW (Deep liquidity)

ALSO CHECK: Liquidity USD amount (absolute)
< $10K                   → +30 penalty (nano liquidity)
< $50K                   → +20 penalty
< $100K                  → +10 penalty
> $1M                    → -10 bonus (institutional level)
```

**Example - BONK (Solana)**:
- Liquidity: $139K
- MarketCap: $1.07B
- Ratio: 0.00013 (0.013%) ← EXTREME!
- Score: 56 (CRITICAL liquidity crisis)

**Example - PEPE (Ethereum)**:
- Liquidity: $20.6M
- MarketCap: $2.53B
- Ratio: 0.0081 (0.81%) ← Healthy
- Score: 22 (Low risk)

---

#### Factor 4: **Contract Control** (12-35% weight - CHAIN SPECIFIC)

**What it measures**: Can owner steal funds? (Contract security)

**EVM (Ethereum, BSC, Polygon)**:
```
CRITICAL FLAGS:
├─ Honeypot detected: +60 penalty
│   (Can buy but can't sell = theft)
├─ Mintable contract: +50 penalty
│   (Owner can inflate supply)
├─ LP in owner wallet: +40 penalty
│   (90% rug pull indicator)
└─ Owner not renounced: +20 penalty
   (Owner can upgrade contract)

IF any flags: score = sum of penalties (capped at 100)
ELSE: score = 0
```

**Solana (CRITICAL - Different From EVM)**:
```
CRITICAL FLAGS:
├─ Freeze Authority EXISTS: +70 penalty
│   (Can freeze wallets - CRITICAL on Solana)
├─ Freeze Authority UNKNOWN: +35 penalty (CONSERVATIVE DEFAULT)
│   (Assume it exists since most SPL tokens do)
└─ Mint Authority EXISTS: +50 penalty
   (Can print tokens - Solana specific)

Note: Solana gets 35% weight on this factor vs EVM's 12%
REASON: Solana lacks transaction tracking, so contract control is the main security signal
```

**Example - PEPE (Ethereum)**:
- Owner: Renounced ✓
- Not honeypot ✓
- Not mintable ✓
- LP: Locked ✓
- Score: 0 (Safe)

**Example - BONK (Solana)**:
- Freeze Authority: Unknown (no API)
- Score: 35 (Conservative default applied)

---

#### Factor 5: **Tax/Fee** (10-11% weight - EVM only)

**What it measures**: Does token take hidden fees? (Transfer tax scam)

**How it works**:
```
Buy Tax | Sell Tax | Combined | Score | Risk
──────────────────────────────────────
0%      | 0%      | 0%       | 0     | SAFE
1-5%    | 1-5%    | 2-10%    | 10    | LOW
5-10%   | 5-10%   | 10-20%   | 30    | MEDIUM
10-20%  | 10-20%  | 20-40%   | 60    | HIGH
>20%    | >20%    | >40%     | 90    | CRITICAL

SPECIAL CASE: Tax Modifiable
├─ Owner can change tax: +15 penalty
│   (Rug pull indicator - can increase to 99%)
```

**Solana**: No token taxes possible (SPL standard), so this factor is 0% weight

---

#### Factor 6: **Distribution** (8-15% weight)

**What it measures**: How spread out is the token? (Fair distribution vs presale scam)

**How it works**:
```
Top 10 % | Fair Pricing | DEX Liquidity | Score
────────────────────────────────────
> 90%    | Presale only | Very high    | 80 (ICO scam setup)
70-90%   | Mostly presale| High        | 60 (Presale heavy)
50-70%   | Mixed        | Medium       | 40 (Some concerns)
30-50%   | Fair spread  | Medium       | 20 (OK)
< 30%    | Very fair    | Low DEX need | 0 (Optimal)

ALSO CHECK:
├─ Creator balance > 10%: +20 penalty (insider dump risk)
├─ Treasury balance > 30%: +15 penalty
└─ Circulating% of total < 50%: +20 penalty (future inflation)
```

---

#### Factor 7: **Burn/Deflation** (2-8% weight)

**What it measures**: Does token remove supply over time? (Positive mechanism)

**How it works**:
```
IF burned_supply == 0:
  score = 100 (No deflationary mechanism)

ELSE:
  burn_percentage = (burned_supply / max_supply) * 100
  
  IF burn_percentage > 50%:
    score = 0 (Excellent - half supply burned)
  ELSE IF burn_percentage > 30%:
    score = 10 (Very good)
  ELSE IF burn_percentage > 10%:
    score = 20 (Good)
  ELSE IF burn_percentage > 1%:
    score = 50 (Moderate)
  ELSE:
    score = 80 (Minimal burns)

ALSO CHECK: Burn velocity
├─ Actively burning (daily): -10 bonus (deflationary)
└─ One-time burn: -5 bonus (one-time only)
```

**Example - PEPE**:
- Burned: ~0.2% of supply
- Score: 70 (Minimal deflation)

---

#### Factor 8: **Adoption** (7-15% weight)

**What it measures**: Is the token actually used? (Real activity vs hype)

**How it works**:
```
TxCount24h | Score | Risk Level
─────────────────────────
> 10,000   | 0     | Excellent adoption
5,000-10k  | 10    | Very good
1,000-5k   | 20    | Good
100-1k     | 40    | Moderate
10-100     | 60    | Low adoption
< 10       | 80    | Minimal activity
0          | 100   | Dead token (or new)

AGE MULTIPLIER (if < 7 days old):
├─ Age < 1 day: adoption_score *= 0.7 (30% reduction)
│  REASON: New tokens naturally have low adoption
├─ Age 1-3 days: adoption_score *= 0.8 (20% reduction)
├─ Age 3-7 days: adoption_score *= 0.9 (10% reduction)
└─ Age > 7 days: adoption_score *= 1.0 (no change)

SOCIAL METRICS (Premium):
├─ Twitter followers < 1K: +20 penalty
├─ Telegram members < 100: +15 penalty
├─ Reddit activity: +10 penalty if dead
```

**Data Sources**:
```
PRIMARY: Mobula txCount24h (if available)
SECONDARY: Moralis transaction patterns (EVM only)
TERTIARY: Heuristic estimate (volume / $1000 avg tx)
SPECIAL: For Solana - NO transaction data, heuristic only
```

**Example - PEPE**:
- txCount24h: 200 (from Moralis)
- Age: 180 days (mature)
- Score: 28 (Good adoption for old token)

**Example - BONK**:
- txCount24h: Unknown (Solana, no Moralis)
- Age: 10 days (young, estimated)
- Score: 65 (Low txCount but expected for age)

---

#### Factor 9: **Audit & Transparency** (1-7% weight)

**What it measures**: Is code audited? Is it open source?

**How it works**:
```
Audit Status                | Score
────────────────────────────────
Certified audit (CertiK)    | 0 (Excellent)
Self-audited code           | 20
Open source on GitHub       | 30
Closed source               | 60
No audit info              | 80
Rugpull history            | 100
```

---

## Layer 3: Weighted Aggregation

### Weight Profiles by Chain

#### EVM Standard Tokens (Ethereum, BSC, Polygon)
```
supply_dilution:      20%
holder_concentration: 18%
liquidity_depth:      16%
contract_control:     15%
tax_fee:              11%
distribution:         10%
burn_deflation:        6%
adoption:             10%
audit:                 4%
─────────────────────────
Total:               100%

RATIONALE: 
- Supply control most important (inflation)
- Tax/fees second (hidden exit scams)
- Adoption moderate (many tokens low volume)
```

#### EVM Meme Tokens (PEPE, SHIB, DOGE)
```
supply_dilution:      16%
holder_concentration: 22% ← HIGHER (whales dump memes)
liquidity_depth:      20% ← HIGHER (rug pulls common)
contract_control:     12%
tax_fee:              10%
distribution:          8%
burn_deflation:        2% ← LOWER (memes rarely burn)
adoption:             15% ← HIGHER (hype driven)
audit:                 1% ← LOWER (rarely audited)
─────────────────────────
Total:               100%

RATIONALE:
- Whale manipulation critical (concentration up)
- Liquidity rug pulls very common (liquidity up)
- Social hype matters (adoption up)
- Audit irrelevant for memes
```

#### Solana Tokens
```
supply_dilution:       15%
holder_concentration:  18%
liquidity_depth:       18% ← HIGHER (Solana has fewer deep LPs)
contract_control:      35% ← MUCH HIGHER (no tx data, this is signal)
tax_fee:                0% ← N/A (Solana has no token taxes)
distribution:           8%
burn_deflation:         4%
adoption:              10%
audit:                  2%
─────────────────────────
Total:               100%

RATIONALE:
- Contract control critical (freeze/mint authorities)
- No transaction history available (Moralis skips Solana)
- Must use conservative defaults for missing data
```

---

## Layer 4: Special Rules & Overrides

### Meme Token Detection
```
ALGORITHM: Scan name and symbol for meme keywords
├─ "doge", "shib", "pepe", "floki": 95% confidence
├─ "elon", "inu", "moon": 85% confidence
├─ "safe", "coin", "token": 0% confidence
└─ Twitter followers > 100K: 60% confidence

IF IS_MEME:
  ├─ Apply meme weight profile
  ├─ Add 15-point baseline (harder to get LOW)
  ├─ Concentration factor increased
  └─ Audit factor decreased
```

### Critical Flags (Force High Scores)
```
IF honeypot_detected OR (mint_authority AND !owner_renounced):
  MINIMUM_SCORE = 75 (CRITICAL)
  REASON: These are near-guaranteed scams

IF liquidity_ratio < 0.001 AND market_cap > $1M:
  MINIMUM_SCORE = 60 (HIGH)
  REASON: Massive dump risk despite other factors

IF top_10_holders > 90%:
  MINIMUM_SCORE = 70 (HIGH)
  REASON: Rug pull setup even if new
```

### Meme Baseline Boost
```
FOR MEME TOKENS:
  IF calculated_score < 15:
    final_score = 15 (minimum)
    REASON: Memes are inherently risky

  IF calculated_score > 50:
    final_score += 15 point bonus
    REASON: "Add to meme risk"
```

---

## Real Example: BONK (Solana)

### Input Data
```
Chain: SOLANA
Address: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
Market Cap: $1,069M
FDV: $1,144M
Liquidity: $139K ← CRITICAL
Volume24h: $50M
Holders: 242 (very few!)
Top 10 %: 34.2%
Age: ~10 days
Is Meme: YES (BONK sounds like DOGE)
```

### Factor Calculation

| Factor | Value | Calculation | Score |
|--------|-------|-------------|-------|
| Supply Dilution | No mint | Fixed supply | 30 |
| Holder Concentration | 34.2% top10 | + 242 holders penalty | 30 |
| Liquidity Depth | 0.013% | Critical ratio + 139K USD | 56 |
| Contract Control | Unknown freeze | Solana conservative default | 35 |
| Tax/Fee | N/A | Solana no taxes | 0 |
| Distribution | 34.2% top10 | Moderate | 8 |
| Burn/Deflation | No burns | None | 50 |
| Adoption | Unknown txs | ~500 estimated (low) | 65 |
| Audit | None | Meme, no audit | 80 |

### Weighted Sum
```
(30×0.15) + (30×0.18) + (56×0.18) + (35×0.35) + (0×0) + (8×0.08) + (50×0.04) + (65×0.10) + (80×0.02)
= 4.5 + 5.4 + 10.08 + 12.25 + 0 + 0.64 + 2 + 6.5 + 1.6
= 43.01

Apply Meme Baseline: 43.01 < 50, so no adjustment
Apply Meme Minimum: 43.01 > 15, so keep as is

FINAL SCORE: 45/100 = MEDIUM RISK ✓
```

---

## Real Example: WIF (dogwifhat) - Solana

### Input Data
```
Chain: SOLANA
Address: EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm
Market Cap: $483M
FDV: $483M
Liquidity: $5.3M ← Better than BONK!
Volume24h: $20M
Holders: 250 (very few!)
Top 10 %: 45.3% ← EXTREME!
Age: ~10 days
Is Meme: YES (dogwifhat = dog + meme)
```

### Factor Calculation

| Factor | Value | Calculation | Score |
|--------|-------|-------------|-------|
| Supply Dilution | No mint | Fixed supply | 25 |
| Holder Concentration | 45.3% top10 | HIGH concentration + few holders | 38 |
| Liquidity Depth | 1.1% | Better ratio + 5.3M USD | 15 |
| Contract Control | Unknown freeze | Solana conservative default | 35 |
| Tax/Fee | N/A | Solana no taxes | 0 |
| Distribution | 45.3% top10 | High concentration | 15 |
| Burn/Deflation | No burns | None | 80 |
| Adoption | Unknown txs | ~100 estimated (very low!) | 59 |
| Audit | None | Meme, no audit | 80 |

### Weighted Sum
```
(25×0.15) + (38×0.18) + (15×0.18) + (35×0.35) + (0×0) + (15×0.08) + (80×0.04) + (59×0.10) + (80×0.02)
= 3.75 + 6.84 + 2.7 + 12.25 + 0 + 1.2 + 3.2 + 5.9 + 1.6
= 37.44

Apply Meme Baseline: 37.44 < 50, so no adjustment
Apply Meme Minimum: 37.44 > 15, so keep as is

FINAL SCORE: 37/100 = MEDIUM RISK
BUT EXPECTED: 68-75 (CRITICAL)
```

**Issue**: WIF should score CRITICAL but got MEDIUM. Why?

**Root Cause**:
1. **Top 10 Holders at 45.3%** should trigger higher concentration penalty
2. **Unknown freeze authority** giving only +35 instead of realistic +70
3. **Adoption is too estimated** (no real Solana tx data available)

**Solution**: Need Helius API or on-chain Solana data fetching

---

## Data Availability Summary

### What We Can Get For All Chains
```
✅ Market Cap (Mobula)
✅ Volume 24h (Mobula)
✅ Liquidity (Mobula)
✅ Price (Mobula)
✅ Supply data (Mobula)
```

### What We Get For EVM Only
```
✅ Honeypot detection (GoPlus)
✅ Tax/fee info (GoPlus)
✅ Owner status (GoPlus)
✅ LP lock status (GoPlus)
✅ Transaction patterns (Moralis)
✅ Holder history (Moralis)
```

### What We Can't Get (Missing APIs)
```
❌ Solana freeze authority (need Helius/RPC)
❌ Solana mint authority (need Helius/RPC)
❌ Solana transaction history (Moralis doesn't support)
❌ Cardano script details (need Blockfrost)
❌ Real-time holder changes (API lag)
```

### Our Solution
```
For Missing Data:
├─ Use heuristic estimates (marked as estimated)
├─ Apply conservative defaults (assume worst case)
├─ Never show estimates to users (API only returns real data)
└─ Document what's missing in logs
```

---

## Code Flow Summary

```
User Input: tokenAddress, chainId
  ↓
[1] fetchCompleteTokenData()
  ├─ Parallel API calls: Mobula + Moralis + GoPlus
  ├─ Chain detection (EVM vs Solana vs Cardano)
  ├─ Data fallback logic
  └─ Mark estimated fields
  ↓
[2] adaptCompleteToLegacy()
  ├─ Convert to legacy TokenData format
  ├─ Set chain field
  └─ Extract security flags
  ↓
[3] calculateRisk()
  ├─ Detect meme status (AI or keyword)
  ├─ Calculate 9 factor scores
  ├─ Get weights based on (meme? + chain)
  ├─ Aggregate: sum(score × weight)
  ├─ Apply overrides (critical flags)
  └─ Return 0-100 score
  ↓
[4] classifyRisk()
  ├─ 0-19: LOW ✅
  ├─ 20-34: LOW ✅
  ├─ 35-49: MEDIUM ⚠️
  ├─ 50-74: HIGH 🔴
  └─ 75-100: CRITICAL 🚨
  ↓
[5] API Response
  ├─ Overall score
  ├─ Risk level
  ├─ Factor breakdown
  ├─ Raw data (REAL values only, no estimates!)
  └─ Confidence score
```

---

## Key Insights

### Why Solana Scores Are Conservative
1. **No transaction data** available (Moralis incompatible)
2. **Unknown freeze authority** (must assume worst case)
3. **Contract control weighted 35%** (vs EVM 12%)
4. **Result**: Solana tokens score 20-30 points higher than equivalent EVM tokens

### Why Meme Tokens Score Higher
1. **Whale concentration matters more** (22% vs 18%)
2. **Liquidity rug pulls common** (20% vs 16%)
3. **Adoption hype-driven** (15% vs 10%)
4. **Result**: Memes baseline +15 penalty

### Why Some Tokens Seem Wrong
**Possible reasons**:
1. Data is estimated (age, txCount) - not real API values
2. Chain-specific weights applied (Solana different from EVM)
3. Meme detection triggered (unexpected weight shift)
4. Critical flag threshold activated (min score override)
5. Missing data using conservative defaults (assume worst)

---

## How to Explain This to Non-Technical People

**Simple Version**:
```
"We check 9 things about a token:
1. Can supply be printed? (inflation risk)
2. Are tokens held by few people? (whale dump risk)
3. Can you actually sell? (liquidity risk)
4. Can owner steal funds? (contract risk)
5. Are there hidden fees? (tax scam)
6. Is it fairly distributed? (presale scam)
7. Is supply decreasing? (deflation benefit)
8. Is it actually used? (adoption)
9. Is code audited? (transparency)

We weight these based on the type of token and blockchain.
Then we score 0-100, where 100 = almost certain scam."
```

---

## How to Explain to Technical People

```
"9-factor weighted algorithm with chain-specific profiles.
EVM uses GoPlus for security, Solana uses conservative defaults 
for missing freeze authority data.
Meme tokens get higher concentration/liquidity weights.
Parallel API fetching with smart fallbacks.
Score = weighted_sum(factors), capped by critical flags.
Classification: 0-19/20-34 = LOW, 35-49 = MEDIUM, 50-74 = HIGH, 75-100 = CRITICAL.
User API only shows real fetched data, never estimates."
```

---

**END OF EXPLANATION**

This document can now be referenced by Grok or other AI models to understand and explain Token Guard Pro's risk algorithm.
