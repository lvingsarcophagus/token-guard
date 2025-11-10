// Test Moralis API directly
const MORALIS_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImVjNGNlOTJhLTU1MDAtNDIxMy1hNzdmLWJlZTExN2JkYjlkMSIsIm9yZ0lkIjoiNDgwMjU0IiwidXNlcklkIjoiNDk0MDc3IiwidHlwZUlkIjoiN2U4NGNlODYtZGY2My00NmZiLWFmZmMtMjc0OTg3NTgyMzcxIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NjI2MzI3NzEsImV4cCI6NDkxODM5Mjc3MX0.bB42XjZ9c9_DutyOQHK5L04IKkFflkZV0OaMtvDsEz8'

const TEST_TOKEN = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' // UNI
const CHAIN_ID = '1' // Ethereum

async function testMoralisMetadata() {
  console.log('\n🔍 Testing Moralis Token Metadata API...')
  console.log(`Token: ${TEST_TOKEN}`)
  console.log(`Chain: eth (${CHAIN_ID})\n`)
  
  try {
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2.2/erc20/metadata?chain=eth&addresses[]=${TEST_TOKEN}`,
      {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      }
    )
    
    console.log(`Response Status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Moralis API Error: ${errorText}`)
      return
    }
    
    const data = await response.json()
    console.log('\n✅ Moralis Metadata Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (data && data.length > 0) {
      const token = data[0]
      console.log('\n📊 Token Info:')
      console.log(`  Name: ${token.name}`)
      console.log(`  Symbol: ${token.symbol}`)
      console.log(`  Decimals: ${token.decimals}`)
      console.log(`  Total Supply: ${(parseInt(token.total_supply) / Math.pow(10, token.decimals)).toFixed(2)}`)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function testMoralisStats() {
  console.log('\n🔍 Testing Moralis Token Stats API...')
  
  try {
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2.2/erc20/${TEST_TOKEN}/stats?chain=eth`,
      {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      }
    )
    
    console.log(`Response Status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Moralis API Error: ${errorText}`)
      return
    }
    
    const data = await response.json()
    console.log('\n✅ Moralis Stats Response:')
    console.log(JSON.stringify(data, null, 2))
    
    if (data) {
      console.log('\n📊 Token Stats:')
      console.log(`  Holders: ${data.holders_count || 'N/A'}`)
      console.log(`  Total Supply: ${data.total_supply || 'N/A'}`)
      console.log(`  Circulating Supply: ${data.circulating_supply || 'N/A'}`)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function testMoralisTransfers() {
  console.log('\n🔍 Testing Moralis Transfers API...')
  
  try {
    const response = await fetch(
      `https://deep-index.moralis.io/api/v2.2/erc20/${TEST_TOKEN}/transfers?chain=eth&limit=10`,
      {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      }
    )
    
    console.log(`Response Status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Moralis API Error: ${errorText}`)
      return
    }
    
    const data = await response.json()
    console.log('\n✅ Moralis Transfers Response:')
    console.log(`  Total Results: ${data.result?.length || 0}`)
    
    if (data.result && data.result.length > 0) {
      console.log(`\n  Latest Transfer:`)
      const latest = data.result[0]
      console.log(`    From: ${latest.from_address}`)
      console.log(`    To: ${latest.to_address}`)
      console.log(`    Value: ${latest.value}`)
      console.log(`    Time: ${latest.block_timestamp}`)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function runAllTests() {
  console.log('🚀 Starting Moralis API Tests...')
  console.log('='.repeat(60))
  
  await testMoralisMetadata()
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  await testMoralisStats()
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  await testMoralisTransfers()
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Tests Complete!')
}

runAllTests()
