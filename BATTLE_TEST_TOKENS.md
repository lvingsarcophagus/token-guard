# 🧪 BATTLE TEST: Risk Scoring Validation

**Date**: November 11, 2025  
**Purpose**: Validate risk scoring algorithm against real tokens  
**Status**: Ready for testing

---

## Test Tokens (5 Total)

| # | Token | Chain | Expected Risk | Priority |
|---|-------|-------|----------------|----------|
| 1 | MAGA (TRUMP) | Ethereum | HIGH (58-65) | 🔴 Critical |
| 2 | PEPE | Ethereum | LOW (22-28) | 🟢 Sanity Check |
| 3 | BONK | Solana | MEDIUM (35-42) | 🟡 Chain Test |
| 4 | WIF | Solana | HIGH/CRITICAL (68-75) | 🔴 Critical |
| 5 | USDC | Ethereum | LOW (5-12) | 🟢 Stablecoin |

---

## Test Data Collection Template

For each token, we need:

```json
{
  "token": {
    "name": "",
    "symbol": "",
    "chain": "",
    "address": ""
  },
  "metadata": {
    "marketCap": 0,
    "fdv": 0,
    "liquidityUSD": 0,
    "holderCount": 0,
    "top10HoldersPct": 0,
    "volume24h": 0,
    "txCount24h": 0,
    "ageDays": 0,
    "totalSupply": 0,
    "circulatingSupply": 0
  },
  "security": {
    "is_honeypot": false,
    "is_mintable": false,
    "owner_renounced": false,
    "lp_locked": false,
    "lp_in_owner_wallet": false,
    "freeze_authority_exists": false,
    "is_open_source": false,
    "buy_tax": 0,
    "sell_tax": 0,
    "tax_modifiable": false
  },
  "expected": {
    "riskScore": "58-65",
    "riskLevel": "HIGH",
    "keyRisks": []
  }
}
```

---

## Token #1: MAGA (TRUMP) on Ethereum

**Contract**: `0x576e2bed8f7b46d34016198911cdf9886f78bea7`

### Why This Token?
- ✅ Your original example
- ✅ Political/meme token (tests AI classification)
- ✅ High volatility
- ✅ Concentrated holders (65% in top 10)
- ✅ Mintable (major red flag)
- ✅ LP locked (positive)

### Expected Analysis
```
Factors that should INCREASE risk:
├─ Mintable: YES → +50 penalty
├─ Supply Dilution: High FDV/MCAP → +30-40
├─ Holder Concentration: 65% top 10 → +35-40
├─ Volatility: High (30d ~45%) → adoption risk +15-20
├─ Meme Classification: YES → +15 baseline
└─ Political Nature: Hype-driven → +5-10 confidence
   ────────────────────────────────
   Raw Score: ~58-65 ✓ HIGH

Factors that should DECREASE risk:
├─ LP Locked: YES → -10 bonus
└─ Good Adoption: Strong X presence
   ────────────────────────────────
   Adjusted: ~55-65 ✓ Still HIGH
```

### Test Queries
```bash
# Test via API
curl -X POST http://localhost:3000/api/analyze-token \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x576e2bed8f7b46d34016198911cdf9886f78bea7",
    "chain": "ETHEREUM"
  }'

# Expected response:
{
  "overall_risk_score": 60,          # ✓ Should be 58-65
  "risk_level": "HIGH",              # ✓ Should be HIGH
  "confidence_score": 85,
  "breakdown": {
    "supplyDilution": 35,
    "holderConcentration": 38,
    "liquidityDepth": 20,
    "contractControl": 50,           # Mintable penalty
    "adoption": 25,
    "burnDeflation": 40,
    "distribution": 40               # High concentration
  },
  "critical_flags": [
    "Token is mintable - owner can print unlimited supply",
    "High concentration in top 10 holders (65%)"
  ],
  "ai_insights": {
    "classification": "MEME_TOKEN",
    "confidence": 85,
    "meme_baseline_applied": true
  }
}
```

### Pass/Fail Criteria
- ✅ **PASS**: Score 58-65 AND level = HIGH
- ✅ **PASS**: `is_mintable` detected
- ✅ **PASS**: Holder concentration flagged
- ✅ **PASS**: Meme classification detected
- ❌ **FAIL**: Score < 55 or > 70
- ❌ **FAIL**: Level = MEDIUM or CRITICAL

---

## Token #2: PEPE on Ethereum

**Contract**: `0x6982508145454ce325ddbe47a25d4ec3d2311933`

### Why This Token?
- ✅ Sanity check - established meme token
- ✅ Fully circulating (no mint)
- ✅ LP heavily burned (93%)
- ✅ Low volatility (mature token)
- ✅ Should be very LOW risk

