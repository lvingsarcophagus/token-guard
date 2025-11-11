import { NextRequest, NextResponse } from 'next/server'
import { calculateRisk } from '@/lib/risk-calculator'
import { calculateTokenRisk } from '@/lib/risk-algorithms/enhanced-risk-calculator'
import type { TokenData as EnhancedTokenData } from '@/lib/risk-algorithms/enhanced-risk-calculator'
import { calculateMultiChainTokenRisk, type MultiChainTokenData } from '@/lib/risk-algorithms/multi-chain-enhanced-calculator'
import { tryGoPlusWithFallback } from '@/lib/api/goplus'
import { checkRateLimit } from '@/lib/rate-limit'
import type { TokenData } from '@/lib/types/token-data'
import { getCachedTokenData, setCachedTokenData } from '@/lib/tokenomics-cache'
import { saveAnalysisHistoryAdmin, incrementTokenAnalyzedAdmin } from '@/lib/services/firestore-admin-service'
import type { AnalysisHistoryDocument } from '@/lib/firestore-schema'

// Enhanced API imports
import { 
  getMoralisHolderHistory, 
  getMoralisTransactionPatterns,
  getMoralisAverageHolderAge,
  getMoralisTokenMetadata
} from '@/lib/api/moralis'
import { getHeliusSolanaData } from '@/lib/api/helius'
import { getBlockfrostCardanoData } from '@/lib/api/blockfrost'

// NEW: Chain-adaptive unified data fetcher
import { fetchCompleteTokenData, type CompleteTokenData } from '@/lib/data/chain-adaptive-fetcher'

// Algorithm flags
const USE_ENHANCED_ALGORITHM = true // Enhanced 7-factor algorithm
const USE_MULTICHAIN_ALGORITHM = false // DISABLED: Use legacy calculator with AI features for now
const USE_UNIFIED_FETCHER = true // NEW: Use chain-adaptive unified data fetcher

/**
 * Convert CompleteTokenData to legacy TokenData format
 */
function adaptCompleteToLegacy(completeData: CompleteTokenData): TokenData {
  return {
    // Market data
    marketCap: completeData.marketCap,
    fdv: completeData.fdv,
    liquidityUSD: completeData.liquidityUSD,
    volume24h: completeData.volume24h,
    
    // Supply data
    totalSupply: completeData.totalSupply,
    circulatingSupply: completeData.circulatingSupply,
    maxSupply: completeData.maxSupply,
    burnedSupply: completeData.burnedSupply,
    
    // Holder data (from chain-specific APIs)
    holderCount: completeData.holderCount,
    top10HoldersPct: completeData.top10HoldersPct,
    
    // Activity data
    txCount24h: completeData.txCount24h,
    ageDays: completeData.ageDays,
    
    // Chain identifier (CRITICAL for Solana-specific contract control checks)
    chain: completeData.chainType,
    
    // Security flags from chain adapters (converted to GoPlus format)
    is_honeypot: completeData.criticalFlags.some(f => f.toLowerCase().includes('honeypot')),
    is_mintable: completeData.criticalFlags.some(f => f.toLowerCase().includes('mintable')),
    owner_renounced: !completeData.criticalFlags.some(f => f.toLowerCase().includes('owner control')),
    
    // Solana-specific: Freeze authority detection
    freeze_authority_exists: completeData.criticalFlags.some(f => f.toLowerCase().includes('freeze authority')),
    
    // Tax data (estimate from warnings)
    buy_tax: 0, // Would need to parse from warnings
    sell_tax: 0  // Would need to parse from warnings
  }
}

/**
 * Convert old TokenData format to new EnhancedTokenData format
 */
