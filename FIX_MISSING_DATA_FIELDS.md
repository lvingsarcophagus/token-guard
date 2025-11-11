# 🐛 Missing Data Fields - Fix Plan

## Problem Summary

The risk calculator depends on:
1. **txCount24h** - Transaction count in last 24h
2. **ageDays** - Token age in days

Both are fetched from Mobula API but may not be in the response for all tokens.

**Current behavior** (line 198):
```typescript
txCount24h: data.transactions_24h || data.tx_count_24h || 0,  // Falls back to 0
ageDays: ... // Falls back to 0
```

**When these are 0**:
- `calcAdoption()` uses baseline penalties (very high adoption risk)
- Age-based multiplier is set to 1.0 (no reduction)
- Result: All tokens get adoption score ~53-59

## Solution

### Option A: Use Alternative Data Sources
1. **Moralis API** - Has holder transaction history
2. **Helius (Solana)** - Better for Solana tx data
3. **Fallback heuristic** - Use volume/holders to estimate

### Option B: Adjust Algorithm When Data Missing
1. If `txCount24h === 0` AND `ageDays === 0`, flag as "insufficient data"
2. Apply conservative scores
3. Add warning to user

### Option C: Get Data from Different Fields (Recommended)
Check if Mobula returns data in different field names:
- `tx_count` vs `transactions` vs `transaction_count`
- `created_at` vs `launch_date` vs `deployment_date`
- `trades_24h` vs `transaction_volume`

## Implementation

We should:
1. Log the actual Mobula response to see what fields are available
2. Try additional fallback field names
3. Use Moralis transaction data as secondary source
4. Document which fields each API provides

