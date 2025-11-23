/**
 * Test Ethereum token data sources
 * Verify Mobula, GoPlus, and Moralis integration
 */

require('dotenv').config({ path: '.env.local' })

// Test with SHIB (popular meme token)
const SHIB_ADDRESS = '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE'
const CHAIN_ID = '1' // Ethereum mainnet

async function testEthereumToken() {
  console.log('\n🧪 Testing Ethereum Token Data Sources (SHIB)\n')
  console.log('='.repeat(60))
  
  try {
    // Test 1: Mobula API
    console.log('\n1️⃣ Testing Mobula API...')
    const mobulaKey = process.env.MOBULA_API_KEY
    if (!mobulaKey) {
      console.error('❌ MOBULA_API_KEY not found')
      return
    }

    const mobulaUrl = `https://api.mobula.io/api/1/market/data?asset=${SHIB_ADDRESS}`
    const mobulaResponse = await fetch(mobulaUrl, {
      headers: {
        'Authorization': mobulaKey,
        'Accept': 'application/json'
      }
    })
    
    const mobulaData = await mobulaResponse.json()
    if (mobulaData.data) {
      console.log('✓ Mobula API Working')
      console.log(`  Market Cap: $${(mobulaData.data.market_cap / 1e6).toFixed(2)}M`)
      console.log(`  Liquidity: $${(mobulaData.data.liquidity / 1e3).toFixed(2)}K`)
      console.log(`  Volume 24h: $${(mobulaData.data.volume / 1e6).toFixed(2)}M`)
      console.log(`  Price: $${mobulaData.data.price}`)
      console.log(`  TX Count 24h: ${mobulaData.data.transactions_24h || mobulaData.data.tx_count_24h || 'N/A'}`)
    } else {
      console.error('❌ Mobula API failed:', mobulaData)
    }

    // Test 2: GoPlus Security API
    console.log('\n2️⃣ Testing GoPlus Security API...')
    const goplusUrl = `https://api.gopluslabs.io/api/v1/token_security/${CHAIN_ID}?contract_addresses=${SHIB_ADDRESS}`
    
    const goplusResponse = await fetch(goplusUrl)
    const goplusData = await goplusResponse.json()
    
    if (goplusData.result && goplusData.result[SHIB_ADDRESS.toLowerCase()]) {
      const security = goplusData.result[SHIB_ADDRESS.toLowerCase()]
      console.log('✓ GoPlus API Working')
      console.log(`  Holder Count: ${security.holder_count}`)
      console.log(`  Owner Address: ${security.owner_address || 'Renounced'}`)
      console.log(`  Is Honeypot: ${security.is_honeypot === '1' ? 'YES ⚠️' : 'NO ✓'}`)
      console.log(`  Is Mintable: ${security.is_mintable === '1' ? 'YES ⚠️' : 'NO ✓'}`)
      console.log(`  Buy Tax: ${security.buy_tax}%`)
      console.log(`  Sell Tax: ${security.sell_tax}%`)
    } else {
      console.error('❌ GoPlus API failed:', goplusData)
    }

    // Test 3: Moralis API
    console.log('\n3️⃣ Testing Moralis API...')
    const moralisKey = process.env.MORALIS_API_KEY
    if (!moralisKey) {
      console.error('❌ MORALIS_API_KEY not found')
      return
    }

    // Get token metadata
    const metadataUrl = `https://deep-index.moralis.io/api/v2.2/erc20/metadata?chain=eth&addresses%5B0%5D=${SHIB_ADDRESS}`
    const metadataResponse = await fetch(metadataUrl, {
      headers: { 'X-API-Key': moralisKey }
    })
    
    const metadataData = await metadataResponse.json()
    if (metadataData && metadataData.length > 0) {
      const token = metadataData[0]
      console.log('✓ Moralis Metadata Working')
      console.log(`  Name: ${token.name}`)
      console.log(`  Symbol: ${token.symbol}`)
      console.log(`  Decimals: ${token.decimals}`)
      console.log(`  Total Supply: ${(parseInt(token.total_supply) / 1e18).toFixed(0)}`)
    }

    // Get recent transfers (for tx count)
    const transfersUrl = `https://deep-index.moralis.io/api/v2.2/${SHIB_ADDRESS}/erc20/transfers?chain=eth&limit=100`
    const transfersResponse = await fetch(transfersUrl, {
      headers: { 'X-API-Key': moralisKey }
    })
    
    const transfersData = await transfersResponse.json()
    if (transfersData && transfersData.result) {
      console.log('✓ Moralis Transfers Working')
      console.log(`  Recent transfers: ${transfersData.result.length}`)
      
      // Count transfers in last 24h
      const now = Date.now()
      const oneDayAgo = now - (24 * 60 * 60 * 1000)
      const tx24h = transfersData.result.filter(tx => {
        const txTime = new Date(tx.block_timestamp).getTime()
        return txTime >= oneDayAgo
      })
      console.log(`  Transfers in 24h: ${tx24h.length}`)
    }

    // Test 4: Combined data quality check
    console.log('\n4️⃣ Data Quality Assessment...')
    const hasMarketCap = mobulaData.data?.market_cap > 0
    const hasLiquidity = mobulaData.data?.liquidity > 0
    const hasHolders = goplusData.result?.[SHIB_ADDRESS.toLowerCase()]?.holder_count > 0
    const hasSecurity = goplusData.result?.[SHIB_ADDRESS.toLowerCase()] !== undefined
    
    console.log(`  Market Cap: ${hasMarketCap ? '✓' : '❌'}`)
    console.log(`  Liquidity: ${hasLiquidity ? '✓' : '❌'}`)
    console.log(`  Holder Count: ${hasHolders ? '✓' : '❌'}`)
    console.log(`  Security Data: ${hasSecurity ? '✓' : '❌'}`)
    
    const dataQuality = [hasMarketCap, hasLiquidity, hasHolders, hasSecurity].filter(Boolean).length
    console.log(`\n  Overall Quality: ${dataQuality}/4 ${dataQuality === 4 ? '✅ EXCELLENT' : dataQuality >= 3 ? '⚠️ GOOD' : '❌ POOR'}`)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Test complete!\n')
}

testEthereumToken()