function adaptToEnhancedFormat(
  oldData: TokenData, 
  goplusData: any, 
  tokenAddress: string,
  chainId: string
): EnhancedTokenData {
  // Extract GoPlus data - it comes wrapped in the token address key
  const goplusTokenData = goplusData?.[tokenAddress.toLowerCase()] || goplusData || {}
  
  // Extract holder count from GoPlus
  const holderCountFromGoPlus = goplusTokenData?.holder_count ? parseInt(goplusTokenData.holder_count) : 0
  const top10Pct = goplusTokenData?.holders?.length >= 10
    ? goplusTokenData.holders.slice(0, 10).reduce((sum: number, h: any) => sum + parseFloat(h.percent || '0'), 0)
    : (oldData.top10HoldersPct || 0.5)
  
  console.log(`[Adapter] GoPlus holder_count: ${goplusTokenData?.holder_count}, parsed: ${holderCountFromGoPlus}`)
  
  return {
    tokenAddress,
    chainId: parseInt(chainId) || 1,
    hasGoPlusData: !!goplusData,
    
    // Mobula data
    marketCap: oldData.marketCap,
    fdv: oldData.fdv,
    liquidityUSD: oldData.liquidityUSD,
    
    // Use GoPlus holder data (more accurate than Mobula)
    holderCount: holderCountFromGoPlus || oldData.holderCount || 0,
    top10HoldersPct: top10Pct,
    
    totalSupply: oldData.totalSupply,
    circulatingSupply: oldData.circulatingSupply,
    maxSupply: oldData.maxSupply || undefined,
    burnedSupply: oldData.burnedSupply,
    txCount24h: oldData.txCount24h || 0, // Mobula doesn't provide this
    volume24h: oldData.volume24h,
    ageDays: oldData.ageDays || 0, // Mobula doesn't provide this
    liquidityLocked: (oldData as any).liquidityLocked,
    deployerHoldingPct: (oldData as any).deployerHoldingPct,
    deployerTxLast7Days: (oldData as any).deployerTxLast7Days,
    dataTimestamp: Date.now(),
    
    // GoPlus data
    is_honeypot: goplusTokenData?.is_honeypot === '1' || false,
    is_mintable: goplusTokenData?.is_mintable === '1' || false,
    owner_renounced: goplusTokenData?.owner_change_balance === '0' || goplusTokenData?.cannot_buy === '0' || false,
    owner_address: goplusTokenData?.owner_address || '',
    sell_tax: parseFloat(goplusTokenData?.sell_tax || '0'),
    buy_tax: parseFloat(goplusTokenData?.buy_tax || '0'),
    is_open_source: goplusTokenData?.is_open_source === '1' || false,
    lp_holders: goplusTokenData?.lp_holders,
  }
}

/**
 * Convert enhanced result back to old format for compatibility
 */
function adaptFromEnhancedResult(enhancedResult: any) {
  return {
    overall_risk_score: enhancedResult.overall_risk_score,
    risk_level: enhancedResult.risk_level,
    confidence_score: enhancedResult.confidence_score,
    data_tier: enhancedResult.data_tier,
    data_freshness: enhancedResult.data_freshness,
    breakdown: {
      contractControl: enhancedResult.factor_scores.contractSecurity.score,
      supplyDilution: enhancedResult.factor_scores.supplyRisk.score,
      holderConcentration: enhancedResult.factor_scores.concentrationRisk.score,
      liquidityDepth: enhancedResult.factor_scores.liquidityRisk.score,
      adoption: enhancedResult.factor_scores.marketActivity.score,
      burnDeflation: enhancedResult.factor_scores.deflationMechanics.score,
      auditTransparency: enhancedResult.factor_scores.tokenAge.score,
      // Add placeholder values for backwards compatibility
      vestingUnlock: 0,
      taxFee: 0,
      distribution: 0,
    },
    critical_flags: enhancedResult.critical_flags,
    warning_flags: enhancedResult.warning_flags,
    positive_signals: enhancedResult.positive_signals,
    analyzed_at: enhancedResult.analyzed_at,
    data_sources: enhancedResult.data_sources,
  }
}

/**
 * Fetch behavioral data from multiple sources
 */
