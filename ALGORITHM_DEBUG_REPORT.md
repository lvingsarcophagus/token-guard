# 🔍 Algorithm Debug Report - Battle Test Results

**Date**: November 11, 2025  
**Test Status**: ❌ 0/5 Passed (0.0%)  
**Issue Identified**: Data Quality Problem (Missing Critical Fields)

---

## 🚨 Critical Finding

**ROOT CAUSE**: The unified data fetcher is not providing critical fields:
- ❌ `txCount24h` - Missing (affects adoption factor)
- ❌ `ageDays` - Missing (affects age-based multiplier)

These fields are **CRITICAL** for the adoption calculation because:

```typescript
// From lib/risk-calculator.ts calcAdoption()
const ageMultiplier = data.ageDays < 7 ? 0.7 : 1.0  // Requires ageDays!

if (data.txCount24h === 0) score += Math.round(45 * ageMultiplier)  // Requires txCount24h!
else if (data.txCount24h < 5) score += Math.round(38 * ageMultiplier)
// ... more tiers depend on txCount24h
```

**Without these fields**: The adoption calculation falls back to baseline high scores (53-59).

---

## 📊 Test Results Analysis

### Token 1: MAGA (TRUMP)
```
Expected: HIGH (58-65)    ❌ FAIL
Actual:   MEDIUM (36)     

Breakdown:
├─ Supply Dilution:  45    (High - expected, FDV/MCAP = 1.0)
├─ Adoption:         53    (⚠️  BASELINE - no tx/age data!)
└─ Burn Deflation:   80    (Very high - unusual)

Raw Data Issues:
├─ Tx 24h:        unknown  ❌
├─ Age (days):    unknown  ❌
├─ Holders:       50,491   ✅
├─ Top 10%:       0.7%     ✅
└─ Market Cap:    $3.77M   ✅
```

**Expected**: With mintable + high concentration + meme = HIGH (58-65)  
**Actual**: Missing adoption tx data keeps score low

---

### Token 2: PEPE
```
Expected: LOW (22-28)     ❌ FAIL
Actual:   MEDIUM (36)     

Breakdown:
├─ Supply Dilution:  30    (Good - 1.00x)
├─ Adoption:         59    (⚠️  BASELINE HIGH!)
└─ Burn Deflation:   70    (Surprisingly high for "93% burned")

Raw Data Issues:
├─ Tx 24h:        unknown  ❌
├─ Age (days):    unknown  ❌
├─ Holders:       493,424  ✅
├─ Top 10%:       0.4%     ✅
└─ Market Cap:    $2.5B    ✅
```

**Expected**: Mature token + no mint + low vol = LOW  
**Problem**: Adoption baseline (59) is pulling score too high

---

### Token 3: BONK (Solana)
```
Expected: MEDIUM (35-42)  ✅ PARTIAL PASS
Actual:   MEDIUM (44)     (Close!)

Breakdown:
├─ Holder Concentration: 30  (34.2% in top 10)
├─ Adoption:         59      (⚠️  BASELINE HIGH!)
└─ Liquidity Depth:  56      (⚠️  Unusual for DEX token)

Raw Data Issues:
├─ Tx 24h:        unknown   ❌
├─ Age (days):    unknown   ❌
├─ Holders:       245       ⚠️  (Very low for Solana!)
├─ Top 10%:       34.2%     ✅
└─ Market Cap:    $1.07B    ✅
```

**Issue**: Low holder count (245) is suspicious - might be Moralis limitation on Solana

---

### Token 4: WIF (dogwifhat)
```
Expected: CRITICAL (68-75) ❌ MAJOR FAIL
Actual:   MEDIUM (42)     

Breakdown:
├─ Holder Concentration: 38  (45.3% in top 10 = WHALE RISK!)
├─ Adoption:         53      (⚠️  BASELINE - should be MUCH HIGHER!)
└─ Burn Deflation:   80      

Raw Data Issues:
├─ Tx 24h:        unknown   ❌ (Should be very high for viral token!)
├─ Age (days):    unknown   ❌
├─ Holders:       245       ⚠️  (Suspicious - same as BONK)
├─ Top 10%:       45.3%     ✅
└─ Market Cap:    $483.89M  ✅
```

**Critical Issues**:
1. Holder concentration (45.3%) should add +50+ points
2. Missing tx data prevents detection of viral trading activity
3. Algorithm should classify this as CRITICAL but stops at MEDIUM

---

### Token 5: USDC
```
Expected: LOW (5-12)      ✅ PARTIAL PASS
Actual:   LOW (33)        (Correct level but too HIGH score!)

Breakdown:
├─ Adoption:         39    (Too high for stablecoin)
├─ Burn Deflation:   70    (Should be ~0 for stablecoin)
└─ Holder Concentration: 0 (Good - 0.3% in top 10)

Raw Data Issues:
├─ Tx 24h:        unknown   ❌
├─ Age (days):    unknown   ❌
├─ Holders:       4,235,259 ✅
├─ Top 10%:       0.3%      ✅
└─ Market Cap:    $76.1B    ✅
```

