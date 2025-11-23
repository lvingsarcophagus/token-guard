/**
 * Dead Token Detector
 * Forces score >= 90 if token shows signs of abandonment/death
 */

interface DeadTokenCheckData {
  liquidityUSD?: number
  volume24h?: number
  priceChange7d?: number
  priceChange30d?: number
  txCount24h?: number
  holderCount?: number
  ath?: number // All-time high price
  currentPrice?: number
}

/**
 * Check if token is effectively dead
 * Returns high risk score (90-100) if token meets death criteria
 */
export function checkDeadToken(data: DeadTokenCheckData): {
  isDead: boolean
  score: number
  reason: string
} {
  const reasons: string[] = []
  let baseScore = 0

  // CRITICAL: Zero liquidity = guaranteed dead
  if (!data.liquidityUSD || data.liquidityUSD < 500) {
    reasons.push(`Liquidity < $500 (${data.liquidityUSD || 0})`)
    baseScore = 100
  }

  // CRITICAL: No volume = no trading
  if (!data.volume24h || data.volume24h < 100) {
    reasons.push(`24h volume < $100 (${data.volume24h || 0})`)
    baseScore = Math.max(baseScore, 95)
  }

  // HIGH: Down 98%+ from ATH
  if (data.ath && data.currentPrice) {
    const dropFromATH = 1 - (data.currentPrice / data.ath)
    if (dropFromATH > 0.98) {
      reasons.push(`Down ${(dropFromATH * 100).toFixed(1)}% from ATH`)
      baseScore = Math.max(baseScore, 92)
    }
  }

  // HIGH: No transactions in 24h
  if (data.txCount24h !== undefined && data.txCount24h === 0) {
    reasons.push('Zero transactions in 24h')
    baseScore = Math.max(baseScore, 90)
    console.log(`[Dead Token Detector] 🚨 Zero transactions detected (liquidity: ${data.liquidityUSD ? '$' + (data.liquidityUSD / 1e6).toFixed(2) + 'M' : 'unknown'})`)
  }

  // MEDIUM: Extreme price drops
  if (data.priceChange7d && data.priceChange7d < -90) {
    reasons.push(`Down ${Math.abs(data.priceChange7d).toFixed(0)}% in 7 days`)
    baseScore = Math.max(baseScore, 85)
  }

  if (data.priceChange30d && data.priceChange30d < -95) {
    reasons.push(`Down ${Math.abs(data.priceChange30d).toFixed(0)}% in 30 days`)
    baseScore = Math.max(baseScore, 88)
  }

  // MEDIUM: Very few holders remaining
  if (data.holderCount !== undefined && data.holderCount < 10 && baseScore > 0) {
    reasons.push(`Only ${data.holderCount} holders`)
    baseScore = Math.max(baseScore, 90)
  }

  const isDead = baseScore >= 90

  if (isDead) {
    console.log(`[Dead Token Detector] 🚨 DEAD TOKEN DETECTED: ${reasons.join(', ')}`)
  }

  return {
    isDead,
    score: baseScore,
    reason: reasons.join(', ') || 'Not dead'
  }
}

/**
 * Apply dead token override to risk calculation
 */
export function applyDeadTokenOverride(
  currentScore: number,
  deadCheckResult: { isDead: boolean; score: number; reason: string }
): { score: number; criticalFlag?: string } {
  if (!deadCheckResult.isDead) {
    return { score: currentScore }
  }

  const newScore = Math.max(currentScore, deadCheckResult.score)
  
  return {
    score: newScore,
    criticalFlag: `🚨 DEAD TOKEN: ${deadCheckResult.reason}`
  }
}
