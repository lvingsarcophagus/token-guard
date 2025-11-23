import { TokenData, RiskResult, RiskBreakdown } from './types/token-data'
import { detectMemeTokenWithAI, generateAIExplanation, generateComprehensiveAISummary } from './ai/groq'
import { getTwitterAdoptionData, calculateAdoptionRisk } from './twitter/adoption'
import { getWeights, ChainType } from './risk-factors/weights'
import { detectMemeToken, isOfficialToken as isWhitelistedToken } from './services/meme-detector'
import { calculateHolderConcentration } from './risk-factors/holder-concentration'
import { isOfficialToken, applyOfficialTokenOverride } from './services/official-token-resolver'
import { checkDeadToken, applyDeadTokenOverride } from './risk-factors/dead-token'

const WEIGHTS = {
  supplyDilution: 0.18,
  holderConcentration: 0.16,
  liquidityDepth: 0.14,
  vestingUnlock: 0.13,
  contractControl: 0.12,
  taxFee: 0.10,
  distribution: 0.09,
  burnDeflation: 0.08,
  adoption: 0.07,
  auditTransparency: 0.03
}

/**
 * Calculate token risk using a unified 10-factor algorithm for both FREE and PREMIUM plans.
 * Enhanced with AI meme detection, Twitter metrics, and chain-adaptive weights.
 */
