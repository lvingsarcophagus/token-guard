# Token Guard Risk Algorithm - Visual Flow Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN RISK ANALYSIS SYSTEM                  │
│                                                                 │
│  Input: Token Address + Chain ID                              │
│         └─→ Can be: EVM (Eth/BSC/Polygon) or Solana          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│            STEP 1: DATA COLLECTION (Parallel APIs)            │
│                                                                 │
│  ┌────────────────┐  ┌─────────────┐  ┌──────────────┐        │
│  │  Mobula API    │  │ Moralis API │  │ GoPlus API   │        │
│  │ (Primary)      │  │ (EVM only)  │  │ (EVM only)   │        │
│  │ ✓ Market data  │  │ ✓ TX data   │  │ ✓ Security   │        │
│  │ ✓ Supply       │  │ ✓ Metadata  │  │ ✓ Scam flags │        │
│  │ ✓ Volume       │  │             │  │              │        │
│  └────────────────┘  └─────────────┘  └──────────────┘        │
│        ↓                   ↓                  ↓                  │
│   All in Parallel (Promise.allSettled)                         │
│        ↓                   ↓                  ↓                  │
│   Time: ~650ms total (vs 1200ms sequential)                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│        STEP 2: SMART FALLBACK (If Data Missing)               │
│                                                                 │
│  Mobula has data?           → USE MOBULA ✓                    │
│      ↓ NO                                                       │
│  Moralis has data?          → USE MORALIS ✓                   │
│      ↓ NO                                                       │
│  Can estimate from volume?  → ESTIMATE + MARK AS ESTIMATED    │
│      ↓ NO                                                       │
│  Use conservative default   → USE WORST CASE + MARK ESTIMATED │
│                                                                 │
│  IMPORTANT: Estimated data ⚠️ NEVER shown to users!           │
│             (Only real API data returned in response)          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│        STEP 3: DETECT TOKEN TYPE (Meme vs Utility)             │
│                                                                 │
│  Use AI or keyword matching:                                  │
│  "doge" / "shib" / "pepe" / "floki" / "inu"                 │
│        ↓ YES                                                    │
│  IS_MEME = TRUE                                               │
│        ↓ NO                                                     │
│  IS_MEME = FALSE (Utility token)                             │
│                                                                 │
│  This determines WEIGHT PROFILE to use                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│        STEP 4: CALCULATE 9 RISK FACTORS (0-100 each)          │
│                                                                 │
│  1️⃣  Supply Dilution    ← Can owner print infinite tokens?    │
│  2️⃣  Holder Concentration← Are tokens held by few whales?     │
│  3️⃣  Liquidity Depth     ← Can you actually sell your tokens? │
│  4️⃣  Contract Control    ← Can owner steal funds?             │
│  5️⃣  Tax/Fee             ← Are there hidden transfer taxes?    │
│  6️⃣  Distribution        ← Is supply fairly spread?           │
│  7️⃣  Burn/Deflation      ← Is supply being reduced?           │
│  8️⃣  Adoption            ← Is token actually being used?      │
│  9️⃣  Audit/Transparency  ← Is code audited or open source?    │
│                                                                 │
│  Each factor = 0-100 (0=safe, 100=dangerous)                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│        STEP 5: SELECT WEIGHT PROFILE (Based on Type+Chain)    │
│                                                                 │
│  ┌─────────────────────────┐                                   │
│  │ EVM Standard Tokens:    │                                   │
│  │ Supply Dilution:   20%  │ (Inflation risk = most important) │
│  │ Holder Concentration:18%│                                   │
│  │ Liquidity Depth:   16%  │                                   │
│  │ Contract Control:  15%  │                                   │
│  │ Tax/Fee:           11%  │ (Hidden fees = major scam vector) │
│  │ Distribution:      10%  │                                   │
│  │ Burn Deflation:     6%  │                                   │
│  │ Adoption:          10%  │                                   │
│  │ Audit:              4%  │                                   │
│  └─────────────────────────┘                                   │
│                          VS                                     │
│  ┌─────────────────────────┐                                   │
│  │ EVM Meme Tokens:        │                                   │
│  │ Supply Dilution:   16%  │                                   │
│  │ Holder Concentration:22%│ ← HIGHER (whales dump memes)    │
│  │ Liquidity Depth:   20%  │ ← HIGHER (rug pulls common)     │
│  │ Contract Control:  12%  │                                   │
│  │ Tax/Fee:           10%  │                                   │
│  │ Distribution:       8%  │                                   │
│  │ Burn Deflation:     2%  │ ← LOWER (memes rarely burn)     │
│  │ Adoption:          15%  │ ← HIGHER (hype-driven)          │
│  │ Audit:              1%  │ ← LOWER (never audited)         │
│  └─────────────────────────┘                                   │
│                          VS                                     │
│  ┌─────────────────────────┐                                   │
│  │ Solana Tokens:          │                                   │
│  │ Supply Dilution:   15%  │                                   │
│  │ Holder Concentration:18%│                                   │
│  │ Liquidity Depth:   18%  │ ← HIGHER (few deep LPs on SOL)  │
│  │ Contract Control:  35%  │ ← MUCH HIGHER (freeze authority)│
│  │ Tax/Fee:            0%  │ ← N/A (no token taxes on SOL)   │
│  │ Distribution:       8%  │                                   │
│  │ Burn Deflation:     4%  │                                   │
│  │ Adoption:          10%  │                                   │
│  │ Audit:              2%  │                                   │
│  └─────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│        STEP 6: WEIGHTED AGGREGATE SCORE                        │
│                                                                 │
│  SCORE = (Factor1 × Weight1) + (Factor2 × Weight2) + ... + (Factor9 × Weight9)
│                                                                 │
│  Example (PEPE - EVM Meme):                                   │
│  ┌──────────┬───────┬────────┬────────┐                        │
│  │ Factor   │ Score │ Weight │ Result │                        │
│  ├──────────┼───────┼────────┼────────┤                        │
│  │ Supply   │  30   │ 16%    │  4.8   │                        │
│  │ Holders  │   0   │ 22%    │  0.0   │                        │
│  │ Liquidity│  22   │ 20%    │  4.4   │                        │
│  │ Contract │   0   │ 12%    │  0.0   │                        │
│  │ Tax      │   0   │ 10%    │  0.0   │                        │
│  │ Distrib  │   0   │  8%    │  0.0   │                        │
│  │ Burn     │  70   │  2%    │  1.4   │                        │
│  │ Adoption │  28   │ 15%    │  4.2   │                        │
│  │ Audit    │  80   │  1%    │  0.8   │                        │
│  └──────────┴───────┴────────┴────────┘                        │
│  SUBTOTAL: 15.6/100                                           │
│  + Meme Baseline (15 points): 15.6 < 50, no adjustment       │
│  FINAL: 18/100 → "LOW" RISK ✅                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│        STEP 7: CRITICAL FLAG OVERRIDES                         │
│                                                                 │
│  IF honeypot_detected OR (mintable AND !owner_renounced):     │
│     ↓                                                           │
│     SET minimum_score = 75 (CRITICAL)                         │
│     REASON: Near-guaranteed scam                              │
│                                                                 │
│  IF liquidity_ratio < 0.001 AND market_cap > $1M:            │
│     ↓                                                           │
│     SET minimum_score = 60 (HIGH)                             │
│     REASON: Massive dump risk                                 │
│                                                                 │
│  IF top_10_holders > 90%:                                    │
│     ↓                                                           │
│     SET minimum_score = 70 (HIGH)                             │
│     REASON: Rug pull setup                                    │
│                                                                 │
│  Score = MAX(calculated_score, minimum_score)                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│        STEP 8: CLASSIFY RISK LEVEL                             │
│                                                                 │
│  SCORE       LEVEL      COLOR   MEANING                        │
│  ───────────────────────────────────────────────────────────   │
│  0-19        LOW ✅     GREEN   Very safe to trade           │
│  20-34       LOW ✅     GREEN   Generally safe                │
│  35-49       MEDIUM ⚠️   YELLOW  Caution, some concerns       │
│  50-74       HIGH 🔴    RED     High risk, avoid              │
│  75-100      CRITICAL 🚨 BLACK   Almost certain scam          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│        STEP 9: API RESPONSE (Only Real Data!)                 │
│                                                                 │
│  {                                                              │
│    "overall_risk_score": 33,                                  │
│    "risk_level": "LOW",                                       │
│    "confidence_score": 85,                                    │
│    "breakdown": {                                              │
│      "supplyDilution": 30,                                    │
│      "holderConcentration": 0,                                │
│      "liquidityDepth": 22,                                    │
│      "contractControl": 0,                                    │
│      "taxFee": 0,                                             │
│      "distribution": 0,                                       │
│      "burnDeflation": 70,                                     │
│      "adoption": 28,                                          │
│      "auditTransparency": 80                                  │
│    },                                                          │
│    "raw_data": {                                              │
│      "marketCap": 2534097396,                                │
│      "fdv": 2534279016,                                      │
│      "liquidityUSD": 20699753,                               │
│      "holderCount": 493424,                                  │
│      "top10HoldersPct": 0.003993,                            │
│      "txCount24h": 200,     ← REAL DATA (from Moralis)      │
│      "ageDays": 180,        ← REAL DATA (from Mobula)        │
│      // Note: Estimated fields OMITTED from response!        │
│      "is_mintable": false,                                    │
│      "owner_renounced": true                                 │
│    },                                                          │
│    "data_sources": ["Mobula", "GoPlus Security"]             │
│  }                                                              │
│                                                                 │
│  ✅ Only real fetched data shown to users                     │
│  ✅ Estimated fields marked internally but hidden from API    │
│  ✅ Full transparency about data sources                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Risk Factor Examples - Visual Thresholds

