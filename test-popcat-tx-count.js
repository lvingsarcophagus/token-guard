/**
 * Test POPCAT transaction count from Helius
 * Verify that Helius data overrides Mobula's 0 transaction count
 */

require('dotenv').config({ path: '.env.local' })

const POPCAT_ADDRESS = '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr'

async function testHeliusTransactions() {
  console.log('\n🧪 Testing Helius Transaction Count for POPCAT\n')
  console.log('='.repeat(60))
  
  try {
    const heliusKey = process.env.HELIUS_API_KEY
    if (!heliusKey) {
      console.error('❌ HELIUS_API_KEY not found in .env.local')
      return
    }

    // Test 1: Get enhanced data from Helius
    console.log('\n1️⃣ Fetching Helius Enhanced Data...')
    const enhancedUrl = `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
    
    const dasResponse = await fetch(enhancedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'test',
        method: 'getAsset',
        params: { id: POPCAT_ADDRESS }
      })
    })
    
    const dasData = await dasResponse.json()
    console.log('✓ DAS API Response:', dasData.result ? 'Success' : 'Failed')
    
    if (dasData.result) {
      console.log(`  Name: ${dasData.result.content?.metadata?.name}`)
      console.log(`  Symbol: ${dasData.result.content?.metadata?.symbol}`)
      console.log(`  Supply: ${dasData.result.token_info?.supply}`)
    }

    // Test 2: Get transaction count
    console.log('\n2️⃣ Fetching Recent Transactions...')
    const txUrl = `https://api.helius.xyz/v0/addresses/${POPCAT_ADDRESS}/transactions?api-key=${heliusKey}&limit=100`
    
    const txResponse = await fetch(txUrl)
    const transactions = await txResponse.json()
    
    if (Array.isArray(transactions)) {
      console.log(`✓ Fetched ${transactions.length} recent transactions`)
      
      // Count transactions in last 24h
      const now = Date.now()
      const oneDayAgo = now - (24 * 60 * 60 * 1000)
      
      const tx24h = transactions.filter(tx => {
        const txTime = tx.timestamp * 1000
        return txTime >= oneDayAgo
      })
      
      console.log(`✓ Transactions in last 24h: ${tx24h.length}`)
      
      // Count unique traders
      const uniqueTraders = new Set()
      tx24h.forEach(tx => {
        if (tx.feePayer) uniqueTraders.add(tx.feePayer)
      })
      
      console.log(`✓ Unique traders in 24h: ${uniqueTraders.size}`)
      
      // Show sample transaction
      if (tx24h.length > 0) {
        const sample = tx24h[0]
        const timeAgo = Math.floor((now - sample.timestamp * 1000) / 60000)
        console.log(`\n  Latest transaction:`)
        console.log(`    Time: ${timeAgo} minutes ago`)
        console.log(`    Type: ${sample.type}`)
        console.log(`    Fee Payer: ${sample.feePayer?.slice(0, 8)}...`)
      }
    } else {
      console.error('❌ Failed to fetch transactions:', transactions)
    }

    // Test 3: Test the full analyze-token endpoint
    console.log('\n3️⃣ Testing Full Analyze Token Endpoint...')
    console.log('   (This will show if Helius data overrides Mobula)')
    
    const analyzeResponse = await fetch('http://localhost:3000/api/analyze-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenAddress: POPCAT_ADDRESS,
        chainId: '501',
        plan: 'PREMIUM',
        bypassCache: true
      })
    })
    
    if (analyzeResponse.ok) {
      const result = await analyzeResponse.json()
      console.log('✓ API Response received')
      console.log(`  Market Cap: $${(result.data?.marketCap / 1e6).toFixed(2)}M`)
      console.log(`  Liquidity: $${(result.data?.liquidityUSD / 1e6).toFixed(2)}M`)
      console.log(`  Holders: ${result.data?.holderCount}`)
      console.log(`  TX Count 24h: ${result.data?.txCount24h} ⬅️ THIS SHOULD BE 77+, NOT 0`)
      console.log(`  Risk Score: ${result.data?.riskScore}`)
      
      if (result.data?.txCount24h === 0) {
        console.error('\n❌ PROBLEM: txCount24h is still 0!')
        console.error('   Helius data is not overriding Mobula data')
      } else {
        console.log('\n✅ SUCCESS: txCount24h is using Helius data!')
      }
    } else {
      console.error('❌ API call failed:', analyzeResponse.status)
      const error = await analyzeResponse.text()
      console.error('   Error:', error)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Test complete!\n')
}

testHeliusTransactions()