async function fetchBehavioralData(
  tokenAddress: string,
  chainId: string
): Promise<Partial<MultiChainTokenData>> {
  console.log(`[Behavioral Data] Fetching for ${tokenAddress} on chain ${chainId}`)
  
  const behavioralData: Partial<MultiChainTokenData> = {}

  // Parallel fetch for better performance
  const [
    holderHistory,
    transactionPatterns,
    averageHolderAge,
    solanaData,
    cardanoData
  ] = await Promise.allSettled([
    // Moralis data (EVM chains)
    chainId === '501' || chainId === '1815' ? null : getMoralisHolderHistory(tokenAddress, chainId),
    chainId === '501' || chainId === '1815' ? null : getMoralisTransactionPatterns(tokenAddress, chainId),
    chainId === '501' || chainId === '1815' ? null : getMoralisAverageHolderAge(tokenAddress, chainId, 10),
    
    // Solana-specific data
    chainId === '501' ? getHeliusSolanaData(tokenAddress) : null,
    
    // Cardano-specific data
    chainId === '1815' ? getBlockfrostCardanoData(tokenAddress) : null
  ])

  // Extract fulfilled results
  if (holderHistory.status === 'fulfilled' && holderHistory.value) {
    behavioralData.holderHistory = holderHistory.value
    console.log('[Behavioral Data] Holder history retrieved:', holderHistory.value)
  }

  if (transactionPatterns.status === 'fulfilled' && transactionPatterns.value) {
    behavioralData.uniqueBuyers24h = transactionPatterns.value.uniqueBuyers24h
    behavioralData.uniqueSellers24h = transactionPatterns.value.uniqueSellers24h
    behavioralData.buyTransactions24h = transactionPatterns.value.buyTransactions24h
    behavioralData.sellTransactions24h = transactionPatterns.value.sellTransactions24h
    console.log('[Behavioral Data] Transaction patterns retrieved:', transactionPatterns.value)
  }

  if (averageHolderAge.status === 'fulfilled' && averageHolderAge.value) {
    behavioralData.averageHolderWalletAge = averageHolderAge.value
    console.log('[Behavioral Data] Average holder age:', averageHolderAge.value, 'days')
  }

  if (solanaData.status === 'fulfilled' && solanaData.value) {
    behavioralData.solanaData = solanaData.value
    console.log('[Behavioral Data] Solana authorities retrieved')
  }

  if (cardanoData.status === 'fulfilled' && cardanoData.value) {
    behavioralData.cardanoData = cardanoData.value
    console.log('[Behavioral Data] Cardano policy retrieved')
  }

  return behavioralData
}

