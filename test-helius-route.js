/**
 * Test Helius API Integration via Next.js API Route
 * Tests the /api/solana/helius-data endpoint
 */

async function testHeliusAPIRoute(tokenAddress, tokenName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing API Route - ${tokenName}`);
  console.log(`Address: ${tokenAddress}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    const response = await fetch(
      `http://localhost:3000/api/solana/helius-data?address=${tokenAddress}`
    );
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Error: ${errorData.error}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.error(`❌ Request failed: ${data.error}`);
      return null;
    }
    
    console.log('\n✅ API Route Response:');
    console.log(`  Success: ${data.success}`);
    
    if (data.data) {
      const { metadata, authorities, holders, transactions, price, recentActivity } = data.data;
      
      console.log('\n📊 Metadata:');
      console.log(`  Name: ${metadata?.name || 'N/A'}`);
      console.log(`  Symbol: ${metadata?.symbol || 'N/A'}`);
      console.log(`  Supply: ${metadata?.supply || 'N/A'}`);
      console.log(`  Decimals: ${metadata?.decimals || 'N/A'}`);
      
      console.log('\n🔐 Authorities:');
      console.log(`  Freeze Authority: ${authorities?.freezeAuthority ? '⚠️  SET' : '✅ Revoked'}`);
      console.log(`  Mint Authority: ${authorities?.mintAuthority ? '⚠️  SET' : '✅ Revoked'}`);
      console.log(`  Update Authority: ${authorities?.updateAuthority ? '⚠️  SET' : '✅ Revoked'}`);
      
      console.log('\n👥 Holders:');
      console.log(`  Count: ${holders?.count || 0}`);
      console.log(`  Top Holders: ${holders?.topHolders?.length || 0}`);
      
      console.log('\n📈 Transactions:');
      console.log(`  Count 24h: ${transactions?.count24h || 0}`);
      console.log(`  Volume 24h: ${transactions?.volume24h || 0}`);
      console.log(`  Unique Traders 24h: ${transactions?.uniqueTraders24h || 0}`);
      
      if (price) {
        console.log('\n💰 Price:');
        console.log(`  Price: $${price.price || 0}`);
        console.log(`  24h Change: ${price.priceChange24h || 0}%`);
      }
      
      console.log('\n🔄 Recent Activity:');
      console.log(`  Transactions: ${recentActivity?.length || 0}`);
      
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Test Failed: ${error.message}`);
    return null;
  }
}

async function checkServerStatus() {
  console.log('\n🔍 Checking if Next.js dev server is running...');
  
  try {
    const response = await fetch('http://localhost:3000/', { method: 'HEAD' });
    if (response.ok || response.status === 404) {
      console.log('✅ Server is running on http://localhost:3000');
      return true;
    }
  } catch (error) {
    console.error('❌ Server is NOT running!');
    console.error('Please start the dev server with: npm run dev');
    return false;
  }
  
  return false;
}

async function runAPITests() {
  console.log('\n🚀 HELIUS API ROUTE INTEGRATION TEST');
  console.log('Testing: /api/solana/helius-data');
  
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    console.log('\n⚠️  Cannot run tests without server. Please start with: npm run dev');
    return;
  }
  
  const TEST_TOKENS = {
    BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    SOL: 'So11111111111111111111111111111111111111112'
  };
  
  const results = {};
  
  for (const [name, address] of Object.entries(TEST_TOKENS)) {
    results[name] = await testHeliusAPIRoute(address, name);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const tokens = Object.keys(TEST_TOKENS);
  let passed = 0;
  
  tokens.forEach(token => {
    const status = results[token] ? '✅' : '❌';
    console.log(`  ${status} ${token}`);
    if (results[token]) passed++;
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`OVERALL: ${passed}/${tokens.length} tests passed (${Math.round(passed/tokens.length*100)}%)`);
  console.log('='.repeat(60));
  
  if (passed === tokens.length) {
    console.log('\n🎉 ALL TESTS PASSED! Helius API route is working perfectly.');
  } else if (passed > 0) {
    console.log('\n⚠️  SOME TESTS FAILED. The API is partially working.');
  } else {
    console.log('\n❌ ALL TESTS FAILED. Please check the API implementation.');
  }
}

runAPITests().catch(console.error);
