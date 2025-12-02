/**
 * Test script to verify holder counts for both ETH and SOL tokens
 */

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const GOPLUS_API_KEY = process.env.GOPLUS_API_KEY;

// Test tokens
const TOKENS = {
  // Ethereum tokens
  USDT_ETH: { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', chain: 'ethereum', chainId: 1, name: 'USDT' },
  SHIB_ETH: { address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', chain: 'ethereum', chainId: 1, name: 'SHIB' },
  
  // Solana tokens
  POPCAT: { address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', chain: 'solana', chainId: 501, name: 'POPCAT' },
  WIF: { address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', chain: 'solana', chainId: 501, name: 'dogwifhat' }
};

async function testEthereumToken(token) {
  console.log(`\n🔗 Testing ${token.name} (Ethereum)...`);
  
  try {
    const response = await fetch(
      `https://api.gopluslabs.io/api/v1/token_security/${token.chainId}?contract_addresses=${token.address}`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    const data = await response.json();
    const tokenData = data.result?.[token.address.toLowerCase()];
    
    if (!tokenData) {
      console.log(`❌ No data returned`);
      return;
    }
    
    const holderCount = parseInt(tokenData.holder_count || '0');
    console.log(`✅ Holder count: ${holderCount.toLocaleString()}`);
    
    if (tokenData.holders && Array.isArray(tokenData.holders)) {
      const top10 = tokenData.holders.slice(0, 10);
      const top10Pct = top10.reduce((sum, h) => sum + parseFloat(h.percent || '0'), 0);
      console.log(`   Top 10 holders: ${top10Pct.toFixed(2)}%`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function testSolanaToken(token) {
  console.log(`\n☀️ Testing ${token.name} (Solana)...`);
  
  if (!HELIUS_API_KEY) {
    console.log(`❌ HELIUS_API_KEY not configured`);
    return;
  }
  
  try {
    const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
    let allHolders = [];
    let page = 1;
    const maxPages = 20;
    
    console.log(`   Fetching holders (max ${maxPages} pages)...`);
    
    while (page <= maxPages) {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'test',
          method: 'getTokenAccounts',
          params: {
            page,
            limit: 1000,
            displayOptions: {},
            mint: token.address
          }
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.log(`❌ RPC Error: ${data.error.message}`);
        break;
      }
      
      if (!data.result?.token_accounts || data.result.token_accounts.length === 0) {
        break;
      }
      
      allHolders.push(...data.result.token_accounts);
      console.log(`   Page ${page}: Found ${data.result.token_accounts.length} accounts (total: ${allHolders.length})`);
      
      if (data.result.token_accounts.length < 1000) {
        break;
      }
      
      page++;
    }
    
    console.log(`✅ Total holder count: ${allHolders.length.toLocaleString()}`);
    
    if (allHolders.length > 0) {
      const top10 = allHolders.slice(0, 10);
      const totalSupply = allHolders.reduce((sum, h) => sum + parseFloat(h.amount || '0'), 0);
      const top10Balance = top10.reduce((sum, h) => sum + parseFloat(h.amount || '0'), 0);
      const top10Pct = totalSupply > 0 ? (top10Balance / totalSupply) * 100 : 0;
      console.log(`   Top 10 holders: ${top10Pct.toFixed(2)}%`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('🧪 Testing Holder Count Fetching\n');
  console.log('='.repeat(50));
  
  // Test Ethereum tokens
  await testEthereumToken(TOKENS.USDT_ETH);
  await testEthereumToken(TOKENS.SHIB_ETH);
  
  // Test Solana tokens
  await testSolanaToken(TOKENS.POPCAT);
  await testSolanaToken(TOKENS.WIF);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Testing complete!');
}

main().catch(console.error);
