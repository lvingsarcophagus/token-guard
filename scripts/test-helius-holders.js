/**
 * Test script for Helius getTokenAccounts implementation
 * Tests accurate holder count retrieval with pagination
 */

require('dotenv').config({ path: '.env.local' });

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Test tokens
const TEST_TOKENS = {
  POPCAT: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'
};

async function getTokenHolders(tokenAddress, tokenName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${tokenName} (${tokenAddress})`);
  console.log('='.repeat(60));

  try {
    // Collect all token accounts with pagination
    let page = 1;
    let allTokenAccounts = [];
    const maxPages = 10; // Limit to prevent excessive API calls

    while (page <= maxPages) {
      console.log(`\nFetching page ${page}...`);
      
      const response = await fetch(HELIUS_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'helius-test',
          method: 'getTokenAccounts',
          params: {
            page: page,
            limit: 1000,
            displayOptions: {},
            mint: tokenAddress
          }
        })
      });

      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status}`);
        break;
      }

      const data = await response.json();
      
      if (data.error) {
        console.error(`❌ RPC Error: ${data.error.message}`);
        break;
      }

      if (!data.result || !data.result.token_accounts || data.result.token_accounts.length === 0) {
        console.log(`✓ No more results at page ${page}`);
        break;
      }

      const accountsOnPage = data.result.token_accounts.length;
      console.log(`✓ Found ${accountsOnPage} token accounts on page ${page}`);
      allTokenAccounts.push(...data.result.token_accounts);

      // If we got less than 1000, we've reached the end
      if (accountsOnPage < 1000) {
        console.log(`✓ Reached end of results (${accountsOnPage} < 1000)`);
        break;
      }

      page++;
    }

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Total token accounts fetched: ${allTokenAccounts.length}`);

    // Group by owner to get unique holders
    const holderMap = new Map();
    
    allTokenAccounts.forEach((account) => {
      const owner = account.owner;
      const amount = parseFloat(account.amount) || 0;
      
      if (holderMap.has(owner)) {
        holderMap.set(owner, holderMap.get(owner) + amount);
      } else {
        holderMap.set(owner, amount);
      }
    });

    const holders = Array.from(holderMap.entries())
      .map(([address, balance]) => ({ address, balance }))
      .sort((a, b) => b.balance - a.balance);

    console.log(`\n✅ UNIQUE HOLDERS: ${holders.length}`);
    console.log(`${'─'.repeat(60)}`);

    // Show top 10 holders
    console.log('\nTop 10 Holders:');
    holders.slice(0, 10).forEach((holder, index) => {
      const shortAddr = `${holder.address.slice(0, 6)}...${holder.address.slice(-4)}`;
      console.log(`  ${index + 1}. ${shortAddr}: ${holder.balance.toLocaleString()}`);
    });

    return {
      totalAccounts: allTokenAccounts.length,
      uniqueHolders: holders.length,
      topHolders: holders.slice(0, 10)
    };

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('\n🧪 Helius getTokenAccounts Test Suite');
  console.log('Testing accurate holder count with pagination\n');

  if (!HELIUS_API_KEY) {
    console.error('❌ HELIUS_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log('✓ Helius API key configured');

  const results = {};

  // Test POPCAT (known to have many holders)
  results.POPCAT = await getTokenHolders(TEST_TOKENS.POPCAT, 'POPCAT');
  
  // Add delay between requests
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test BONK (very popular token)
  results.BONK = await getTokenHolders(TEST_TOKENS.BONK, 'BONK');

  // Summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  Object.entries(results).forEach(([token, data]) => {
    if (data) {
      console.log(`\n${token}:`);
      console.log(`  Token Accounts: ${data.totalAccounts.toLocaleString()}`);
      console.log(`  Unique Holders: ${data.uniqueHolders.toLocaleString()}`);
      console.log(`  Ratio: ${(data.totalAccounts / data.uniqueHolders).toFixed(2)} accounts per holder`);
    } else {
      console.log(`\n${token}: ❌ Failed`);
    }
  });

  console.log('\n✅ Tests complete!\n');
}

runTests().catch(console.error);
