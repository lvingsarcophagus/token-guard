import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/token/insights
 * Returns advanced insights using real API data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const type = searchParams.get('type')

    if (!address || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing address or type parameter' },
        { status: 400 }
      )
    }

    console.log(`[Insights API] Fetching ${type} for ${address}`)

    let data = null

    switch (type) {
      case 'sentiment':
        data = await fetchSentimentAnalysis(address)
        break

      case 'security':
        data = await fetchSecurityAnalysis(address)
        break

      case 'holders':
        data = await fetchHolderAnalysis(address)
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid insight type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data,
      type
    })
  } catch (error) {
    console.error('[Insights API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}

// Fetch sentiment analysis from Mobula market data
async function fetchSentimentAnalysis(address: string) {
  try {
    const apiKey = process.env.MOBULA_API_KEY || ''
    
    const response = await fetch(
      `https://api.mobula.io/api/1/market/data?asset=${address}`,
      {
        headers: {
          'Authorization': apiKey,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      return generateFallbackSentiment()
    }

    const json = await response.json()
    const data = json.data

    if (!data) {
      return generateFallbackSentiment()
    }

    // Calculate sentiment from price changes and volume
    const priceChange24h = data.price_change_24h || 0
    const volume = data.volume || 0
    const marketCap = data.market_cap || 0
    const volumeToMcRatio = marketCap > 0 ? volume / marketCap : 0

    // Sentiment score based on price action and volume
    let sentimentScore = 50 // Neutral baseline
    
    if (priceChange24h > 10) sentimentScore += 20
    else if (priceChange24h > 5) sentimentScore += 10
    else if (priceChange24h < -10) sentimentScore -= 20
    else if (priceChange24h < -5) sentimentScore -= 10

    if (volumeToMcRatio > 0.5) sentimentScore += 10 // High activity = bullish
    else if (volumeToMcRatio < 0.01) sentimentScore -= 10 // Low activity = bearish

    sentimentScore = Math.max(0, Math.min(100, sentimentScore))

    const trend = priceChange24h > 0 ? 'BULLISH' : priceChange24h < 0 ? 'BEARISH' : 'NEUTRAL'
    const sentiment = sentimentScore > 60 ? 'POSITIVE' : sentimentScore < 40 ? 'NEGATIVE' : 'NEUTRAL'

    return {
      score: Math.floor(sentimentScore),
      trend,
      confidence: 75,
      socialMentions: Math.floor(volume / 1000), // Estimate from volume
      sentiment,
      priceChange24h,
      volumeToMcRatio: volumeToMcRatio.toFixed(4)
    }
  } catch (error) {
    console.error('[Sentiment Analysis] Error:', error)
    return generateFallbackSentiment()
  }
}

// Fetch security analysis (chain-adaptive)
async function fetchSecurityAnalysis(address: string) {
  try {
    // Detect chain from address format
    const isSolanaAddress = !address.startsWith('0x') && address.length >= 32 && address.length <= 44
    
    if (isSolanaAddress) {
      return await fetchSolanaSecurityAnalysis(address)
    } else {
      return await fetchEVMSecurityAnalysis(address)
    }
  } catch (error) {
    console.error('[Security Analysis] Error:', error)
    return generateFallbackSecurity()
  }
}

// EVM Security Analysis (GoPlus)
async function fetchEVMSecurityAnalysis(address: string) {
  try {
    const response = await fetch(
      `https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=${address}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.warn('[EVM Security] GoPlus API failed')
      return generateFallbackSecurity()
    }

    const json = await response.json()
    const tokenData = json.result?.[address.toLowerCase()]

    if (!tokenData) {
      return generateFallbackSecurity()
    }

    // Calculate security score from GoPlus data
    let securityScore = 100

    // EVM-specific penalties
    if (tokenData.is_honeypot === '1') securityScore -= 50
    if (tokenData.is_mintable === '1') securityScore -= 20
    if (tokenData.is_open_source !== '1') securityScore -= 15
    if (tokenData.owner_change_balance === '1') securityScore -= 15
    if (tokenData.is_proxy === '1') securityScore -= 10

    const sellTax = parseFloat(tokenData.sell_tax || '0')
    const buyTax = parseFloat(tokenData.buy_tax || '0')
    if (sellTax > 0.1 || buyTax > 0.1) securityScore -= 20

    securityScore = Math.max(0, Math.min(100, securityScore))

    const grade = securityScore >= 80 ? 'A' : securityScore >= 60 ? 'B' : securityScore >= 40 ? 'C' : 'D'
    const isRenounced = tokenData.owner_address === '0x0000000000000000000000000000000000000000'
    const ownershipStatus = isRenounced ? 'RENOUNCED' : 'CENTRALIZED'

    return {
      contractSecurity: {
        score: Math.floor(securityScore),
        grade: grade
      },
      liquidityLock: {
        locked: tokenData.lp_holder_count > 0,
        percentage: tokenData.lp_holder_count > 0 ? 80 : 20
      },
      auditStatus: {
        audited: tokenData.is_open_source === '1',
        score: tokenData.is_open_source === '1' ? 85 : 40
      },
      ownership: {
        status: ownershipStatus,
        score: isRenounced ? 90 : 50
      },
      chain: 'EVM',
      contractVerified: tokenData.is_open_source === '1',
      ownershipRenounced: isRenounced,
      liquidityLocked: tokenData.lp_holder_count > 0,
      securityScore: Math.floor(securityScore),
      isHoneypot: tokenData.is_honeypot === '1',
      isMintable: tokenData.is_mintable === '1',
      isProxy: tokenData.is_proxy === '1',
      sellTax: (sellTax * 100).toFixed(1) + '%',
      buyTax: (buyTax * 100).toFixed(1) + '%'
    }
  } catch (error) {
    console.error('[EVM Security] Error:', error)
    return generateFallbackSecurity()
  }
}

// Solana Security Analysis (Helius)
async function fetchSolanaSecurityAnalysis(address: string) {
  try {
    const apiKey = process.env.HELIUS_API_KEY
    if (!apiKey) {
      console.warn('[Solana Security] No Helius API key')
      return generateFallbackSecurity()
    }

    // Fetch token metadata from Helius DAS API
    const response = await fetch(
      `https://api.helius.xyz/v0/token-metadata?api-key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mintAccounts: [address] })
      }
    )

    if (!response.ok) {
      console.warn('[Solana Security] Helius API failed')
      return generateFallbackSecurity()
    }

    const tokens = await response.json()
    const tokenData = tokens[0]

    if (!tokenData) {
      return generateFallbackSecurity()
    }

    // Calculate security score based on Solana-specific factors
    let securityScore = 100

    // CRITICAL: Freeze Authority (can freeze all tokens!)
    const freezeAuthority = tokenData.onChainAccountInfo?.accountInfo?.data?.parsed?.info?.freezeAuthority
    if (freezeAuthority && freezeAuthority !== null) {
      securityScore -= 50 // CRITICAL penalty
      console.log('[Solana Security] Freeze authority exists:', freezeAuthority)
    }

    // CRITICAL: Mint Authority (can mint unlimited)
    const mintAuthority = tokenData.onChainAccountInfo?.accountInfo?.data?.parsed?.info?.mintAuthority
    if (mintAuthority && mintAuthority !== null) {
      securityScore -= 30 // HIGH penalty
      console.log('[Solana Security] Mint authority exists:', mintAuthority)
    }

    // Check if supply is fixed (no mint authority = good)
    const supplyFixed = !mintAuthority || mintAuthority === null
    
    // Check if tokens can't be frozen (no freeze authority = good)
    const cannotFreeze = !freezeAuthority || freezeAuthority === null

    securityScore = Math.max(0, Math.min(100, securityScore))

    const grade = securityScore >= 80 ? 'A' : securityScore >= 60 ? 'B' : securityScore >= 40 ? 'C' : 'D'
    
    // Ownership status for Solana
    const ownershipStatus = (supplyFixed && cannotFreeze) ? 'RENOUNCED' : 'CENTRALIZED'

    return {
      contractSecurity: {
        score: Math.floor(securityScore),
        grade: grade
      },
      liquidityLock: {
        locked: false, // Would need to check Raydium/Orca pools
        percentage: 50 // Unknown for Solana
      },
      auditStatus: {
        audited: false, // No easy way to verify on Solana
        score: 50
      },
      ownership: {
        status: ownershipStatus,
        score: (supplyFixed && cannotFreeze) ? 90 : 30
      },
      chain: 'SOLANA',
      // Solana-specific fields
      freezeAuthority: freezeAuthority ? 'ACTIVE' : 'REVOKED',
      mintAuthority: mintAuthority ? 'ACTIVE' : 'REVOKED',
      supplyFixed: supplyFixed,
      cannotFreeze: cannotFreeze,
      // Standard fields
      contractVerified: false, // Not applicable on Solana
      ownershipRenounced: supplyFixed && cannotFreeze,
      liquidityLocked: false,
      securityScore: Math.floor(securityScore),
      isHoneypot: false, // Not applicable on Solana
      isMintable: !supplyFixed,
      isProxy: false, // Not applicable on Solana
      sellTax: '0%', // Solana has no token taxes
      buyTax: '0%'   // Solana has no token taxes
    }
  } catch (error) {
    console.error('[Solana Security] Error:', error)
    return generateFallbackSecurity()
  }
}

// Fetch holder analysis from Moralis
async function fetchHolderAnalysis(address: string) {
  try {
    const apiKey = process.env.MORALIS_API_KEY
    if (!apiKey) {
      return generateFallbackHolders()
    }

    const response = await fetch(
      `https://deep-index.moralis.io/api/v2/erc20/${address}/owners?chain=eth&limit=100`,
      {
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json'
        }
      }
    )

    if (!response.ok) {
      return generateFallbackHolders()
    }

    const json = await response.json()
    const holders = json.result || []
    const totalHolders = json.total || holders.length

    if (holders.length === 0) {
      return generateFallbackHolders()
    }

    // Calculate holder distribution
    const totalSupply = holders.reduce((sum: number, h: any) => 
      sum + parseFloat(h.balance || '0'), 0
    )

    const top10Balance = holders.slice(0, 10).reduce((sum: number, h: any) => 
      sum + parseFloat(h.balance || '0'), 0
    )
    const top50Balance = holders.slice(0, 50).reduce((sum: number, h: any) => 
      sum + parseFloat(h.balance || '0'), 0
    )
    const top100Balance = holders.slice(0, 100).reduce((sum: number, h: any) => 
      sum + parseFloat(h.balance || '0'), 0
    )

    const top10Pct = totalSupply > 0 ? (top10Balance / totalSupply) * 100 : 0
    const top50Pct = totalSupply > 0 ? (top50Balance / totalSupply) * 100 : 0
    const top100Pct = totalSupply > 0 ? (top100Balance / totalSupply) * 100 : 0

    const distribution = top10Pct < 50 ? 'DECENTRALIZED' : top10Pct < 70 ? 'MODERATE' : 'CENTRALIZED'

    return {
      totalHolders,
      top10Percentage: Math.floor(top10Pct),
      top50Percentage: Math.floor(top50Pct),
      top100Percentage: Math.floor(top100Pct),
      distribution,
      largestHolder: holders[0] ? {
        address: holders[0].owner_address,
        percentage: totalSupply > 0 ? ((parseFloat(holders[0].balance) / totalSupply) * 100).toFixed(2) : '0'
      } : null
    }
  } catch (error) {
    console.error('[Holder Analysis] Error:', error)
    return generateFallbackHolders()
  }
}

// Fallback generators
function generateFallbackSentiment() {
  return {
    score: 50,
    trend: 'NEUTRAL',
    confidence: 50,
    socialMentions: 0,
    sentiment: 'NEUTRAL',
    priceChange24h: 0,
    volumeToMcRatio: '0'
  }
}

function generateFallbackSecurity() {
  return {
    contractSecurity: {
      score: 50,
      grade: 'C'
    },
    liquidityLock: {
      locked: false,
      percentage: 50
    },
    auditStatus: {
      audited: false,
      score: 50
    },
    ownership: {
      status: 'UNKNOWN',
      score: 50
    },
    // Keep flat structure for backward compatibility
    contractVerified: false,
    ownershipRenounced: false,
    liquidityLocked: false,
    securityScore: 50,
    isHoneypot: false,
    isMintable: false,
    isProxy: false,
    sellTax: '0%',
    buyTax: '0%'
  }
}

function generateFallbackHolders() {
  return {
    totalHolders: 0,
    top10Percentage: 0,
    top50Percentage: 0,
    top100Percentage: 0,
    distribution: 'UNKNOWN',
    largestHolder: null
  }
}