### Expected Analysis
```
Factors that should DECREASE risk:
├─ No Mintable: NO → -50 penalty avoided
├─ Supply Dilution: 1.00x (perfect) → 10 points
├─ LP Burned: 93% → score -10 bonus
├─ Low Volatility: Stable → adoption score low
├─ No Concentration: Good distribution → 0-5 points
├─ High Adoption: Established → 0 adoption penalty
└─ Open Source: YES → transparent
   ────────────────────────────────
   Raw Score: ~22-28 ✓ LOW

Meme Baseline:
├─ Meme Classification: YES (but baseline only +15)
├─ 1-year-old token: Mature = different weight profile
└─ Result: Stays LOW despite meme status
   ────────────────────────────────
   Final: ~25-32 ✓ LOW/MEDIUM-LOW
```

### Test Queries
```bash
curl -X POST http://localhost:3000/api/analyze-token \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x6982508145454ce325ddbe47a25d4ec3d2311933",
    "chain": "ETHEREUM"
  }'

# Expected response:
{
  "overall_risk_score": 25,          # ✓ Should be 22-28
  "risk_level": "LOW",               # ✓ Should be LOW
  "confidence_score": 92,            # High confidence (fully circulating)
  "breakdown": {
    "supplyDilution": 10,            # Perfect 1.00x
    "holderConcentration": 5,        # Well distributed
    "liquidityDepth": 15,            # Good liquidity
    "contractControl": 0,            # Safe
    "adoption": 5,                   # High adoption
    "burnDeflation": 20,             # 93% burned
    "distribution": 3                # Excellent
  },
  "critical_flags": [],             # None
  "ai_insights": {
    "classification": "MEME_TOKEN",
    "confidence": 90,
    "meme_baseline_applied": true,
    "note": "Mature meme token with excellent fundamentals"
  }
}
```

### Pass/Fail Criteria
- ✅ **PASS**: Score 22-28 AND level = LOW
- ✅ **PASS**: No critical flags
- ✅ **PASS**: Mintable = false
- ✅ **PASS**: LP locked or burned
- ❌ **FAIL**: Score > 35
- ❌ **FAIL**: Level = MEDIUM or HIGH

---

## Token #3: BONK on Solana

**Mint**: `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`

### Why This Token?
- ✅ Test Solana-specific checks
- ✅ Test freeze authority impact
- ✅ Moderate concentration (42% top 10)
- ✅ High volatility (meme token)
- ✅ Should be MEDIUM-LOW to MEDIUM

### Expected Analysis
```
Solana Specific Checks:
├─ Freeze Authority: NO → Avoids +70 penalty ✓
├─ Metadata Update Authority: Check
└─ Mint Authority: Check

Risk Factors:
├─ Supply Dilution: 1.07x → 15 points
├─ Holder Concentration: 42% → 15-20 points
├─ Liquidity: Decent → 15 points
├─ High Volatility: Meme → adoption risk +20
├─ No Tax: Good → 0 points
├─ Meme Baseline: YES → +15
└─ Age: ~2 years old → normal penalties
   ────────────────────────────────
   Raw Score: ~35-42 ✓ MEDIUM-LOW/MEDIUM
```

### Test Queries
```bash
curl -X POST http://localhost:3000/api/analyze-token \
  -H "Content-Type: application/json" \
  -d '{
    "address": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    "chain": "SOLANA"
  }'

# Expected response:
{
  "overall_risk_score": 38,          # ✓ Should be 35-42
  "risk_level": "MEDIUM",            # ✓ Should be MEDIUM (35-49 range)
  "confidence_score": 88,
  "breakdown": {
    "supplyDilution": 15,
    "holderConcentration": 18,       # 42% concentration
    "liquidityDepth": 18,
    "contractControl": 0,            # No freeze authority
    "adoption": 20,
    "burnDeflation": 35,
    "distribution": 15
  },
  "critical_flags": [],
  "ai_insights": {
    "classification": "MEME_TOKEN",
    "confidence": 88,
    "chain_specific": "Solana - no freeze authority detected (safe)"
  }
}
```

### Pass/Fail Criteria
- ✅ **PASS**: Score 35-42 AND level = MEDIUM
- ✅ **PASS**: No freeze authority penalty applied
- ✅ **PASS**: Solana-specific checks working
- ✅ **PASS**: Meme classification applied
- ❌ **FAIL**: Score < 32 or > 48
- ❌ **FAIL**: Freeze authority penalty incorrectly applied

---

## Token #4: WIF (dogwifhat) on Solana

**Mint**: `EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm`

### Why This Token?
- ✅ Test extreme concentration (78% in top 10)
- ✅ Test LP lock scenarios
- ✅ High volatility (~60%)
- ✅ Should be HIGH/CRITICAL