export async function calculateRisk(
  data: TokenData,
  plan: 'FREE' | 'PREMIUM',
  metadata?: {
    tokenSymbol?: string
    tokenName?: string
    tokenDescription?: string
    twitterHandle?: string
    chain?: ChainType
    manualClassification?: 'MEME_TOKEN' | 'UTILITY_TOKEN' | null
  }
): Promise<RiskResult> {
  const hasGoPlus = data.is_honeypot !== undefined

  console.log(`\n🔬 [Tokenomics Lab] Starting calculation - Plan: ${plan}, GoPlus: ${hasGoPlus ? 'ACTIVE' : 'FALLBACK'}`)
  
  // ═══════════════════════════════════════════════════════════
  // STEP 0: STABLECOIN OVERRIDE (before any calculations)
  // ═══════════════════════════════════════════════════════════
  
  const isStablecoin = checkIfStablecoin(metadata?.tokenSymbol, data.marketCap)
  if (isStablecoin) {
    console.log(`💵 [Stablecoin Override] Detected major stablecoin (${metadata?.tokenSymbol}) → Risk score: 10 (LOW)`)
    return {
      overall_risk_score: 10,
      risk_level: 'LOW' as const,
      confidence_score: 99,
      data_sources: ['Known Stablecoin'],
      goplus_status: 'active' as const,
      plan,
      breakdown: {
        supplyDilution: 5,
        holderConcentration: 10,
        liquidityDepth: 5,
        vestingUnlock: 0,
        contractControl: 0,
        taxFee: 0,
        distribution: 5,
        burnDeflation: 5,
        adoption: 0,
        auditTransparency: 0
      },
      detailed_insights: [
        `✅ Recognized as major stablecoin (${metadata?.tokenSymbol || 'STABLECOIN'})`,
        '✅ Battle-tested and widely trusted in the crypto ecosystem',
        '✅ Low volatility risk due to USD peg mechanism'
      ]
    }
  }
  
  // ═══════════════════════════════════════════════════════════
  // STEP 1: AI MEME DETECTION → SELECT WEIGHT PROFILE
  // ═══════════════════════════════════════════════════════════
  
  let memeDetection = { isMeme: false, confidence: 0, reasoning: '' }
  let useNewWeights = false
  let isManualOverride = false
  
  // Check for manual classification override
  if (metadata?.manualClassification) {
    console.log(`👤 [User Override] Manual classification: ${metadata.manualClassification}`)
    memeDetection = {
      isMeme: metadata.manualClassification === 'MEME_TOKEN',
      confidence: 100,
      reasoning: 'Manual classification by user'
    }
    useNewWeights = true
    isManualOverride = true
  } else if (metadata?.tokenSymbol || metadata?.tokenName) {
    try {
      console.log(`🤖 [AI] Detecting meme token...`)
      memeDetection = await detectMemeTokenWithAI(
        { symbol: metadata.tokenSymbol, name: metadata.tokenName },
        metadata
      )
      console.log(`✓ Classification: ${memeDetection.isMeme ? 'MEME' : 'UTILITY'} (${memeDetection.confidence}% confident)`)
      useNewWeights = true
    } catch (error) {
      console.log(`⚠ AI detection failed, using fallback`)
    }
  }
  
  // ═══════════════════════════════════════════════════════════
  // STEP 2: TWITTER SOCIAL METRICS → ADOPTION SCORING
  // ═══════════════════════════════════════════════════════════
  
  let twitterAdoptionScore: number | null = null
  let twitterMetrics: any = null
  
  if (metadata?.tokenSymbol && metadata?.twitterHandle) {
    try {
      console.log(`🐦 [Twitter] Fetching social metrics...`)
      const twitterData = await getTwitterAdoptionData(
        metadata.tokenSymbol,
        metadata.twitterHandle
      )
      twitterAdoptionScore = calculateAdoptionRisk(twitterData, data.holderCount)
      twitterMetrics = twitterData // Store for later
      console.log(`✓ Twitter Adoption Score: ${twitterAdoptionScore}/100`)
    } catch (error) {
      console.log(`⚠ Twitter API unavailable, using fallback adoption`)
    }
  }

  console.log(`[Risk Calc] Token Data:`, {
    marketCap: data.marketCap,
    fdv: data.fdv,
    liquidityUSD: data.liquidityUSD,
    holderCount: data.holderCount,
    top10HoldersPct: data.top10HoldersPct,
    volume24h: data.volume24h,
    txCount24h: data.txCount24h,
    ageDays: data.ageDays,
    totalSupply: data.totalSupply,
    circulatingSupply: data.circulatingSupply
  })

  // ALWAYS CALCULATE ALL 10 FACTORS
  const scores: RiskBreakdown = {
    supplyDilution: calcSupplyDilution(data),
    holderConcentration: calcHolderConcentration(data),
    liquidityDepth: calcLiquidityDepth(data, hasGoPlus),
    vestingUnlock: calcVestingUnlock(data),
    contractControl: calcContractControl(data, hasGoPlus),
    taxFee: calcTaxFee(data, hasGoPlus),
    distribution: calcDistribution(data),
    burnDeflation: calcBurnDeflation(data),
    adoption: twitterAdoptionScore !== null ? twitterAdoptionScore : calcAdoption(data),
    auditTransparency: calcAuditTransparency(data, hasGoPlus)
  }

  console.log(`[Risk Calc] Individual Scores:`, scores)

  // ═══════════════════════════════════════════════════════════
  // STEP 3: WEIGHTED OVERALL SCORE (with chain-adaptive weights)
  // ═══════════════════════════════════════════════════════════
  
  let overallScoreRaw: number
  
  if (useNewWeights) {
    // Use new 9-factor weighted system
    const chain = metadata?.chain || ChainType.EVM
    const weights = getWeights(memeDetection.isMeme, chain)
    
    // Calculate weighted score (9 factors, excluding vesting)
    overallScoreRaw = 
      scores.supplyDilution * weights.supply_dilution +
      scores.holderConcentration * weights.holder_concentration +
      scores.liquidityDepth * weights.liquidity_depth +
      scores.contractControl * weights.contract_control +
      scores.taxFee * weights.tax_fee +
      scores.distribution * weights.distribution +
      scores.burnDeflation * weights.burn_deflation +
      scores.adoption * weights.adoption +
      scores.auditTransparency * weights.audit
    
    console.log(`⚖️ [New Weights] Using ${memeDetection.isMeme ? 'MEME' : 'STANDARD'} + ${chain} profile`)
    console.log(`📊 [Calculated Risk] Raw score before baseline: ${overallScoreRaw.toFixed(2)}`)
    
    // MEME BASELINE: Add baseline risk to meme tokens (not just minimum)
    if (memeDetection.isMeme) {
      const memeBaselineBonus = 15 // Add 15 points to meme tokens
      const beforeBaseline = overallScoreRaw
      overallScoreRaw = Math.min(overallScoreRaw + memeBaselineBonus, 100) // Cap at 100
      console.log(`✓ Meme Baseline Applied: ${beforeBaseline.toFixed(2)} + ${memeBaselineBonus} = ${overallScoreRaw.toFixed(2)}`)
    }
  } else {
    // Use legacy 10-factor weighted system
    overallScoreRaw = Object.entries(scores).reduce(
      (sum, [key, value]) => sum + value * (WEIGHTS as any)[key],
      0
    )
  }

  console.log(`[Risk Calc] Overall Score (raw): ${overallScoreRaw.toFixed(2)}`)

  // ═══════════════════════════════════════════════════════════
  // NEW: Official Token Resolver (CoinGecko check)
  // ═══════════════════════════════════════════════════════════
  let officialTokenResult: { isOfficial: boolean; marketCap: number } = { isOfficial: false, marketCap: 0 }
  if (metadata?.tokenSymbol && data.marketCap > 50_000_000) {
    const result = await isOfficialToken(metadata.tokenSymbol, (data as any).address)
    if (result.isOfficial && result.marketCap) {
      officialTokenResult = { isOfficial: true, marketCap: result.marketCap }
    } else {
      officialTokenResult = result as { isOfficial: boolean; marketCap: number }
    }
    const officialTokenResultTyped = officialTokenResult
    if (officialTokenResult.isOfficial) {
      console.log(`✓ [Official Token] Detected: ${metadata.tokenSymbol} with $${(officialTokenResult.marketCap! / 1e6).toFixed(0)}M MC`)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // NEW: Dead Token Detector
  // ═══════════════════════════════════════════════════════════
  const deadTokenCheck = checkDeadToken({
    liquidityUSD: data.liquidityUSD,
    volume24h: data.volume24h,
    priceChange7d: (data as any).priceChange7d,
    priceChange30d: (data as any).priceChange30d,
    txCount24h: data.txCount24h,
    holderCount: data.holderCount,
    ath: (data as any).ath,
    currentPrice: (data as any).priceUSD
  })

  // ═══════════════════════════════════════════════════════════
  // NEW: Top 1 Holder ≥40% = Instant CRITICAL
  // ═══════════════════════════════════════════════════════════
  let top1HolderPct = 0
  if ((data as any).topHolders && (data as any).topHolders.length > 0 && data.totalSupply) {
    const top1Balance = typeof (data as any).topHolders[0].balance === 'string'
      ? parseFloat((data as any).topHolders[0].balance)
      : (data as any).topHolders[0].balance
    top1HolderPct = top1Balance / data.totalSupply
    
    if (top1HolderPct >= 0.40) {
      console.log(`🚨 [Top 1 Holder] ${(top1HolderPct * 100).toFixed(1)}% → Force CRITICAL (94)`)
      overallScoreRaw = Math.max(overallScoreRaw, 94)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // NEW: 2025 Pump.fun Rug Killer (Most Important!)
  // ═══════════════════════════════════════════════════════════
  const isMeme = memeDetection.isMeme
  const chain = metadata?.chain || ChainType.EVM
  const ageDays = data.ageDays || 0
  const tokenName = metadata?.tokenName || ''
  const tokenSymbol = metadata?.tokenSymbol || ''
  const burnedPercentage = data.burnedSupply && data.totalSupply ? (data.burnedSupply / data.totalSupply) * 100 : 0
  
  if (isMeme && chain === ChainType.SOLANA && ageDays <= 60) {
    let penalty = 0
    const rugFlags: string[] = []
    
    // High MC but low liquidity (classic pump.fun pattern)
    if (data.marketCap > 15_000_000 && (data.liquidityUSD || 0) < 1_200_000) {
      penalty += 40
      rugFlags.push('High MC + Low liquidity')
    }
    
    // High MC but few holders (bundled wallets)
    if (data.marketCap > 10_000_000 && (data.holderCount || 0) < 1500) {
      penalty += 30
      rugFlags.push('High MC + Few holders')
    }
    
    // Suspicious naming patterns
    if (/official|real|2\.0|67|69|420|1000x|pump|moon/i.test(tokenName + tokenSymbol)) {
      penalty += 20
      rugFlags.push('Pump.fun naming pattern')
    }
    
    // High volume but few holders (wash trading)
    if ((data.volume24h || 0) > 5_000_000 && (data.holderCount || 0) < 1000) {
      penalty += 20
      rugFlags.push('High volume + Few holders')
    }
    
    // Young meme with no burns
    if (burnedPercentage < 1) {
      penalty += 20
      rugFlags.push('No token burns')
    }
    
    if (penalty > 0) {
      overallScoreRaw += penalty
      console.log(`🚨 [2025 Pump.fun Rug] +${penalty} penalty: ${rugFlags.join(', ')}`)
    }
    
    // Force to red zone if score >= 70
    if (overallScoreRaw >= 70) {
      overallScoreRaw = Math.max(overallScoreRaw, 92)
      console.log(`🚨 [2025 Pump.fun Rug] Force to CRITICAL zone (92+)`)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ✅ CRITICAL OVERRIDE: Apply critical flags penalty
  // ═══════════════════════════════════════════════════════════
  const criticalFlags = extractCriticalFlags(data, hasGoPlus)
  const criticalCount = criticalFlags.length
  
  let overallScoreFinal = overallScoreRaw
  if (criticalCount >= 3) {
    console.log(`🚨 [Critical Override] ${criticalCount} CRITICAL flags detected → Min score 75`)
    overallScoreFinal = Math.max(overallScoreRaw, 75)
  } else if (criticalCount >= 1) {
    console.log(`⚠️ [Critical Override] ${criticalCount} CRITICAL flag(s) detected → +15 penalty`)
    overallScoreFinal = Math.min(overallScoreRaw + 15, 100)
  }

  // Apply Official Token Override (reduces score by 45+)
  // BUT: Reduce bonus for meme tokens (they're inherently riskier)
  if (officialTokenResult.isOfficial) {
    const isMeme = memeDetection.isMeme
    const override = applyOfficialTokenOverride(overallScoreFinal, true, officialTokenResult.marketCap, isMeme)
    overallScoreFinal = override.score
    
    if (isMeme) {
      console.log(`⚠️ [Official Meme Token] Reduced bonus applied (meme coins are inherently volatile)`)
    }
  }

  // Apply Dead Token Override (forces score >= 90)
  // Skip dead token check for official tokens (they have verified data)
  if (deadTokenCheck.isDead && !officialTokenResult.isOfficial) {
    const override = applyDeadTokenOverride(overallScoreFinal, deadTokenCheck)
    overallScoreFinal = override.score
    if (override.criticalFlag) {
      criticalFlags.push(override.criticalFlag)
    }
  }

  const riskLevel = classifyRisk(overallScoreFinal)
  const confidenceScore = hasGoPlus
    ? (plan === 'PREMIUM' ? 96 : 85)
    : (plan === 'PREMIUM' ? 78 : 70)

  const overallRounded = Math.round(overallScoreFinal)
  
  // Build dynamic data sources array based on what we actually have
  const dataSources: string[] = []
  if (data.marketCap > 0) dataSources.push('Mobula')
  if (data.txCount24h > 0 && !(data as any).txCount24h_is_estimated) dataSources.push('Moralis')
  if (hasGoPlus) dataSources.push('GoPlus Security')
  if (data.chain === 'SOLANA' && data.holderCount > 0) dataSources.push('Helius')
  if (dataSources.length === 0) dataSources.push('Mobula (GoPlus fallback active)')

  const baseResult = {
    overall_risk_score: overallRounded,
    risk_level: riskLevel,
    confidence_score: confidenceScore,
    data_sources: dataSources,
    goplus_status: hasGoPlus ? 'active' as const : 'fallback' as const,
    plan
  }

  // FREE PLAN - Show all 10 factors too
  if (plan === 'FREE') {
    return {
      ...baseResult,
      breakdown: scores,
      upgrade_message:
        overallRounded > 40
          ? '⚡ Premium unlocks forecasts, critical flags, and detailed insights'
          : undefined
    }
  }

  // PREMIUM PLAN - Show everything
  const result: RiskResult = {
    ...baseResult,
    breakdown: scores,
    critical_flags: extractCriticalFlags(data, hasGoPlus),
    positive_signals: extractPositiveSignals(data),
    upcoming_risks: calculateUpcomingRisks(data),
    detailed_insights: generateInsights(scores, data, hasGoPlus)
  }
  
  // ═══════════════════════════════════════════════════════════
  // STEP 4: ADD MEME DETECTION TO INSIGHTS (PREMIUM only)
  // ═══════════════════════════════════════════════════════════
  
  if (plan === 'PREMIUM' && useNewWeights) {
    // Add structured AI insights
    result.ai_insights = {
      classification: memeDetection.isMeme ? 'MEME_TOKEN' : 'UTILITY_TOKEN',
      confidence: memeDetection.confidence,
      reasoning: isManualOverride ? 'Manual classification by user' : memeDetection.reasoning,
      meme_baseline_applied: memeDetection.isMeme,
      is_manual_override: isManualOverride
    }
    
    // Add meme detection insight to detailed_insights (for backward compatibility)
    const classificationPrefix = isManualOverride ? '👤 Manual Classification' : '🤖 AI Classification'
    if (memeDetection.isMeme) {
      result.detailed_insights = [
        `${classificationPrefix}: MEME TOKEN (${memeDetection.confidence}% confident) - ${memeDetection.reasoning}`,
        `⚠️ Meme Baseline Applied: +15 risk points added due to high volatility and speculative nature`,
        ...(result.detailed_insights || [])
      ]
    } else {
      result.detailed_insights = [
        `${classificationPrefix}: UTILITY TOKEN (${memeDetection.confidence}% confident) - ${memeDetection.reasoning}`,
        ...(result.detailed_insights || [])
      ]
    }
    
    // Add Twitter metrics if available
    if (twitterMetrics && twitterAdoptionScore !== null) {
      result.twitter_metrics = {
        followers: twitterMetrics.followersCount || 0,
        engagement_rate: twitterMetrics.engagementRate || 0,
        tweets_7d: twitterMetrics.tweetsLast7Days || 0,
        adoption_score: twitterAdoptionScore,
        handle: metadata?.twitterHandle || ''
      }
      
      result.detailed_insights.push(
        `🐦 Twitter Metrics: Adoption risk score ${twitterAdoptionScore}/100 based on social presence`
      )
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 5: GENERATE COMPREHENSIVE AI ANALYSIS (A + B + C)
    // ═══════════════════════════════════════════════════════════
    
    try {
      console.log(`🤖 [AI Analysis] Generating comprehensive summary...`)
      console.log(`🤖 [AI Analysis] GROQ_API_KEY exists:`, !!process.env.GROQ_API_KEY)
      console.log(`🤖 [AI Analysis] User plan:`, plan)
      
      const factors = Object.entries(scores).map(([name, value]) => ({
        name,
        value: typeof value === 'number' ? value : 0,
        description: undefined
      }))
      
      console.log(`🤖 [AI Analysis] Prepared ${factors.length} factors for AI`)
      
      const aiSummary = await generateComprehensiveAISummary({
        name: metadata?.tokenName || 'Token',
        symbol: metadata?.tokenSymbol || 'Unknown',
        chain: metadata?.chain || 'EVM',
        riskScore: overallScoreRaw,
        riskLevel: result.risk_level,
        price: (data as any).priceUSD,
        marketCap: data.marketCap,
        holders: data.holderCount,
        liquidity: data.liquidityUSD,
        age: (data as any).age || 'Unknown',
        factors,
        redFlags: result.critical_flags || [],
        greenFlags: []
      })
      
      const factorExplanations: Record<string, string> = {}
      factors.forEach(f => {
        factorExplanations[f.name] = f.description || aiSummary.riskAnalysis
      })
      
      console.log(`🤖 [AI Analysis] Raw AI response:`, JSON.stringify(aiSummary, null, 2))
      
      result.ai_summary = {
        executive_summary: aiSummary.overview,
        recommendation: overallScoreRaw > 70 ? 'AVOID' : overallScoreRaw > 40 ? 'RESEARCH_MORE' : 'BUY',
        classification: {
          type: memeDetection.isMeme ? 'MEME_TOKEN' : 'UTILITY_TOKEN',
          confidence: memeDetection.confidence
        },
        factor_explanations: factorExplanations,
        top_risk_factors: factors.slice(0, 3).map(f => ({ 
          name: f.name, 
          score: f.value, 
          explanation: aiSummary.riskAnalysis,
          impact: 'HIGH'
        })),
        key_insights: aiSummary.keyInsights,
        generated_at: new Date().toISOString()
      }
      
      console.log(`✓ AI Analysis complete - Summary generated successfully`)
      console.log(`✓ AI Summary structure:`, Object.keys(result.ai_summary))
    } catch (error) {
      console.error(`❌ [AI Analysis] FAILED to generate summary:`, error)
      console.error(`❌ [AI Analysis] Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      })
      // Continue without AI summary - not critical
    }
    
    console.log(`✓ Enhanced insights added`)
  }
  
  console.log(`✅ Risk calculation complete!\n`)
  
  return result
}

function classifyRisk(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score >= 75) return 'CRITICAL'
  if (score >= 50) return 'HIGH'
  if (score >= 35) return 'MEDIUM'  // Adjusted from 30 to reduce false positives
  if (score >= 20) return 'LOW'      // Added explicit LOW threshold
  return 'LOW'
}

// FACTOR 1: Supply Dilution (Pure Mobula - no fallback needed)
function calcSupplyDilution(data: TokenData): number {
  // ✅ FIXED: Use FDV/MCAP ratio as primary metric (Mobula-sourced)
  // RULE: Never use data if validation fails → default to HIGH RISK
  
  if (!data.fdv || data.fdv <= 0 || !data.marketCap || data.marketCap <= 0) {
    // No valid FDV/MCAP data = HIGH RISK
    console.log(`[Supply Dilution] ⚠️ VALIDATION FAILED: FDV=${data.fdv}, MCAP=${data.marketCap} → score 100`)
    return 100
  }

  const fdvToMcap = data.fdv / data.marketCap
  
  // Base score from FDV/MCAP ratio
  let score = 0
  if (fdvToMcap <= 1) score = 10        // ≤1x → 10
  else if (fdvToMcap <= 2) score = 30   // ≤2x → 30
  else if (fdvToMcap <= 5) score = 50   // ≤5x → 50
  else if (fdvToMcap <= 10) score = 70  // ≤10x → 70
  else score = 90                         // >10x → 90

  console.log(`[Supply Dilution] FDV=$${(data.fdv/1e6).toFixed(2)}M / MCAP=$${(data.marketCap/1e6).toFixed(2)}M = ${fdvToMcap.toFixed(2)}x → base score ${score}`)

  // ✅ CRITICAL FIX: Add +20 if mintable (NEW RULE)
  if (data.is_mintable) {
    console.log(`[Supply Dilution] 🚨 MINTABLE detected → +20 penalty`)
    score += 20
  }

  // ✅ Additional: Unlimited supply with no burns
  if (!data.maxSupply && data.burnedSupply === 0) {
    console.log(`[Supply Dilution] Unlimited supply, no burns → +15 penalty`)
    score += 15
  }

  return Math.min(score, 100)
}

// FACTOR 2: Holder Concentration (Pure Mobula + NEW: top50/top100 + unique buyers)
function calcHolderConcentration(data: TokenData): number {
  let score = 0
  
  // If no holder data available, return moderate risk
  if (!data.holderCount && !data.top10HoldersPct) {
    return 50 // Unknown - moderate risk
  }
  
  // Top 10 holders concentration (existing)
  if (data.top10HoldersPct > 0.8) score += 50
  else if (data.top10HoldersPct > 0.7) score += 40
  else if (data.top10HoldersPct > 0.6) score += 35
  else if (data.top10HoldersPct > 0.5) score += 28
  else if (data.top10HoldersPct > 0.4) score += 20
  else if (data.top10HoldersPct > 0.3) score += 12
  else if (data.top10HoldersPct > 0.2) score += 5

  // NEW: Top 50 holders concentration (wash trading detection)
  if (data.top50HoldersPct !== undefined) {
    console.log(`[Holder Concentration] Top 50 holders: ${(data.top50HoldersPct * 100).toFixed(1)}%`)
    if (data.top50HoldersPct > 0.95) score += 45 // 95%+ in top 50 = extreme concentration
    else if (data.top50HoldersPct > 0.90) score += 35
    else if (data.top50HoldersPct > 0.85) score += 25
    else if (data.top50HoldersPct > 0.80) score += 15
  }

  // NEW: Top 100 holders concentration (bundle detection)
  if (data.top100HoldersPct !== undefined) {
    console.log(`[Holder Concentration] Top 100 holders: ${(data.top100HoldersPct * 100).toFixed(1)}%`)
    if (data.top100HoldersPct > 0.98) score += 40 // 98%+ in top 100 = suspicious bundles
    else if (data.top100HoldersPct > 0.95) score += 30
    else if (data.top100HoldersPct > 0.90) score += 20
  }

  // Holder count risk (existing)
  if (data.holderCount === 0) score += 40 // No data
  else if (data.holderCount < 50) score += 35
  else if (data.holderCount < 100) score += 30
  else if (data.holderCount < 200) score += 25
  else if (data.holderCount < 500) score += 18
  else if (data.holderCount < 1000) score += 10
  else if (data.holderCount < 5000) score += 5

  // NEW: Unique buyers penalty (wash trading detection)
  if (data.uniqueBuyers24h !== undefined) {
    console.log(`[Holder Concentration] Unique buyers 24h: ${data.uniqueBuyers24h}`)
    if (data.uniqueBuyers24h < 10) score += 50 // Extremely low = likely wash trading
    else if (data.uniqueBuyers24h < 25) score += 40
    else if (data.uniqueBuyers24h < 50) score += 30
    else if (data.uniqueBuyers24h < 100) score += 20
    else if (data.uniqueBuyers24h < 200) score += 10
    // >200 unique buyers = normal
  }

  return Math.min(score, 100)
}

// FACTOR 3: Liquidity Depth (Mobula + GoPlus bonus + NEW: liquidity drops)
function calcLiquidityDepth(data: TokenData, hasGoPlus: boolean): number {
  // ✅ FIXED: Add zero-liquidity guard (prevent 90% rug pulls)
  
  // VALIDATION: Never use data if liquidity < $10K
  if (!data.liquidityUSD || data.liquidityUSD < 10000) {
    console.warn(`[Liquidity] 🚨 ZERO-LIQUIDITY GUARD: $${data.liquidityUSD || 0} < $10K → Possible rug pull!`)
    return 100 // CRITICAL: Extremely low liquidity = max risk
  }

  let score = 0
  
  // Absolute liquidity amount
  if (data.liquidityUSD < 25000) score += 42
  else if (data.liquidityUSD < 50000) score += 32
  else if (data.liquidityUSD < 100000) score += 25
  else if (data.liquidityUSD < 250000) score += 18
  else if (data.liquidityUSD < 500000) score += 10
  else if (data.liquidityUSD < 1_000_000) score += 5
  // >$1M = 0 extra penalty

  // Market cap to liquidity ratio (if market cap available)
  if (data.marketCap > 0 && data.liquidityUSD > 0) {
    const mcLiqRatio = data.marketCap / data.liquidityUSD
    console.log(`[Liquidity] MC/Liq Ratio: ${mcLiqRatio.toFixed(2)}x (MC: $${(data.marketCap/1e6).toFixed(2)}M, Liq: $${(data.liquidityUSD/1e3).toFixed(2)}K)`)
    
    if (mcLiqRatio > 500) score += 38
    else if (mcLiqRatio > 300) score += 32
    else if (mcLiqRatio > 200) score += 28
    else if (mcLiqRatio > 100) score += 22
    else if (mcLiqRatio > 50) score += 15
    else if (mcLiqRatio > 20) score += 8
  }

  // NEW: Liquidity drop detection (rug pull indicator)
  if (data.liquidity1hAgo && data.liquidity1hAgo > 0) {
    const liquidityDrop1h = (data.liquidity1hAgo - data.liquidityUSD) / data.liquidity1hAgo
    console.log(`[Liquidity] 1h drop: ${(liquidityDrop1h * 100).toFixed(1)}% (${data.liquidity1hAgo} → ${data.liquidityUSD})`)
    if (liquidityDrop1h > 0.8) score += 60 // 80%+ drop in 1 hour = CRITICAL
    else if (liquidityDrop1h > 0.6) score += 45
    else if (liquidityDrop1h > 0.4) score += 30
    else if (liquidityDrop1h > 0.2) score += 15
  }

  if (data.liquidity24hAgo && data.liquidity24hAgo > 0) {
    const liquidityDrop24h = (data.liquidity24hAgo - data.liquidityUSD) / data.liquidity24hAgo
    console.log(`[Liquidity] 24h drop: ${(liquidityDrop24h * 100).toFixed(1)}% (${data.liquidity24hAgo} → ${data.liquidityUSD})`)
    if (liquidityDrop24h > 0.9) score += 50 // 90%+ drop in 24 hours = CRITICAL
    else if (liquidityDrop24h > 0.7) score += 35
    else if (liquidityDrop24h > 0.5) score += 20
  }

  // ✅ LP Lock check (prevents rug)
  if (hasGoPlus) {
    if (!data.lp_locked && data.lp_in_owner_wallet) {
      console.log(`[Liquidity] ⚠️ LP NOT LOCKED/BURNED → +30 penalty`)
      score += 30
    } else if (data.lp_locked) {
      console.log(`[Liquidity] ✓ LP locked → -10 bonus`)
      score = Math.max(0, score - 10)
    }
  }

  const finalScore = Math.min(score, 100)
  console.log(`[Liquidity] Final score: ${finalScore}`)
  return finalScore
}

// FACTOR 4: Vesting & Unlock (Pure Mobula)
function calcVestingUnlock(data: TokenData): number {
  let score = 0
  if (data.nextUnlock30dPct) {
    if (data.nextUnlock30dPct > 0.25) score += 30
    else if (data.nextUnlock30dPct > 0.15) score += 20
    else if (data.nextUnlock30dPct > 0.1) score += 15
    else if (data.nextUnlock30dPct > 0.05) score += 10
  }

  if (data.teamVestingMonths !== undefined) {
    if (data.teamVestingMonths === 0 && (data.teamAllocationPct || 0) > 0.1) {
      score += 40
    } else if (data.teamVestingMonths < 12) {
      score += 25
    } else if (data.teamVestingMonths < 24) {
      score += 15
    }
  }
  return Math.min(score, 100)
}

// FACTOR 5: Contract Control (GoPlus PRIMARY, fallback to proxies)
function calcContractControl(data: TokenData, hasGoPlus: boolean): number {
  // ✅ FIXED: Chain-specific logic + LP lock check + critical overrides
  let score = 0
  
  // ═════════════════════════════════════════════════════════════
  // CRITICAL FLAGS (ANY ONE OF THESE = +penalty)
  // ═════════════════════════════════════════════════════════════
  
  // Honeypot detection (EVM via GoPlus)
  if (hasGoPlus && data.is_honeypot) {
    console.log(`[Contract Control] 🚨 HONEYPOT DETECTED → +60 penalty`)
    score += 60
  }
  
  // Mintable flag (can print unlimited tokens)
  if (data.is_mintable) {
    console.log(`[Contract Control] 🚨 MINTABLE CONTRACT → +50 penalty`)
    score += 50
  }
  
  // ═════════════════════════════════════════════════════════════
  // SOLANA-SPECIFIC: Freeze Authority (40%+ weight for Solana)
  // ═════════════════════════════════════════════════════════════
  if (data.chain === 'SOLANA' || data.chain?.toUpperCase() === 'SOLANA') {
    if (data.freeze_authority_exists) {
      console.log(`[Contract Control] ☀️ SOLANA: Freeze authority exists → +100 penalty`)
      score += 100  // CRITICAL on Solana - can lock user wallets
    } else if (data.freeze_authority_exists === undefined || data.freeze_authority_exists === null) {
      // We don't have freeze authority data - apply conservative default for Solana
      // Most SPL tokens have freeze authority, assume 50% probability
      console.log(`[Contract Control] ☀️ SOLANA: Freeze authority status unknown → +35 penalty (conservative default)`)
      score += 35  // Conservative penalty for missing data
    }
    // else: freeze_authority_exists === false, no additional penalty needed
  }
  
  // ═════════════════════════════════════════════════════════════
  // LP LOCK CHECK: Prevent 90% rug pulls
  // ═════════════════════════════════════════════════════════════
  if (hasGoPlus && data.lp_in_owner_wallet) {
    console.log(`[Contract Control] ⚠️ LP NOT LOCKED/BURNED → +40 penalty (rug risk)`)
    score += 40
  }
  
  // ═════════════════════════════════════════════════════════════
  // OWNER CONTROL (If not already penalized above)
  // ═════════════════════════════════════════════════════════════
  if (!data.owner_renounced && score === 0) {
    console.log(`[Contract Control] Owner not renounced → +20 penalty`)
    score += 20
  }
  
  // ═════════════════════════════════════════════════════════════
  // SAFE TOKENS (Return early if no flags)
  // ═════════════════════════════════════════════════════════════
  if (score === 0 && data.owner_renounced) {
    console.log(`[Contract Control] ✓ Safe: Ownership renounced → score 0`)
    return 0
  }
  
  // ═════════════════════════════════════════════════════════════
  // FALLBACK (No GoPlus data)
  // ═════════════════════════════════════════════════════════════
  if (!hasGoPlus) {
    console.log(`[Contract Control] Using Mobula fallback (no GoPlus data)`)
    // Base uncertainty penalty
    let fallbackScore = 20
    if (data.top10HoldersPct > 0.8) fallbackScore += 35
    if (data.holderCount < 100) fallbackScore += 25
    if (data.ageDays < 7) fallbackScore += 20
    return Math.min(fallbackScore, 100)
  }

  console.log(`[Contract Control] Final score: ${score}`)
  return Math.min(score, 100)
}

// FACTOR 6: Tax & Fee (GoPlus PRIMARY, fallback to neutral)
function calcTaxFee(data: TokenData, hasGoPlus: boolean): number {
  if (hasGoPlus) {
    let score = 0
    if ((data.sell_tax || 0) > 0.3) score += 60
    else if ((data.sell_tax || 0) > 0.2) score += 40
    else if ((data.sell_tax || 0) > 0.1) score += 20

    if ((data.buy_tax || 0) > 0.15) score += 20
    if (data.tax_modifiable) score += 30
    return Math.min(score, 100)
  }
  return 50 // Neutral - cannot determine without GoPlus
}

// FACTOR 7: Distribution (Pure Mobula)
function calcDistribution(data: TokenData): number {
  let score = 0
  
  // CRITICAL FIX: Default estimate of 0.5 means we don't have real data
  const hasRealData = data.top10HoldersPct !== 0.5 || data.teamAllocationPct
  
  if (!hasRealData) {
    console.warn('[Distribution] No real holder distribution data (using default 0.5) - defaulting to 65')
    return 65 // ⚠️ Unknown distribution = assume concentrated (risky)
  }
  
  // Team allocation risk
  if (data.teamAllocationPct) {
    if (data.teamAllocationPct > 0.4) score += 35
    else if (data.teamAllocationPct > 0.3) score += 25
    else if (data.teamAllocationPct > 0.2) score += 15
  }
  
  // Top 10 holders concentration (more important)
  if (data.top10HoldersPct > 0) {
    console.log(`[Distribution] Top 10 holders: ${(data.top10HoldersPct * 100).toFixed(1)}%`)
    
    if (data.top10HoldersPct >= 0.80) score += 55 // 80%+ = EXTREME
    else if (data.top10HoldersPct >= 0.70) score += 45 // 70%+ = VERY HIGH
    else if (data.top10HoldersPct >= 0.60) score += 35 // 60%+ = HIGH
    else if (data.top10HoldersPct >= 0.50) score += 25 // 50%+ = MEDIUM-HIGH (includes default 0.5)
    else if (data.top10HoldersPct >= 0.40) score += 15 // 40%+ = MEDIUM
    else if (data.top10HoldersPct >= 0.30) score += 8  // 30%+ = LOW-MEDIUM
  }
  
  const finalScore = Math.min(score, 100)
  console.log(`[Distribution] Final score: ${finalScore}`)
  return finalScore
}

// FACTOR 8: Burn & Deflation (Pure Mobula)
function calcBurnDeflation(data: TokenData): number {
  // If supply data missing, return moderate uncertainty
  if (!data.totalSupply || data.totalSupply === 0) return 50
  
  // Check if max supply exists (capped supply is safer)
  const hasCappedSupply = data.maxSupply && data.maxSupply > 0
  
  // If no capped supply AND no burns = high risk
  if (!hasCappedSupply && (data.burnedSupply === 0 || !data.burnedSupply)) return 80
  
  // Calculate burn ratio and percentage
  const burnRatio = data.burnedSupply / data.totalSupply
  const burnedPercentage = burnRatio * 100
  
  // NEW: Special case for young memes (<60 days)
  const ageDays = data.ageDays || 999
  const tokenSymbol = (data as any).symbol || ''
  const isMeme = /doge|shib|pepe|floki|inu|moon|pump|69|420/i.test(tokenSymbol)
  
  if (isMeme && ageDays <= 60) {
    // Young memes: penalize heavily if <1% burned
    return burnedPercentage < 1 ? 10 : 0
  }
  
  // High burn rate scenarios
  if (burnRatio > 0.5) return 10  // Over 50% burned = very low risk
  if (burnRatio > 0.2) return 30  // Over 20% burned = low risk
  if (burnRatio > 0.05) return 50 // Over 5% burned = medium risk
  
  // Capped supply with low/no burns
  if (hasCappedSupply && burnRatio < 0.05) return 40 // Capped but not burning much
  
  // No burns but capped supply
  if (hasCappedSupply && burnRatio === 0) return 60
  
  return 70 // Default moderate-high risk
}

// FACTOR 9: Adoption & Usage (Pure Mobula)
function calcAdoption(data: TokenData): number {
  let score = 0
  
  // Age-based adjustment: New tokens shouldn't be penalized as much for low tx
  const ageMultiplier = data.ageDays < 7 ? 0.7 : 1.0  // New tokens get 30% reduced penalty
  
  // Transaction volume (24h)
  if (data.txCount24h === 0) score += Math.round(45 * ageMultiplier)  // Reduced for new tokens
  else if (data.txCount24h < 5) score += Math.round(38 * ageMultiplier)
  else if (data.txCount24h < 10) score += Math.round(32 * ageMultiplier)
  else if (data.txCount24h < 25) score += Math.round(26 * ageMultiplier)
  else if (data.txCount24h < 50) score += 20
  else if (data.txCount24h < 100) score += 14
  else if (data.txCount24h < 250) score += 8
  else if (data.txCount24h < 500) score += 3

  // Volume to market cap ratio
  if (data.marketCap > 0 && data.volume24h >= 0) {
    const volMcRatio = data.volume24h / data.marketCap
    if (volMcRatio < 0.0001) score += Math.round(32 * ageMultiplier)  // Dead token penalty reduced for new
    else if (volMcRatio < 0.001) score += Math.round(26 * ageMultiplier)
    else if (volMcRatio < 0.005) score += 20
    else if (volMcRatio < 0.01) score += 14
    else if (volMcRatio > 5) score += 25  // Excessive volatility - always penalize
    else if (volMcRatio > 3) score += 18
    else if (volMcRatio > 2) score += 12
  }

  // Age factor - much lighter penalty
  if (data.ageDays < 1) score += 8  // Reduced from 22
  else if (data.ageDays < 3) score += 6  // Reduced from 16
  else if (data.ageDays < 7) score += 4  // Reduced from 12
  else if (data.ageDays < 14) score += 2  // Reduced from 8
  else if (data.ageDays < 30) score += 1  // Reduced from 4
  
  return Math.min(score, 100)
}

// FACTOR 10: Audit & Transparency (GoPlus PRIMARY, fallback to moderate)
function calcAuditTransparency(data: TokenData, hasGoPlus: boolean): number {
  if (hasGoPlus) {
    let score = 0
    if (!data.is_open_source) score += 50
    if (!data.lp_locked) score += 30
    return Math.min(score, 100)
  }
  // FALLBACK
  let score = 60
  const mcLiqRatio = data.marketCap / data.liquidityUSD
  if (mcLiqRatio > 100) score += 20
  return Math.min(score, 100)
}

function extractCriticalFlags(data: TokenData, hasGoPlus: boolean): string[] {
  const flags: string[] = []
  if (hasGoPlus) {
    if (data.is_honeypot) flags.push('🚨 HONEYPOT DETECTED - Cannot sell')
    if (data.is_mintable && !data.owner_renounced) flags.push('⚠️ Owner can mint unlimited tokens')
    if (data.tax_modifiable) flags.push('⚠️ Taxes can be changed anytime')
    if ((data.sell_tax || 0) > 0.2) flags.push(`⚠️ High sell tax: ${(((data.sell_tax || 0) * 100)).toFixed(0)}%`)
    // Only flag if we have explicit data that LP is NOT locked (not just undefined)
    if (data.lp_locked === false) flags.push('⚠️ Liquidity not locked')
  }
  
  // SOLANA SPECIFIC: Split positive vs critical flags
  if (data.chain === 'SOLANA' || data.chain?.toUpperCase() === 'SOLANA') {
    // CRITICAL: Freeze authority exists
    if (data.freeze_authority_exists) {
      flags.push('🚨 FREEZE AUTHORITY - Creator can lock wallets')
    }
    // NOTE: Mint/freeze revoked are handled as POSITIVE flags in result.positive_signals
  }
  
  if (data.nextUnlock30dPct && data.nextUnlock30dPct > 0.15) {
    flags.push(`📅 ${(data.nextUnlock30dPct * 100).toFixed(1)}% unlocking in 30 days`)
  }
  if (data.top10HoldersPct > 0.7) {
    flags.push(`👥 ${(data.top10HoldersPct * 100).toFixed(0)}% held by top 10 wallets`)
  }
  return flags
}

/**
 * Extract positive signals for Solana tokens (mint/freeze revoked)
 */
function extractPositiveSignals(data: TokenData): string[] {
  const signals: string[] = []
  
  // Solana-specific positive signals
  if (data.chain === 'SOLANA' || data.chain?.toUpperCase() === 'SOLANA') {
    if (!data.freeze_authority_exists && data.freeze_authority_exists !== undefined) {
      signals.push('✅ Freeze Authority Revoked - Wallets cannot be frozen')
    }
    if (!data.is_mintable && (data as any).mint_authority_exists === false) {
      signals.push('✅ Mint Authority Revoked - Supply is fixed')
    }
  }
  
  // General positive signals
  if (data.owner_renounced) {
    signals.push('✅ Ownership Renounced - Contract cannot be modified')
  }
  if (data.lp_locked) {
    signals.push('✅ Liquidity Locked - Rug pull protection')
  }
  
  return signals
}

/**
 * Check if token is a major stablecoin
 * These tokens get special LOW risk scores regardless of calculated metrics
 * Requires: symbol match + high market cap to avoid false positives
 */
function checkIfStablecoin(tokenSymbol: string | undefined, marketCap: number): boolean {
  if (!tokenSymbol) return false
  
  const STABLECOIN_SYMBOLS = ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP', 'FRAX', 'USDD']
  
  // Symbol must match AND market cap > $100M (to avoid fake stablecoins)
  if (STABLECOIN_SYMBOLS.includes(tokenSymbol.toUpperCase()) && marketCap > 100_000_000) {
    return true
  }
  
  return false
}

function calculateUpcomingRisks(data: TokenData) {
  const unlockPct = data.nextUnlock30dPct || 0
  return {
    next_30_days: unlockPct,
    forecast: unlockPct > 0.3 ? 'EXTREME' : unlockPct > 0.15 ? 'HIGH' : unlockPct > 0.05 ? 'MEDIUM' : 'LOW'
  } as const
}

function generateInsights(scores: RiskBreakdown, data: TokenData, hasGoPlus: boolean): string[] {
  const insights: string[] = []
  if (scores.contractControl > 70) {
    insights.push(
      hasGoPlus
        ? 'Contract has high risk features (honeypot, mintable, or no renouncement)'
        : 'Contract shows centralization patterns - verification unavailable'
    )
  }
  if (scores.liquidityDepth > 60) {
    insights.push('Low liquidity creates high slippage risk')
  }
  if (scores.vestingUnlock > 60) {
    insights.push('Major token unlocks expected soon - high sell pressure')
  }
  if (scores.holderConcentration > 60) {
    insights.push('Whale concentration risk - few holders control most supply')
  }
  return insights
}


