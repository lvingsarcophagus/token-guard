# CRITICAL: There are TWO Solana Data Fetching Functions

## The Problem

The logs show TWO different holder counts being fetched:

1. **OLD RPC Method** (used for risk calculation):
   ```
   📊 [Solana] RPC Response: {"jsonrpc": "2.0"...
   📊 [Solana] Largest holders count: 20
   👥 [Solana] Holder count: 20 (estimated from MC)
   ✓ [Solana] Chain data fetched - Holders: 20
   ```
   This returns 20 holders and is used in the risk calculation.

2. **NEW Helius Pagination** (used for dashboard only):
   ```
   [Helius] Total unique holders: 19971 (minimum, hit pagination limit)
   [Helius] Enhanced data retrieved: {holderCount: 19971}
   ```
   This returns 19,971 holders but is NOT used in risk calculation.

## Why This Happens

There must be OLD CODE in `lib/data/chain-adaptive-fetcher.ts` or another file that's still using:
- `getTokenLargestAccounts` RPC method
- Logging "RPC Response", "Largest holders count", "estimated from MC"

This old code runs BEFORE the new Helius enhanced data fetch and returns 20 holders to the risk calculator.

## The Solution

You need to find and DELETE the old Solana fetching code. Search for these strings in `lib/data/chain-adaptive-fetcher.ts`:

1. Search for: `getTokenLargestAccounts`
2. Search for: `RPC Response`
3. Search for: `Largest holders count`
4. Search for: `estimated from MC`

Then DELETE that entire old function/code block.

## Current State

- ✅ Helius pagination is working (returns 19,971)
- ✅ Dead token detector is fixed
- ✅ Firestore errors are fixed
- ❌ **Risk calculator still uses old RPC data (20 holders)**
- ❌ **Pump.fun Rug detector still triggers on "20 holders"**
- ❌ **Score is still 67/100 (HIGH) instead of 24-30/100 (LOW)**

## Expected After Fix

- Holders: 19,971 (not 20)
- Risk Score: 24-30/100 (LOW)
- No Pump.fun Rug warning
- Risk Level: LOW (not HIGH)

## How to Find the Old Code

Open `lib/data/chain-adaptive-fetcher.ts` and use Ctrl+F to search for "getTokenLargestAccounts". 
Delete the entire function that contains this RPC call.

There should only be ONE `fetchSolanaChainData` function that uses `getHeliusEnhancedData`.
