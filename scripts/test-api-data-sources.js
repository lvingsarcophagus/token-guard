/**
 * Test Script: API Data Sources Verification
 * Tests all APIs used for risk calculation on both EVM and Solana chains
 * 
 * Usage: node scripts/test-api-data-sources.js
 */

// Node.js 18+ has native fetch, no need for node-fetch
require('dotenv').config({ path: '.env.local' });

// Test tokens
const TEST_TOKENS = {
  ethereum: {
    address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', // SHIB
    name: 'Shiba Inu',
    symbol: 'SHIB'
  },
  solana: {
    address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // Jupiter
    name: 'Jupiter',
    symbol: 'JUP'
  }
};

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '⚠';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${icon} ${name}`, color);
  if (details) {
    console.log(`  ${details}`);
  }
}

// Test Mobula API (Market Data)
async function testMobula(address, chain) {
  try {
    const apiKey = process.env.MOBULA_API_KEY;
    if (!apiKey) {
      logTest('Mobula API', 'fail', 'API key not configured');
      return null;
    }

    const url = `https://api.mobula.io/api/1/market/data?asset=${address}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      logTest('Mobula API', 'fail', `HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.data) {
      logTest('Mobula API', 'fail', 'No data in response');
      return null;
    }

    const marketData = data.data;
    logTest('Mobula API', 'pass', 
      `Market Cap: $${(marketData.market_cap / 1e6).toFixed(2)}M, ` +
      `Liquidity: $${(marketData.liquidity / 1e3).toFixed(2)}K, ` +
      `Volume 24h: $${(marketData.volume / 1e6).toFixed(2)}M`
    );

    return {
      marketCap: marketData.market_cap,
      liquidity: marketData.liquidity,
      volume24h: marketData.volume,
      price: marketData.price
    };
  } catch (error) {
    logTest('Mobula API', 'fail', error.message);
    return null;
  }
}

// Test GoPlus API (EVM Security)
async function testGoPlus(address, chainId) {
  try {
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`;
    const response = await fetch(url);

    if (!response.ok) {
      logTest('GoPlus API', 'fail', `HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const tokenData = data.result?.[address.toLowerCase()];
    
    if (!tokenData) {
      logTest('GoPlus API', 'fail', 'No security data');
      return null;
    }

    logTest('GoPlus API', 'pass',
      `Holders: ${tokenData.holder_count || 'N/A'}, ` +
      `Owner: ${tokenData.owner_address ? 'Active' : 'Renounced'}, ` +
      `Honeypot: ${tokenData.is_honeypot === '1' ? 'YES' : 'NO'}`
    );

    return {
      holderCount: parseInt(tokenData.holder_count) || 0,
      ownershipRenounced: !tokenData.owner_address,
      isHoneypot: tokenData.is_honeypot === '1'
    };
  } catch (error) {
    logTest('GoPlus API', 'fail', error.message);
    return null;
  }
}

// Test Moralis API (EVM Transactions)
async function testMoralis(address) {
  try {
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
      logTest('Moralis API', 'fail', 'API key not configured');
      return null;
    }

    const url = `https://deep-index.moralis.io/api/v2/erc20/${address}/transfers?chain=eth&limit=10`;
    const response = await fetch(url, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      logTest('Moralis API', 'fail', `HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    logTest('Moralis API', 'pass',
      `Recent transfers: ${data.result?.length || 0}`
    );

    return {
      recentTransfers: data.result?.length || 0
    };
  } catch (error) {
    logTest('Moralis API', 'fail', error.message);
    return null;
  }
}

// Test Helius API (Solana)
async function testHelius(address) {
  try {
    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey) {
      logTest('Helius API', 'fail', 'API key not configured');
      return null;
    }

    // Test metadata
    const metadataUrl = `https://api.helius.xyz/v0/token-metadata?api-key=${apiKey}`;
    const metadataResponse = await fetch(metadataUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mintAccounts: [address] })
    });

    if (!metadataResponse.ok) {
      logTest('Helius Metadata', 'fail', `HTTP ${metadataResponse.status}`);
      return null;
    }

    const metadata = await metadataResponse.json();
    const tokenMeta = metadata[0];

    if (!tokenMeta) {
      logTest('Helius Metadata', 'fail', 'No metadata found');
      return null;
    }

    logTest('Helius Metadata', 'pass',
      `Name: ${tokenMeta.onChainMetadata?.metadata?.data?.name || 'N/A'}, ` +
      `Symbol: ${tokenMeta.onChainMetadata?.metadata?.data?.symbol || 'N/A'}`
    );

    // Test RPC for holders
    const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
    const rpcResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenLargestAccounts',
        params: [address]
      })
    });

    const rpcData = await rpcResponse.json();
    
    if (rpcData.error) {
      logTest('Helius RPC', 'warn', `RPC Error: ${rpcData.error.message}`);
    } else {
      const holders = rpcData.result?.value || [];
      logTest('Helius RPC', 'pass', `Top holders: ${holders.length}`);
    }

    return {
      metadata: tokenMeta,
      topHolders: rpcData.result?.value?.length || 0
    };
  } catch (error) {
    logTest('Helius API', 'fail', error.message);
    return null;
  }
}

