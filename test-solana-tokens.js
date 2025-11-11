const fetch = require('node-fetch');

const tokens = [
  { name: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', expected: 'MEDIUM' },
  { name: 'dogwifhat', address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', expected: 'HIGH' },
  { name: 'SOL', address: 'So11111111111111111111111111111111111111112', expected: 'LOW' }
];

async function testToken(token) {
  try {
    const response = await fetch('http://localhost:3000/api/analyze-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenAddress: token.address,
        chainId: 1399811149,
        plan: 'PREMIUM'
      })
    });
    const data = await response.json();
    const match = data.risk_level === token.expected ? '✅' : '❌';
    console.log(`${match} ${token.name}: ${data.overall_risk_score} (${data.risk_level}) - Expected: ${token.expected}`);
    console.log(`   Holders: ${data.raw_data.holderCount}, MC: $${Math.round(data.raw_data.marketCap / 1e6)}M`);
    console.log(`   Data Sources: ${data.data_sources.join(', ')}`);
  } catch (err) {
    console.error(`❌ ${token.name}: ${err.message}`);
  }
}

async function runTests() {
  console.log('🧪 Testing Solana Tokens with Updated Chain Detection...\n');
  for (const token of tokens) {
    await testToken(token);
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

runTests();
