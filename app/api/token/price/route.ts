import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { address, symbol, source = 'mobula' } = await request.json()

    if (!address && !symbol) {
      return NextResponse.json(
        { error: 'Token address or symbol is required' },
        { status: 400 }
      )
    }

    let tokenData = null
    let resolvedAddress = address

    // If symbol provided, try to resolve to address via CoinMarketCap /map first
    if (!address && symbol && (source === 'coinmarketcap' || source === 'all')) {
      try {
        const mapUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/map?symbol=${symbol.toUpperCase()}`
        const mapResponse = await fetch(mapUrl, {
          headers: {
            'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '',
          },
        })

        if (mapResponse.ok) {
          const mapData = await mapResponse.json()
          if (mapData.data && mapData.data.length > 0) {
            // Try to find Ethereum token first
            const ethToken = mapData.data.find((t: { blockchains?: string[]; platform?: { token_address?: string } }) =>
              t.blockchains?.includes('Ethereum')
            )
            if (ethToken && ethToken.platform?.token_address) {
              resolvedAddress = ethToken.platform.token_address
            }
          }
        }
      } catch (error) {
        console.error('CoinMarketCap map error:', error)
      }
    }

    // Try Mobula API first (preferred for market data and tokenomics)
    if (source === 'mobula' || source === 'all') {
      try {
        // Mobula expects full token names for symbols, use mapping for common ones
        const symbolToName: Record<string, string> = {
          'BTC': 'Bitcoin',
          'ETH': 'Ethereum',
          'SOL': 'Solana',
          'USDT': 'Tether',
          'USDC': 'USD Coin',
          'BNB': 'BNB',
          'XRP': 'Ripple',
          'ADA': 'Cardano',
          'DOGE': 'Dogecoin',
          'MATIC': 'Polygon',
          'DOT': 'Polkadot',
          'AVAX': 'Avalanche',
        }
        
        // Use address if available, otherwise try name mapping, then raw symbol
        const searchParam = resolvedAddress || address || 
                           (symbol ? symbolToName[symbol.toUpperCase()] || symbol : '')
        
        const mobulaUrl = `https://api.mobula.io/api/1/market/data?asset=${encodeURIComponent(searchParam)}`
        
        const mobulaResponse = await fetch(mobulaUrl, {
          headers: {
            'Authorization': process.env.MOBULA_API_KEY || '',
            'Accept': 'application/json',
          },
        })

        if (mobulaResponse.ok) {
          const mobulaData = await mobulaResponse.json()
          if (mobulaData.data && mobulaData.data.name) {
            tokenData = {
              source: 'mobula',
              name: mobulaData.data.name,
              symbol: mobulaData.data.symbol,
              price: mobulaData.data.price || 0,
              marketCap: mobulaData.data.market_cap || 0,
              volume24h: mobulaData.data.volume || 0,
              priceChange24h: mobulaData.data.price_change_24h || 0,
              liquidity: mobulaData.data.liquidity || 0,
              logo: mobulaData.data.logo || mobulaData.data.image || null,
            }
            
            // Debug log for logo
            if (!tokenData.logo) {
              console.log(`[Price API] No logo found in Mobula response for ${searchParam}`)
            } else {
              console.log(`[Price API] Logo found: ${tokenData.logo}`)
            }
          }
        } else {
          const errorText = await mobulaResponse.text()
          console.error('Mobula API error:', mobulaResponse.status, errorText)
        }
      } catch (error) {
        console.error('Mobula API error:', error)
      }
    }

    // Fallback to CoinGecko if Mobula fails
    if (!tokenData && (source === 'coingecko' || source === 'all')) {
      try {
        // CoinGecko uses different IDs for tokens
        const commonIds: Record<string, string> = {
          'BTC': 'bitcoin',
          'ETH': 'ethereum',
          'SOL': 'solana',
          'USDT': 'tether',
          'USDC': 'usd-coin',
          'BNB': 'binancecoin',
          'XRP': 'ripple',
          'ADA': 'cardano',
          'DOGE': 'dogecoin',
          'MATIC': 'matic-network',
          'DOT': 'polkadot',
          'AVAX': 'avalanche-2',
          'LINK': 'chainlink',
          'UNI': 'uniswap',
          'SHIB': 'shiba-inu',
          'LTC': 'litecoin',
          'TRX': 'tron',
          'ATOM': 'cosmos',
          'ETC': 'ethereum-classic',
          'XLM': 'stellar',
        }
        
        const geckoId = commonIds[symbol?.toUpperCase() || ''] || symbol?.toLowerCase() || ''
        
        if (geckoId) {
          const geckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
          const geckoResponse = await fetch(geckoUrl, {
            headers: {
              'x-cg-demo-api-key': process.env.COINGECKO_API_KEY || '',
              'Accept': 'application/json',
            },
          })

          if (geckoResponse.ok) {
            const geckoData = await geckoResponse.json()
            const data = geckoData[geckoId]
            if (data) {
              tokenData = {
                source: 'coingecko',
                name: symbol || geckoId,
                symbol: symbol?.toUpperCase() || geckoId.toUpperCase(),
                price: data.usd || 0,
                marketCap: data.usd_market_cap || 0,
                volume24h: data.usd_24h_vol || 0,
                priceChange24h: data.usd_24h_change || 0,
              }
            }
          } else {
            const errorText = await geckoResponse.text()
            console.error('CoinGecko API error:', geckoResponse.status, errorText)
          }
        }
      } catch (error) {
        console.error('CoinGecko API error:', error)
      }
    }

    // Fallback to CoinMarketCap if both fail and symbol is provided
    if (!tokenData && symbol && (source === 'coinmarketcap' || source === 'all')) {
      try {
        const cmcUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol.toUpperCase()}`
        const cmcResponse = await fetch(cmcUrl, {
          headers: {
            'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '',
            'Accept': 'application/json',
          },
        })

        if (cmcResponse.ok) {
          const cmcData = await cmcResponse.json()
          if (cmcData.data) {
            const token = Object.values(cmcData.data)[0] as {
              name: string
              symbol: string
              quote: {
                USD: {
                  price: number
                  market_cap: number
                  volume_24h: number
                  percent_change_24h: number
                }
              }
            }
            if (token) {
              tokenData = {
                source: 'coinmarketcap',
                name: token.name,
                symbol: token.symbol,
                price: token.quote.USD.price,
                marketCap: token.quote.USD.market_cap,
                volume24h: token.quote.USD.volume_24h,
                priceChange24h: token.quote.USD.percent_change_24h,
              }
            }
          }
        } else {
          const errorText = await cmcResponse.text()
          console.error('CoinMarketCap API error:', cmcResponse.status, errorText)
        }
      } catch (error) {
        console.error('CoinMarketCap API error:', error)
      }
    }

    if (!tokenData) {
      return NextResponse.json(
        { 
          error: 'Token not found in any API',
          message: 'Please verify the token address or symbol and try again.',
          triedSources: ['mobula', 'coingecko', 'coinmarketcap'],
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tokenData,
    })
  } catch (error) {
    console.error('Token price error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch token price',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