**Issue**: Algorithm doesn't recognize stablecoin = should give massive bonuses/reductions

---

## 🔧 Root Cause Analysis

### Problem 1: Missing `txCount24h`
**Where it comes from**: Mobula API  
**Why it's missing**: The unified fetcher might not be calling Mobula for this data  
**Impact**: Adoption factor stuck at baseline (53-59) instead of 0-45

### Problem 2: Missing `ageDays`
**Where it comes from**: Mobula API (from creation_date)  
**Why it's missing**: Conversion issue in the unified fetcher  
**Impact**: Age-based multiplier can't reduce penalties for new tokens

### Problem 3: Low Holder Count (245)
**Where it comes from**: Moralis API  
**Why it's happening**: Moralis may not support Solana holder count queries well  
**Impact**: Tests show suspiciously low holder count for major tokens

### Problem 4: Missing Stablecoin Logic
**Where it's handled**: In adoption & burn deflation factors  
**Issue**: Algorithm doesn't have stablecoin classification  
**Impact**: USDC gets scored as regular token (adoption=39 instead of ~0)

---

## 📋 Root Cause Checklist

- [ ] **Data Fetcher Issue**: `chain-adaptive-fetcher.ts` not returning txCount24h & ageDays
  - File: `lib/data/chain-adaptive-fetcher.ts`
  - Check: Does it extract these from Mobula response?

- [ ] **Mobula API Issue**: API response doesn't include these fields
  - Fields to verify: `tx_count_24h`, `age_days`, `creation_date`
  - Fallback: Can we calculate txCount24h from Moralis?

- [ ] **Conversion Issue**: `adaptCompleteToLegacy()` function dropping fields
  - File: `app/api/analyze-token/route.ts` lines 40-66
  - Check: Is it mapping all fields correctly?

- [ ] **Stablecoin Detection**: No classification for stablecoins
  - Missing: Check for USDC, USDT, DAI, BUSD addresses
  - Alternative: Check for 1.00 price/stable indicator

---

## 🎯 Required Fixes (Priority Order)

### HIGH PRIORITY (Critical)
1. **Fix Data Fetcher** - Ensure `txCount24h` and `ageDays` are extracted
   - Expected time: 15-30 min
   - Impact: Fixes 80% of test failures

2. **Verify Mobula Response** - Check if API returns these fields
   - Expected time: 5-10 min
   - Impact: Confirms data source issue

3. **Add Stablecoin Detection** - Classify USDC/USDT/DAI
   - Expected time: 10-15 min
   - Impact: Fixes USDC test case

### MEDIUM PRIORITY
4. **Improve Solana Holder Data** - Use Helius instead of Moralis
   - Expected time: 20-30 min
   - Impact: Better accuracy for Solana tokens

5. **Add Detailed Logging** - Log intermediate values in adoption calc
   - Expected time: 5 min
   - Impact: Easier debugging

---

## 🔬 Test Data Summary

| Token | Chain | Market Cap | Holders | Top 10% | Tx24h | Age | Score | Expected |
|-------|-------|-----------|---------|--------|-------|-----|-------|----------|
| MAGA | ETH | $3.77M | 50,491 | 0.7% | ❌ | ❌ | 36 | 58-65 |
| PEPE | ETH | $2.5B | 493,424 | 0.4% | ❌ | ❌ | 36 | 22-28 |
| BONK | SOL | $1.07B | 245* | 34.2% | ❌ | ❌ | 44 | 35-42 |
| WIF | SOL | $483M | 245* | 45.3% | ❌ | ❌ | 42 | 68-75 |
| USDC | ETH | $76.1B | 4.2M | 0.3% | ❌ | ❌ | 33 | 5-12 |

*Suspicious - likely Moralis limitation on Solana

---

## 📝 Next Steps

1. ✅ **Identify missing fields** ← COMPLETE
2. ⏳ **Check unified fetcher** - Read `chain-adaptive-fetcher.ts`
3. ⏳ **Verify Mobula response** - Add detailed logging
4. ⏳ **Fix data extraction** - Update adapter function
5. ⏳ **Add stablecoin logic** - Implement classification
6. ⏳ **Retest all 5 tokens** - Validate fixes
7. ⏳ **Update documentation** - Record what changed

---

## 🛠️ Code Locations to Review

```
lib/
├─ data/
│  └─ chain-adaptive-fetcher.ts    ← Check field extraction
├─ risk-calculator.ts              ← Uses txCount24h & ageDays
└─ types/
   └─ token-data.ts               ← Type definitions

app/
└─ api/
   └─ analyze-token/
      └─ route.ts                  ← Check adaptCompleteToLegacy()
```