// Test Groq AI
async function testGroq() {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      logTest('Groq AI', 'fail', 'API key not configured');
      return null;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'user', content: 'Classify this token: SHIB. Respond with just MEME_TOKEN or UTILITY_TOKEN.' }
        ],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      logTest('Groq AI', 'fail', `HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const classification = data.choices?.[0]?.message?.content;
    
    logTest('Groq AI', 'pass', `Classification: ${classification}`);
    return { classification };
  } catch (error) {
    logTest('Groq AI', 'fail', error.message);
    return null;
  }
}

// Main test runner
async function runTests() {
  log('\n🧪 TOKENOMICS LAB - API DATA SOURCES TEST\n', 'blue');
  
  // Test Ethereum Token
  logSection('ETHEREUM TOKEN TEST (SHIB)');
  const ethToken = TEST_TOKENS.ethereum;
  
  const ethMobula = await testMobula(ethToken.address, 'ethereum');
  const ethGoPlus = await testGoPlus(ethToken.address, '1');
  const ethMoralis = await testMoralis(ethToken.address);
  
  // Test Solana Token
  logSection('SOLANA TOKEN TEST (Jupiter)');
  const solToken = TEST_TOKENS.solana;
  
  const solMobula = await testMobula(solToken.address, 'solana');
  const solHelius = await testHelius(solToken.address);
  
  // Test AI
  logSection('AI CLASSIFICATION TEST');
  await testGroq();
  
  // Summary
  logSection('TEST SUMMARY');
  
  log('\nEthereum Data Sources:', 'cyan');
  log(`  ✓ Mobula: ${ethMobula ? 'Working' : 'Failed'}`, ethMobula ? 'green' : 'red');
  log(`  ✓ GoPlus: ${ethGoPlus ? 'Working' : 'Failed'}`, ethGoPlus ? 'green' : 'red');
  log(`  ✓ Moralis: ${ethMoralis ? 'Working' : 'Failed'}`, ethMoralis ? 'green' : 'red');
  
  log('\nSolana Data Sources:', 'cyan');
  log(`  ✓ Mobula: ${solMobula ? 'Working' : 'Failed'}`, solMobula ? 'green' : 'red');
  log(`  ✓ Helius: ${solHelius ? 'Working' : 'Failed'}`, solHelius ? 'green' : 'red');
  
  log('\nData Completeness Check:', 'cyan');
  
  if (ethMobula && ethGoPlus) {
    log('  ✓ Ethereum: All required data available', 'green');
    log(`    - Market Cap: $${(ethMobula.marketCap / 1e6).toFixed(2)}M`);
    log(`    - Liquidity: $${(ethMobula.liquidity / 1e3).toFixed(2)}K`);
    log(`    - Holders: ${ethGoPlus.holderCount}`);
  } else {
    log('  ✗ Ethereum: Missing critical data', 'red');
  }
  
  if (solMobula && solHelius) {
    log('  ✓ Solana: All required data available', 'green');
    log(`    - Market Cap: $${(solMobula.marketCap / 1e6).toFixed(2)}M`);
    log(`    - Liquidity: $${(solMobula.liquidity / 1e3).toFixed(2)}K`);
    log(`    - Top Holders: ${solHelius.topHolders}`);
  } else {
    log('  ✗ Solana: Missing critical data', 'red');
  }
  
  log('\n✅ Test complete!\n', 'green');
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test failed: ${error.message}\n`, 'red');
  process.exit(1);
});
