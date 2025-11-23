/**
 * Unified Holder Concentration Calculator
 * Works for both EVM (GoPlus percentage) and Solana (raw balances)
 */

interface HolderData {
  holderCount?: number
  top10HoldersPct?: number
  top50HoldersPct?: number
  top100HoldersPct?: number
  // Solana-specific raw holder balances
  topHolders?: Array<{
    address: string
    balance: number | string
  }>
  totalSupply?: number
}

/**
 * Calculate holder concentration risk score (0-100)
 * Handles both EVM percentages and Solana raw balances
 */
export function calculateHolderConcentration(data: HolderData): number {
  let score = 0

  // STEP 1: Parse Solana raw balances if available
  let top10Pct = data.top10HoldersPct || 0
  let top1Pct = 0

  if (!top10Pct && data.topHolders && data.topHolders.length > 0 && data.totalSupply) {
    console.log('[Holder Concentration] Calculating from Solana raw balances...')
    
    const totalSupply = data.totalSupply
    const top10Holders = data.topHolders.slice(0, 10)
    const top1Holder = data.topHolders[0]

    // Parse balances (handle both number and string)
    const top10Balance = top10Holders.reduce((sum, h) => {
      const balance = typeof h.balance === 'string' ? parseFloat(h.balance) : h.balance
      return sum + (isNaN(balance) ? 0 : balance)
    }, 0)

    const top1Balance = typeof top1Holder.balance === 'string' 
      ? parseFloat(top1Holder.balance) 
      : top1Holder.balance

    top10Pct = top10Balance / totalSupply
    top1Pct = top1Balance / totalSupply

    console.log(`[Holder Concentration] Top 10: ${(top10Pct * 100).toFixed(1)}%, Top 1: ${(top1Pct * 100).toFixed(1)}%`)
  }

  // STEP 2: Top 10 holders concentration scoring
  if (top10Pct > 0.90) score += 50       // 90%+
  else if (top10Pct > 0.80) score += 45  // 80-90%
  else if (top10Pct > 0.70) score += 40  // 70-80%
  else if (top10Pct > 0.60) score += 35  // 60-70%
  else if (top10Pct > 0.50) score += 28  // 50-60%
  else if (top10Pct > 0.40) score += 20  // 40-50%
  else if (top10Pct > 0.30) score += 12  // 30-40%
  else if (top10Pct > 0.20) score += 5   // 20-30%

  // STEP 3: Top 1 holder CRITICAL check
  if (top1Pct >= 0.40) {
    console.log(`[Holder Concentration] 🚨 TOP 1 HOLDER >= 40% → Force CRITICAL`)
    score = Math.max(score, 94) // Instant CRITICAL
  }

  // STEP 4: Holder count penalty
  if (data.holderCount !== undefined) {
    if (data.holderCount === 0) score += 40
    else if (data.holderCount < 50) score += 35
    else if (data.holderCount < 100) score += 30
    else if (data.holderCount < 200) score += 25
    else if (data.holderCount < 500) score += 18
    else if (data.holderCount < 1000) score += 10
    else if (data.holderCount < 5000) score += 5
  }

  // STEP 5: Top 50/100 concentration (wash trading detection)
  if (data.top50HoldersPct !== undefined && data.top50HoldersPct > 0.95) {
    score += 30 // 95%+ in top 50 = likely wash trading
  }

  if (data.top100HoldersPct !== undefined && data.top100HoldersPct > 0.98) {
    score += 25 // 98%+ in top 100 = bundle detection
  }

  return Math.min(score, 100)
}