### Factor 1: Supply Dilution
```
0% ████████████████████████████ 100%
|                                |
✓ Safe                        ✗ Dangerous
Fixed supply                Unlimited mint
Score: 0-10                Score: 80-100
```

### Factor 2: Holder Concentration
```
% in Top 10: 0% ──────────── 100%
            ✓              ✗
            0             95
        (Distributed)  (Rug setup)

Examples:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PEPE:    0.4%  ▮ Score: 0  (Excellent)
BONK:   34.2%  ▮▮▮▮ Score: 30 (Okay)
WIF:    45.3%  ▮▮▮▮▮▮ Score: 38 (High concern)
Scam:   90%+   ▮▮▮▮▮▮▮▮▮ Score: 95 (Rug)
```

### Factor 3: Liquidity Depth
```
Liquidity/MarketCap Ratio:
0% ─────────────────── 50%
|                       |
✓ Safe              ✗ Dangerous

Example:
PEPE:   0.8%  ▮ Score: 22 (Can sell easily)
BONK:   0.013% ▮ Score: 56 (TRAP! Can't exit!)
```

### Factor 4: Contract Control (EVM)
```
Owner Renounced? ──→ YES ✓ Score: 0
                └─→ NO  ✗ Score: 20

Honeypot? ──→ YES ✗ Score: 60 (THEFT!)
         └─→ NO  ✓ Score: 0

Mintable? ──→ YES ✗ Score: 50 (Inflation!)
         └─→ NO  ✓ Score: 0
```