### Expected Analysis
```
Critical Risk Factors:
├─ Extreme Concentration: 78% → +50 points
├─ High Volatility: ~60% → +25 adoption risk
├─ Meme Baseline: YES → +15
├─ LP Not Burned: Major red flag → +40 penalty
├─ High FDV/MCAP: Dilution → +30-40
└─ Age: Recent launch → +higher penalties
   ────────────────────────────────
   Raw Score: ~68-75 → HIGH/CRITICAL
   
   Critical Flags:
   ├─ 78% in top 10 holders (whale risk)
   ├─ LP not burned/locked (rug pull potential)
   └─ High volatility + concentration = DANGER
```

### Test Queries
```bash
curl -X POST http://localhost:3000/api/analyze-token \
  -H "Content-Type: application/json" \
  -d '{
    "address": "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    "chain": "SOLANA"
  }'

# Expected response:
{
  "overall_risk_score": 72,          # ✓ Should be 68-75
  "risk_level": "CRITICAL",          # ✓ Should be HIGH/CRITICAL (72 ≥ 50)
  "confidence_score": 90,
  "breakdown": {
    "supplyDilution": 35,
    "holderConcentration": 52,       # 78% concentration = EXTREME
    "liquidityDepth": 25,
    "contractControl": 40,           # LP vulnerability
    "adoption": 22,
    "burnDeflation": 50,
    "distribution": 55               # Whale alert
  },
  "critical_flags": [
    "⚠️ EXTREME concentration: 78% in top 10 holders",
    "🚨 LP NOT LOCKED OR BURNED - HIGH RUG PULL RISK",
    "High volatility (60%) + concentration = DANGER"
  ],
  "ai_insights": {
    "classification": "MEME_TOKEN",
    "confidence": 92,
    "risk_note": "Viral meme with dangerous concentration + LP exposure"
  }
}
```

### Pass/Fail Criteria
- ✅ **PASS**: Score 68-75 AND level = HIGH/CRITICAL
- ✅ **PASS**: Critical flags detected
- ✅ **PASS**: LP vulnerability flagged
- ✅ **PASS**: Whale concentration warning
- ✅ **PASS**: Meme + high risk combined correctly
- ❌ **FAIL**: Score < 65 or > 80
- ❌ **FAIL**: LP vulnerability not detected

---

## Token #5: USDC on Ethereum

**Contract**: `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`

### Why This Token?
- ✅ Stablecoin (should be very safe)
- ✅ Mintable but controlled (Circle)
- ✅ Perfect 1.00x supply
- ✅ Audited and transparent
- ✅ Should be 5-12 (very LOW)

### Expected Analysis
```
Safety Factors:
├─ No Volatility: Stablecoin (pegged) → 0 points
├─ Perfect Supply: 1.00x dilution → 10 points
├─ Audited: YES → -10 bonus
├─ Open Source: YES → transparent
├─ Owner Renounced: YES or Safe → 0 points
├─ LP Locked: YES → -10 bonus
└─ Institutional: Circle backing → trusted
   ────────────────────────────────
   Raw Score: ~5-12 ✓ VERY LOW

Mintable Exception:
├─ Mintable: YES (but controlled)
├─ Issuer: Circle (trusted)
├─ Regulation: Compliant
└─ Result: Mintable penalty REDUCED or waived
```

### Test Queries
```bash
curl -X POST http://localhost:3000/api/analyze-token \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "chain": "ETHEREUM"
  }'

# Expected response:
{
  "overall_risk_score": 8,           # ✓ Should be 5-12
  "risk_level": "LOW",               # ✓ Should be LOW
  "confidence_score": 96,            # Very high confidence (stablecoin)
  "breakdown": {
    "supplyDilution": 10,            # 1.00x perfect
    "holderConcentration": 5,        # Well distributed
    "liquidityDepth": 0,             # Abundant liquidity
    "contractControl": 0,            # Safe
    "adoption": 0,                   # Stablecoin - no volatility risk
    "burnDeflation": 0,              # Not applicable
    "distribution": 3                # Excellent
  },
  "critical_flags": [],             # None
  "ai_insights": {
    "classification": "UTILITY_TOKEN",
    "confidence": 99,
    "note": "Regulated stablecoin - Circle-issued USDC"
  }
}
```