export async function POST(req: NextRequest) {
  try {
    const { tokenAddress, chainId, userId, plan, metadata } = await req.json()

    // Validate inputs (userId is optional for testing)
    if (!tokenAddress || !chainId || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenAddress, chainId, and plan are required' },
        { status: 400 }
      )
    }
    
    console.log(`[API] Received metadata:`, metadata)

    // Check cache first
    const cachedData = await getCachedTokenData(tokenAddress)
    if (cachedData && cachedData.priceData && cachedData.securityData) {
      console.log(`✅ Returning cached data for ${tokenAddress}`)
      return NextResponse.json({
        success: true,
        cached: true,
        data: {
          ...cachedData.priceData,
          ...cachedData.securityData,
          tokenomics: cachedData.tokenomics,
        }
      })
    }

    // Check rate limits for FREE users
    if (plan === 'FREE' && userId) {
      const rateLimit = await checkRateLimit(userId, 'FREE')
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Free plan: 10 queries per day',
            upgrade_prompt: 'Upgrade to Premium for unlimited queries',
            reset_time: rateLimit.resetTime
          },
          { status: 429 }
        )
      }
    }

    // ============================================================================
    // NEW: UNIFIED CHAIN-ADAPTIVE DATA FETCHER
    // ============================================================================
    
    let tokenData: TokenData
    
    if (USE_UNIFIED_FETCHER) {
      console.log(`\n🚀 [UNIFIED FETCHER] Fetching complete token data...`)
      
      try {
        // Fetch complete data using chain-adaptive logic
        const completeData = await fetchCompleteTokenData(tokenAddress, chainId)
        
        // Convert to legacy TokenData format
        tokenData = adaptCompleteToLegacy(completeData)
        
        console.log(`✅ [UNIFIED FETCHER] Complete data fetched`)
        console.log(`   Chain Type: ${completeData.chainType}`)
        console.log(`   Data Quality: ${completeData.dataQuality}`)
        console.log(`   Market Cap: $${(completeData.marketCap / 1e6).toFixed(2)}M`)
        console.log(`   Liquidity: $${(completeData.liquidityUSD / 1e3).toFixed(2)}K`)
        console.log(`   Holders: ${completeData.holderCount.toLocaleString()}`)
        console.log(`   Security Score: ${completeData.securityScore}/100`)
        console.log(`   Critical Flags: ${completeData.criticalFlags.length}`)
        
        // Only block if data quality is POOR (< 40 score = missing critical market data)
        if (completeData.dataQuality === 'POOR') {
          console.log(`❌ [UNIFIED FETCHER] Data quality too poor to analyze`)
          return NextResponse.json(
            { 
              error: 'Insufficient token data',
              message: 'Unable to fetch reliable data for this token. Missing critical market data (market cap, liquidity, or supply).',
              data_quality: completeData.dataQuality,
              chain_type: completeData.chainType,
              suggestion: 'This token may not be listed on major data aggregators yet.'
            },
            { status: 404 }
          )
        }
        
        // Warn if MODERATE quality (proceed but flag it)
        if (completeData.dataQuality === 'MODERATE') {
          console.log(`⚠️ [UNIFIED FETCHER] MODERATE data quality - some estimates used`)
        }
      } catch (error) {
        console.error(`❌ [UNIFIED FETCHER] Failed:`, error)
        return NextResponse.json(
          { error: 'Failed to fetch token data', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        )
      }
    } else {
      // OLD LOGIC: Fallback to legacy Mobula + GoPlus flow
      const mobulaData = await fetchMobulaData(tokenAddress, chainId)

      if (!mobulaData) {
        const fallbackData = getFallbackTokenData(tokenAddress)
        if (!fallbackData) {
          return NextResponse.json(
            { error: 'Failed to fetch token data from Mobula API' },
            { status: 404 }
          )
        }
        tokenData = fallbackData
      } else {
        const goplusData = await tryGoPlusWithFallback(tokenAddress, chainId)
        tokenData = { ...mobulaData, ...(goplusData || {}) }
        
        // Use GoPlus holder_count if available
        if (goplusData && goplusData.holder_count) {
          const goplusHolderCount = parseInt(goplusData.holder_count) || 0
          if (goplusHolderCount > 0) {
            console.log(`[Tokenomics] Overriding with GoPlus holder count: ${goplusHolderCount}`)
            tokenData.holderCount = goplusHolderCount
          }
        }
      }
    }

    // ============================================================================
    // RISK CALCULATION WITH AI + TWITTER FEATURES
    // ============================================================================
    
    let result: any
    try {
      // Use legacy calculator with AI/Twitter features
      // (Enhanced and Multi-Chain algorithms currently disabled)
      console.log(`\n🧮 [RISK CALCULATOR] Using legacy 9-factor algorithm with AI enhancements`)
      result = await calculateRisk(tokenData, plan, metadata)
      console.log(`✅ [RISK CALCULATOR] Risk: ${result.overall_risk_score}/100, Level: ${result.risk_level}`)
    } catch (calcError: any) {
      console.error('❌ [RISK CALCULATOR] CRITICAL ERROR:', calcError)
      console.error('[RISK CALCULATOR] Stack:', calcError.stack)
      throw new Error(`Risk calculation failed: ${calcError.message}`)
    }

    // Save to Firestore if userId is provided
    if (userId && userId !== 'anonymous') {
      try {
        // Increment usage counter
        await incrementTokenAnalyzedAdmin(userId)

        // Extract token name and symbol from cache
        const cachedInfo = await getCachedTokenData(tokenAddress)
        const tokenName = cachedInfo?.name || tokenAddress.substring(0, 8) + '...'
        const tokenSymbol = cachedInfo?.symbol || 'TOKEN'

        // Save analysis history
        const analysisHistory: Omit<AnalysisHistoryDocument, 'id'> = {
          tokenAddress,
          tokenName,
          tokenSymbol,
          chainId,
          results: {
            overall_risk_score: result.overall_risk_score,
            risk_level: result.risk_level,
            confidence_score: result.confidence_score,
            breakdown: result.breakdown as Record<string, number>,
            ...(result.critical_flags && { critical_flags: result.critical_flags }),
            ...(result.upcoming_risks && { upcoming_risks: result.upcoming_risks })
          },
          marketSnapshot: {
            price: 0, // Price data not available in current TokenData
            marketCap: tokenData.marketCap || 0,
            volume24h: tokenData.volume24h || 0,
            liquidity: tokenData.liquidityUSD || 0
          },
          plan: plan as 'FREE' | 'PREMIUM',
          analyzedAt: new Date()
        }

        await saveAnalysisHistoryAdmin(userId, analysisHistory)
        console.log(`✅ Saved analysis to Firestore for user ${userId}`)
      } catch (firestoreError) {
        console.error('Failed to save to Firestore:', firestoreError)
        // Don't fail the request if Firestore fails
      }

      // Cache AI summary if available
      try {
        if (result.ai_summary) {
          await setCachedTokenData(tokenAddress, {
            address: tokenAddress,
            name: metadata?.tokenName || tokenAddress.substring(0, 8),
            symbol: metadata?.tokenSymbol || 'TOKEN',
            aiSummary: result.ai_summary,
            chainId: chainId
          })
          console.log(`✅ Cached AI summary for ${tokenAddress}`)
        }
      } catch (cacheError) {
        console.error('Failed to cache AI summary:', cacheError)
        // Don't fail the request if caching fails
      }
    }

    return NextResponse.json({
      ...result,
      raw_data: {
        marketCap: tokenData.marketCap,
        fdv: tokenData.fdv,
        liquidityUSD: tokenData.liquidityUSD,
        holderCount: tokenData.holderCount,
        top10HoldersPct: tokenData.top10HoldersPct,
        // ONLY show txCount if it's real data (not estimated)
        ...(!(tokenData as any).txCount24h_is_estimated && { txCount24h: tokenData.txCount24h }),
        // ONLY show ageDays if it's real data (not estimated)
        ...(!(tokenData as any).ageDays_is_estimated && { ageDays: tokenData.ageDays }),
        is_mintable: tokenData.is_mintable,
        lp_locked: tokenData.lp_locked,
        owner_renounced: tokenData.owner_renounced
      }
    })
  } catch (error: any) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      { error: 'Analysis failed', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Fetch comprehensive token data from Mobula API + Moralis API (for better tokenomics)
 * Mobula: Market data, pricing, basic supply
 * Moralis: Verified holder count, supply details, transaction metrics
 */
async function fetchMobulaData(tokenAddress: string, chainId: string): Promise<TokenData | null> {
  try {
    const apiKey = process.env.MOBULA_API_KEY || ''
    const url = `https://api.mobula.io/api/1/market/data?asset=${encodeURIComponent(tokenAddress)}`
    
    // Fetch from both APIs in parallel
    const [mobulaResponse, moralisTokenData] = await Promise.allSettled([
      fetch(url, {
        headers: {
          'Authorization': apiKey,
          'Accept': 'application/json',
        },
      }),
      // Get Moralis token metadata (supply, decimals, holder count)
      getMoralisTokenMetadata(tokenAddress, chainId)
    ])

    // Check Mobula response
    if (mobulaResponse.status !== 'fulfilled' || !mobulaResponse.value.ok) {
      console.error(`[Mobula] HTTP ${mobulaResponse.status === 'fulfilled' ? mobulaResponse.value.status : 'failed'}`)
      
      // If Mobula fails, we can't continue as we need the full market data
      // Moralis only provides partial tokenomics (supply, holders, tx count)
      // We need Mobula for market cap, FDV, liquidity, etc.
      console.log('[Tokenomics] Cannot proceed without Mobula data - returning null')
      return null
    }

    const json = await mobulaResponse.value.json()
    const data = json.data

    if (!data) {
      console.error('[Mobula] No data in response')
      // Cannot proceed without Mobula market data (marketCap, FDV, liquidity, etc.)
      return null
    }

    // Calculate age in days
    const ageDays = data.creation_date 
      ? Math.floor((Date.now() - new Date(data.creation_date * 1000).getTime()) / (1000 * 60 * 60 * 24))
      : data.age_days || 0

    // Parse supply data from Mobula
    let totalSupply = data.total_supply || data.totalSupply || 0
    let circulatingSupply = data.circulating_supply || data.circulatingSupply || totalSupply
    let holderCount = data.holder_count || data.holders || 0
    let txCount24h = data.transactions_24h || data.tx_count_24h || 0

    // ENHANCE with Moralis data if available (Moralis often more accurate for ERC20 tokens)
    if (moralisTokenData.status === 'fulfilled' && moralisTokenData.value) {
      const moralisData = moralisTokenData.value
      
      // Prefer Moralis holder count (more accurate, real-time on-chain data)
      if (moralisData.holderCount && moralisData.holderCount > 0) {
        console.log(`[Tokenomics] Using Moralis holder count: ${moralisData.holderCount} (Mobula: ${holderCount})`)
        holderCount = moralisData.holderCount
      }
      
      // Prefer Moralis supply if Mobula missing
      if (!totalSupply && moralisData.totalSupply) {
        totalSupply = moralisData.totalSupply
        circulatingSupply = moralisData.circulatingSupply || totalSupply
      }
      
      // Prefer Moralis transaction count (24h transfers from chain)
      if (moralisData.txCount24h && moralisData.txCount24h > txCount24h) {
        console.log(`[Tokenomics] Using Moralis tx count: ${moralisData.txCount24h} (Mobula: ${txCount24h})`)
        txCount24h = moralisData.txCount24h
      }
    }

    const maxSupply = data.max_supply || data.maxSupply || null
    const burnedSupply = data.burned_supply || data.burnedSupply || 0

    // Calculate top 10 holders percentage (if available)
    let top10HoldersPct = 0.5 // Default conservative estimate
    if (data.top_holders && Array.isArray(data.top_holders)) {
      const top10 = data.top_holders.slice(0, 10)
      top10HoldersPct = top10.reduce((sum: number, h: any) => sum + (h.percentage || 0), 0) / 100
    } else if (data.holder_distribution) {
      // Try to extract from holder distribution
      top10HoldersPct = data.holder_distribution.top_10 || 0.5
    }

    // FDV (Fully Diluted Valuation)
    const fdv = data.market_cap_diluted || data.fully_diluted_valuation || (data.market_cap || 0)

    // Liquidity
    const liquidityUSD = data.liquidity || 0

    // Volume 24h
    const volume24h = data.volume || 0

    // Market cap
    const marketCap = data.market_cap || 0

    console.log(`[Tokenomics] Combined data: Holders=${holderCount}, Supply=${totalSupply}, Tx24h=${txCount24h}, Sources=${moralisTokenData.status === 'fulfilled' && moralisTokenData.value ? 'Mobula+Moralis' : 'Mobula'}`)

    return {
      marketCap,
      fdv,
      liquidityUSD,
      totalSupply,
      circulatingSupply,
      maxSupply,
      holderCount,
      top10HoldersPct,
      volume24h,
      ageDays,
      burnedSupply,
      txCount24h,
      // Optional vesting data (if available)
      nextUnlock30dPct: data.next_unlock_30d ? data.next_unlock_30d / 100 : undefined,
      teamVestingMonths: data.team_vesting_months,
      teamAllocationPct: data.team_allocation ? data.team_allocation / 100 : undefined,
    }
  } catch (error: any) {
    console.error('[Mobula] Fetch error:', error?.message || String(error))
    return null
  }
}

/**
 * Fallback data for well-known tokens that might not be in Mobula
 */
function getFallbackTokenData(tokenAddress: string): TokenData | null {
  const addr = tokenAddress.toLowerCase()
  
  // WETH fallback
  if (addr === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') {
    return {
      marketCap: 9000000000, // ~$9B (approximate)
      fdv: 9000000000,
      liquidityUSD: 500000000, // High liquidity
      holderCount: 500000,
      top10HoldersPct: 0.15, // Decentralized
      volume24h: 1500000000,
      txCount24h: 50000,
      ageDays: 2000, // Very old token
      totalSupply: 3000000,
      circulatingSupply: 3000000,
      maxSupply: 0, // No max supply (wraps ETH)
      burnedSupply: 0,
    } as TokenData
  }
  
  return null
}