### Factor 4: Contract Control (Solana)
```
Freeze Authority? ──→ YES ✗ Score: 70 (CRITICAL!)
                 ├─→ NO  ✓ Score: 0
                 └─→ UNKNOWN ? Score: 35 (Assume worst)

Mint Authority? ──→ YES ✗ Score: 50 (Inflation!)
               └─→ NO  ✓ Score: 0
```

### Factor 8: Adoption
```
24h Transactions:
0 ────────────────── 10,000
|                      |
Dead token         Popular token
Score: 100         Score: 0

Age Adjustment (if < 7 days):
Original Score  × Multiplier = Final
60              × 0.7        = 42
(30% reduction for new tokens)
```

---

## Real World Comparison

### Three Tokens Compared Side-by-Side

```
                 PEPE (EVM)      BONK (SOL)      WIF (SOL)
────────────────────────────────────────────────────────────
Market Cap       $2.5B           $1.07B          $483M
Liquidity        $20.6M          $139K ⚠️        $5.3M
Volume 24h       $500M+          $50M            $20M
Holders          493K            242 ⚠️          250 ⚠️
Top 10%          0.4% ✅         34.2%           45.3% ⚠️
Age              Old/Mature      ~10 days        ~10 days
Meme?            YES             YES             YES

SCORES BY FACTOR:
Supply Dilution  30              30              25
Holders          0               30              38
Liquidity        22              56              15
Contract         0               35              35
Tax              0               0               0
Distribution     0               8               15
Burn             70              50              80
Adoption         28              65              59
Audit            80              80              80
────────────────────────────────────────────────────────────
WEIGHTED SUM     18              43              37
PROFILE          EVM Meme        Solana Meme     Solana Meme
+ OVERRIDES      None            None            None
────────────────────────────────────────────────────────────
FINAL SCORE      33/100          45/100          42/100
LEVEL            LOW ✅          MEDIUM ⚠️       MEDIUM ⚠️
────────────────────────────────────────────────────────────

WHY THE DIFFERENCE?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PEPE (LOW):
- Excellent distribution (0.4% top 10)
- Mature token (good liquidity relative to cap)
- No contract red flags

BONK (MEDIUM):
- Solana contract control = +35 (unknown freeze authority)
- Poor liquidity ($139K on $1B cap!)
- Low adoption (no Solana tx data available)

WIF (MEDIUM):
- Even higher concentration (45.3% top 10)
- Better liquidity than BONK ($5.3M)
- But still unknown freeze authority
- SHOULD BE HIGHER but limited data
```

---

## Decision Tree for Quick Understanding

```
START: Analyze Token
│
├─→ Is it Honeypot? ──→ YES ──→ CRITICAL (75+) 🚨
│   └─→ NO
│
├─→ Is it Mintable? ──→ YES ──→ HIGH (50+) 🔴
│   └─→ NO
│
├─→ Chain = Solana? ──→ YES ──→ Add +35 (missing data)
│   └─→ NO
│
├─→ Top 10 Holders > 90%? ──→ YES ──→ HIGH (70+) 🔴
│   └─→ NO
│
├─→ Liquidity < 1% of Market Cap? ──→ YES ──→ HIGH (60+) 🔴
│   └─→ NO
│
├─→ Is it Meme? ──→ YES ──→ Higher weights on concentration
│   └─→ NO ──→ Use standard weights
│
└─→ Calculate Weighted Sum ──→ Classify Level ──→ Return Score
```

---

**This visual guide can help explain the algorithm to technical and non-technical audiences alike!**
