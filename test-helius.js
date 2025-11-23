/**
 * Helius API Test Script
 * Tests the Helius API integration for Solana token data
 */

const HELIUS_API_KEY = '33b8214f-6f46-4927-bd29-e54801f23c20';
const HELIUS_BASE_URL = 'https://api.helius.xyz/v0';

// Test token addresses
const TEST_TOKENS = {
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  SOL: 'So11111111111111111111111111111111111111112' // Wrapped SOL
};

async function testHeliusTokenMetadata(tokenAddress, tokenName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing Helius Token Metadata API - ${tokenName}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    const response = await fetch(
      `${HELIUS_BASE_URL}/token-metadata?api-key=${HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mintAccounts: [tokenAddress]
        })
      }
    );

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error Response: ${errorText}`);
      return null;
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.warn('⚠️  No data returned for token');
      return null;
    }

    const tokenData = data[0];
    console.log('\n✅ Token Metadata Retrieved:');
    console.log(`  Symbol: ${tokenData.onChainMetadata?.metadata?.data?.symbol || 'N/A'}`);
    console.log(`  Name: ${tokenData.onChainMetadata?.metadata?.data?.name || 'N/A'}`);
    console.log(`  Decimals: ${tokenData.decimals || 'N/A'}`);
    console.log(`  Supply: ${tokenData.supply || 'N/A'}`);
    console.log('\n🔐 Authority Data:');
    console.log(`  Freeze Authority: ${tokenData.freezeAuthority ? '✓ SET (RISK!)' : '✗ Revoked (Safe)'}`);
    console.log(`  Mint Authority: ${tokenData.mintAuthority ? '✓ SET' : '✗ Revoked'}`);
    console.log(`  Update Authority: ${tokenData.updateAuthority ? '✓ SET' : '✗ Revoked'}`);
    
    if (tokenData.freezeAuthority) {
      console.log(`  ⚠️  Freeze Authority Address: ${tokenData.freezeAuthority}`);
    }
    if (tokenData.mintAuthority) {
      console.log(`  ⚠️  Mint Authority Address: ${tokenData.mintAuthority}`);
    }
    
    return tokenData;
  } catch (error) {
    console.error(`❌ Test Failed: ${error.message}`);
    return null;
  }
}

async function testHeliusRPC(tokenAddress, tokenName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing Helius RPC - Token Largest Accounts - ${tokenName}`);
  console.log(`${'='.repeat(60)}`);
  
  const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
  
  try {
    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'test-holders',
        method: 'getTokenLargestAccounts',
        params: [tokenAddress]
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error Response: ${errorText}`);
      return null;
    }

    const data = await response.json();
    
    if (data.result && data.result.value) {
      const accounts = data.result.value;
      console.log(`\n✅ Found ${accounts.length} largest holders:`);
      
      accounts.slice(0, 5).forEach((acc, index) => {
        console.log(`  ${index + 1}. ${acc.address}`);
        console.log(`     Balance: ${acc.amount} (UI: ${acc.uiAmount})`);
      });
      
      return accounts;
    } else {
      console.warn('⚠️  No holder data returned');
      return null;
    }
  } catch (error) {
    console.error(`❌ Test Failed: ${error.message}`);
    return null;
  }
}

async function testHeliusTransactions(tokenAddress, tokenName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing Helius Enhanced Transactions API - ${tokenName}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    const response = await fetch(
      `${HELIUS_BASE_URL}/addresses/${tokenAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=10`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error Response: ${errorText}`);
      return null;
    }

    const transactions = await response.json();
    
    if (Array.isArray(transactions)) {
      console.log(`\n✅ Found ${transactions.length} recent transactions`);
      
      if (transactions.length > 0) {
        const tx = transactions[0];
        console.log('\nLatest Transaction:');
        console.log(`  Signature: ${tx.signature || 'N/A'}`);
        console.log(`  Type: ${tx.type || 'N/A'}`);
        console.log(`  Timestamp: ${tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : 'N/A'}`);
        console.log(`  Fee Payer: ${tx.feePayer || 'N/A'}`);
      }
      
      return transactions;
    } else {
      console.warn('⚠️  No transaction data returned');
      return null;
    }
  } catch (error) {
    console.error(`❌ Test Failed: ${error.message}`);
    return null;
  }
}

async function runAllTests() {
  console.log('\n🚀 HELIUS API INTEGRATION TEST SUITE');
  console.log(`API Key: ${HELIUS_API_KEY.substring(0, 8)}...`);
  console.log(`Base URL: ${HELIUS_BASE_URL}`);
  
  const results = {
    metadata: {},
    holders: {},
    transactions: {}
  };
  
  // Test each token
  for (const [name, address] of Object.entries(TEST_TOKENS)) {
    // Test Token Metadata
    results.metadata[name] = await testHeliusTokenMetadata(address, name);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit delay
    
    // Test Holder Data
    results.holders[name] = await testHeliusRPC(address, name);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test Transactions
    results.transactions[name] = await testHeliusTransactions(address, name);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const tests = ['metadata', 'holders', 'transactions'];
  const tokens = Object.keys(TEST_TOKENS);
  
  tests.forEach(testType => {
    console.log(`\n${testType.toUpperCase()}:`);
    tokens.forEach(token => {
      const status = results[testType][token] ? '✅' : '❌';
      console.log(`  ${status} ${token}`);
    });
  });
  
  // Overall Status
  const totalTests = tests.length * tokens.length;
  const passedTests = tests.reduce((sum, testType) => {
    return sum + tokens.filter(token => results[testType][token]).length;
  }, 0);
  
  console.log('\n' + '='.repeat(60));
  console.log(`OVERALL: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
  console.log('='.repeat(60));
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Helius API is working perfectly.');
  } else if (passedTests > 0) {
    console.log('\n⚠️  SOME TESTS FAILED. Check the output above for details.');
  } else {
    console.log('\n❌ ALL TESTS FAILED. Please check your API key and network connection.');
  }
}

// Run the tests
runAllTests().catch(console.error);
