/**
 * Official Token Resolver using CoinGecko API
 * Verifies if a token is legitimate with >$50M market cap
 */

interface CoinGeckoToken {
  id: string
  symbol: string
  name: string
  market_cap: number
  market_cap_rank: number
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3'
const MARKET_CAP_THRESHOLD = 50_000_000 // $50M

// Cache to avoid repeated API calls
const tokenCache = new Map<string, { isOfficial: boolean; timestamp: number }>()
const CACHE_TTL = 3600000 // 1 hour

/**
 * Check if token is official via CoinGecko (top tokens by market cap)
 */
export async function isOfficialToken(
  tokenSymbol: string,
  tokenAddress?: string
): Promise<{ isOfficial: boolean; marketCap?: number; name?: string }> {
  const cacheKey = tokenAddress || tokenSymbol.toUpperCase()
  
  // Check cache first
  const cached = tokenCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { isOfficial: cached.isOfficial }
  }

  try {
    // STEP 1: Search CoinGecko for the token
    const searchUrl = tokenAddress
      ? `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${tokenAddress}`
      : `${COINGECKO_API}/coins/markets?vs_currency=usd&symbols=${tokenSymbol.toUpperCase()}&per_page=10`

    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.warn('[Official Token Resolver] CoinGecko API failed:', response.status)
      return { isOfficial: false }
    }

    const tokens: CoinGeckoToken[] = await response.json()

    // STEP 2: Find matching token with >$50M market cap
    const officialToken = tokens.find(t => 
      t.symbol.toUpperCase() === tokenSymbol.toUpperCase() &&
      t.market_cap >= MARKET_CAP_THRESHOLD
    )

    if (officialToken) {
      console.log(`[Official Token Resolver] ✓ Found official token: ${officialToken.name} ($${(officialToken.market_cap / 1e6).toFixed(0)}M MC, Rank #${officialToken.market_cap_rank})`)
      
      // Cache result
      tokenCache.set(cacheKey, { isOfficial: true, timestamp: Date.now() })
      
      return {
        isOfficial: true,
        marketCap: officialToken.market_cap,
        name: officialToken.name
      }
    }

    // Token not found or market cap too low
    tokenCache.set(cacheKey, { isOfficial: false, timestamp: Date.now() })
    return { isOfficial: false }

  } catch (error) {
    console.error('[Official Token Resolver] Error:', error)
    return { isOfficial: false }
  }
}

/**
 * Apply official token override to risk score
 * If token is official + >$50M MC → drop score by 45+ and remove false flags
 * BUT: Reduce bonus for meme tokens (they're inherently riskier)
 */
export function applyOfficialTokenOverride(
  currentScore: number,
  isOfficial: boolean,
  marketCap?: number,
  isMemeToken?: boolean
): { score: number; flagsRemoved: string[] } {
  if (!isOfficial) {
    return { score: currentScore, flagsRemoved: [] }
  }

  const flagsRemoved: string[] = []

  // Reduce bonus for meme tokens (they're volatile even if official)
  const baseBonus = isMemeToken ? 25 : 45 // Meme tokens get smaller bonus
  let newScore = Math.max(currentScore - baseBonus, 0)

  // Additional market cap bonus (also reduced for memes)
  if (marketCap && marketCap > 1_000_000_000) { // >$1B
    const mcBonus = isMemeToken ? 5 : 10
    newScore = Math.max(newScore - mcBonus, 0)
    flagsRemoved.push('High market cap verified token')
  } else if (marketCap && marketCap > 500_000_000) { // >$500M
    const mcBonus = isMemeToken ? 3 : 5
    newScore = Math.max(newScore - mcBonus, 0)
  }

  const tokenType = isMemeToken ? 'official meme token' : 'official token'
  console.log(`[Official Token Override] Score adjusted: ${currentScore} → ${newScore} (${tokenType} bonus: -${baseBonus})`)

  return { score: newScore, flagsRemoved }
}

/**
 * Get list of top official tokens (cache for faster lookups)
 */
let officialTokenListCache: string[] | null = null
let officialTokenListTimestamp = 0

export async function getOfficialTokenList(): Promise<string[]> {
  // Return cached list if fresh (1 hour)
  if (officialTokenListCache && Date.now() - officialTokenListTimestamp < CACHE_TTL) {
    return officialTokenListCache
  }

  try {
    const response = await fetch(`${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1`, {
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      return officialTokenListCache || []
    }

    const tokens: CoinGeckoToken[] = await response.json()
    officialTokenListCache = tokens
      .filter(t => t.market_cap >= MARKET_CAP_THRESHOLD)
      .map(t => t.symbol.toUpperCase())
    
    officialTokenListTimestamp = Date.now()
    
    return officialTokenListCache
  } catch (error) {
    console.error('[Official Token List] Error:', error)
    return officialTokenListCache || []
  }
}