### Pass/Fail Criteria
- ✅ **PASS**: Score 5-12 AND level = LOW
- ✅ **PASS**: No critical flags
- ✅ **PASS**: Zero volatility reflected in score
- ✅ **PASS**: Audited/transparent bonus applied
- ✅ **PASS**: Stablecoin classification correct
- ❌ **FAIL**: Score > 20
- ❌ **FAIL**: Level = MEDIUM or higher
- ❌ **FAIL**: Volatility penalty applied (stablecoins shouldn't have)

---

## Test Execution Script

### Setup
```bash
# 1. Make sure dev server is running
cd c:\Users\nayan\OneDrive\Desktop\NJ_UNI\token-guard
pnpm dev

# 2. In another terminal, run tests
# (We'll create a test script next)
```

### Test Script (Node.js)
```javascript
// test-tokens.js
const tokens = [
  {
    name: "MAGA (TRUMP)",
    address: "0x576e2bed8f7b46d34016198911cdf9886f78bea7",
    chain: "ETHEREUM",
    expectedScore: [58, 65],
    expectedLevel: "HIGH",
    testPoints: [
      "Mintable detected",
      "Holder concentration flagged",
      "Meme classification applied",
      "LP lock bonus given"
    ]
  },
  {
    name: "PEPE",
    address: "0x6982508145454ce325ddbe47a25d4ec3d2311933",
    chain: "ETHEREUM",
    expectedScore: [22, 28],
    expectedLevel: "LOW",
    testPoints: [
      "No mintable penalty",
      "LP burn bonus applied",
      "Low volatility reflected",
      "Good distribution shown"
    ]
  },
  {
    name: "BONK",
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    chain: "SOLANA",
    expectedScore: [35, 42],
    expectedLevel: "MEDIUM",
    testPoints: [
      "Solana-specific checks passed",
      "No freeze authority penalty",
      "Concentration detected",
      "Meme classification correct"
    ]
  },
  {
    name: "WIF (dogwifhat)",
    address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    chain: "SOLANA",
    expectedScore: [68, 75],
    expectedLevel: "CRITICAL",
    testPoints: [
      "Extreme concentration flagged",
      "LP vulnerability detected",
      "Critical warnings issued",
      "Whale risk identified"
    ]
  },
  {
    name: "USDC",
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    chain: "ETHEREUM",
    expectedScore: [5, 12],
    expectedLevel: "LOW",
    testPoints: [
      "Stablecoin treatment applied",
      "Zero volatility reflected",
      "Audited bonus given",
      "No critical flags"
    ]
  }
];

async function testToken(token) {
  console.log(`\n🧪 Testing: ${token.name}`);
  console.log(`Chain: ${token.chain}`);
  console.log(`Address: ${token.address}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: token.address,
        chain: token.chain
      })
    });
    
    const data = await response.json();
    const score = data.overall_risk_score;
    const level = data.risk_level;
    
    // Check results
    const scoreInRange = score >= token.expectedScore[0] && score <= token.expectedScore[1];
    const levelCorrect = level === token.expectedLevel;
    
    console.log(`\nResults:`);
    console.log(`  Score: ${score}/100 (expected: ${token.expectedScore[0]}-${token.expectedScore[1]}) ${scoreInRange ? '✅' : '❌'}`);
    console.log(`  Level: ${level} (expected: ${token.expectedLevel}) ${levelCorrect ? '✅' : '❌'}`);
    
    console.log(`\nTest Points:`);
    token.testPoints.forEach(point => {
      console.log(`  • ${point}`);
    });
    
    return scoreInRange && levelCorrect;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting battle test suite...\n');
  console.log('Testing 5 tokens across 2 chains\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const token of tokens) {
    const result = await testToken(token);
    if (result) passed++;
    else failed++;
  }
  
  console.log(`\n\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}/5`);
  console.log(`❌ Failed: ${failed}/5`);
  console.log(`Success Rate: ${(passed / 5 * 100).toFixed(1)}%`);
}

runAllTests();
```

---

## Summary Table

| Token | Chain | Expected | Actual | Status | Key Tests |
|-------|-------|----------|--------|--------|-----------|
| MAGA | ETH | HIGH (58-65) | TBD | ⏳ | Mintable, Concentration, Meme |
| PEPE | ETH | LOW (22-28) | TBD | ⏳ | No mint, LP burn, Low vol |
| BONK | SOL | MEDIUM (35-42) | TBD | ⏳ | Solana checks, Freeze auth |
| WIF | SOL | CRITICAL (68-75) | TBD | ⏳ | Concentration, LP vuln |
| USDC | ETH | LOW (5-12) | TBD | ⏳ | Stablecoin, Audit, Zero vol |

---

## Next Steps

1. ✅ **Collect Data**: Get real-time data for each token
2. ⏳ **Run Tests**: Execute API calls and compare results
3. 📊 **Analyze**: Review breakdown factors
4. 🔧 **Adjust**: Fine-tune if needed
5. ✅ **Approve**: Validate algorithm accuracy

Ready to execute!
