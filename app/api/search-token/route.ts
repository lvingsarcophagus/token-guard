import { NextRequest, NextResponse } from 'next/server'

/**
 * Token Search API
 * Search for tokens by name or symbol using CoinMarketCap
 * Returns contract addresses that can be fed to Mobula for analysis
 */

interface CMCSearchResult {
  id: number
  name: string
  symbol: string
  slug: string
  rank: number
  platform?: {
    name: string
    token_address: string
  }
  is_active: number
}

interface TokenSearchResult {
  name: string
  symbol: string
  address: string | null
  chain: string | null
  cmcId: number
  rank: number
  slug: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      )
    }

    const apiKey = process.env.COINMARKETCAP_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'CoinMarketCap API key not configured' },
        { status: 500 }
      )
    }

    console.log(`🔍 [Token Search] Searching for: ${query}`)

    // Use CMC cryptocurrency/map endpoint to search
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=${encodeURIComponent(query.toUpperCase())}&limit=10`

    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`[Token Search] CMC API error: ${response.status}`)
      return NextResponse.json(
        { error: 'CoinMarketCap API request failed' },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.data || data.data.length === 0) {
      console.log(`[Token Search] No results found for: ${query}`)
      return NextResponse.json({ results: [] })
    }

    // Transform results to our format
    const results: TokenSearchResult[] = data.data.map((token: CMCSearchResult) => ({
      name: token.name,
      symbol: token.symbol,
      address: token.platform?.token_address || null,
      chain: token.platform?.name || null,
      cmcId: token.id,
      rank: token.rank,
      slug: token.slug
    }))

    console.log(`✅ [Token Search] Found ${results.length} results`)

    return NextResponse.json({
      results,
      query
    })

  } catch (error: any) {
    console.error('[Token Search] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Advanced search with name matching (more expensive API call)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, limit = 10 } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      )
    }

    const apiKey = process.env.COINMARKETCAP_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'CoinMarketCap API key not configured' },
        { status: 500 }
      )
    }

    console.log(`🔍 [Token Search Advanced] Searching for: ${query}`)

    // Get token details with quotes for better matching
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=100`

    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`[Token Search Advanced] CMC API error: ${response.status}`)
      return NextResponse.json(
        { error: 'CoinMarketCap API request failed' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Filter by name or symbol match (case-insensitive)
    const queryLower = query.toLowerCase()
    const matches = data.data.filter((token: any) => 
      token.name.toLowerCase().includes(queryLower) ||
      token.symbol.toLowerCase().includes(queryLower)
    ).slice(0, limit)

    // Get detailed info for each match to get contract addresses
    const results: TokenSearchResult[] = []
    
    for (const token of matches) {
      try {
        const infoUrl = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?id=${token.id}`
        
        const infoResponse = await fetch(infoUrl, {
          headers: {
            'X-CMC_PRO_API_KEY': apiKey,
            'Accept': 'application/json'
          }
        })

        if (infoResponse.ok) {
          const infoData = await infoResponse.json()
          const tokenInfo = infoData.data[token.id]

          // Get primary contract address (usually Ethereum)
          let address = null
          let chain = null

          if (tokenInfo.platform) {
            address = tokenInfo.platform.token_address
            chain = tokenInfo.platform.name
          }

          results.push({
            name: token.name,
            symbol: token.symbol,
            address,
            chain,
            cmcId: token.id,
            rank: token.cmc_rank,
            slug: token.slug
          })
        }
      } catch (err) {
        console.error(`[Token Search] Error fetching info for ${token.symbol}:`, err)
      }
    }

    console.log(`✅ [Token Search Advanced] Found ${results.length} results`)

    return NextResponse.json({
      results,
      query
    })

  } catch (error: any) {
    console.error('[Token Search Advanced] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
