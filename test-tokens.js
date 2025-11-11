const tokens = [
  {
    name: "MAGA (TRUMP)",
    address: "0x576e2bed8f7b46d34016198911cdf9886f78bea7",
    chain: "ETHEREUM",
    expectedScore: [58, 65],
    expectedLevel: "HIGH",
    testPoints: [
      "Mintable detected",
      "Holder concentration flagged",
      "Meme classification applied",
      "LP lock bonus given"
    ]
  },
  {
    name: "PEPE",
    address: "0x6982508145454ce325ddbe47a25d4ec3d2311933",
    chain: "ETHEREUM",
    expectedScore: [22, 28],
    expectedLevel: "LOW",
    testPoints: [
      "No mintable penalty",
      "LP burn bonus applied",
      "Low volatility reflected",
      "Good distribution shown"
    ]
  },
  {
    name: "BONK",
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    chain: "SOLANA",
    expectedScore: [35, 42],
    expectedLevel: "MEDIUM",
    testPoints: [
      "Solana-specific checks passed",
      "No freeze authority penalty",
      "Concentration detected",
      "Meme classification correct"
    ]
  },
  {
    name: "WIF (dogwifhat)",
    address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    chain: "SOLANA",
    expectedScore: [68, 75],
    expectedLevel: "CRITICAL",
    testPoints: [
      "Extreme concentration flagged",
      "LP vulnerability detected",
      "Critical warnings issued",
      "Whale risk identified"
    ]
  },
  {
    name: "USDC",
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    chain: "ETHEREUM",
    expectedScore: [5, 12],
    expectedLevel: "LOW",
    testPoints: [
      "Stablecoin treatment applied",
      "Zero volatility reflected",
      "Audited bonus given",
      "No critical flags"
    ]
  }
];

async function testToken(token) {
  console.log(`\n🧪 Testing: ${token.name}`);
  console.log(`   Chain: ${token.chain}`);
  console.log(`   Address: ${token.address}`);
  
  // Map chain name to chainId
  const chainIdMap = {
    'ETHEREUM': '1',
    'SOLANA': '501'
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenAddress: token.address,
        chainId: chainIdMap[token.chain] || '1',
        plan: 'FREE',
        userId: 'test-user-' + Date.now()
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const score = data.overall_risk_score;
    const level = data.risk_level;
    
    // Check results
    const scoreInRange = score >= token.expectedScore[0] && score <= token.expectedScore[1];
    const levelCorrect = level === token.expectedLevel;
    
    console.log(`\n   Results:`);
    console.log(`     Score: ${score}/100 (expected: ${token.expectedScore[0]}-${token.expectedScore[1]}) ${scoreInRange ? '✅' : '❌'}`);
    console.log(`     Level: ${level} (expected: ${token.expectedLevel}) ${levelCorrect ? '✅' : '❌'}`);
    
    if (data.breakdown) {
      console.log(`\n   Factor Breakdown:`);
      console.log(`     Supply Dilution: ${data.breakdown.supplyDilution || 0}`);
      console.log(`     Holder Concentration: ${data.breakdown.holderConcentration || 0}`);
      console.log(`     Liquidity Depth: ${data.breakdown.liquidityDepth || 0}`);
      console.log(`     Contract Control: ${data.breakdown.contractControl || 0}`);
      console.log(`     Adoption: ${data.breakdown.adoption || 0}`);
      console.log(`     Vesting Unlock: ${data.breakdown.vestingUnlock || 0}`);
      console.log(`     Burn Deflation: ${data.breakdown.burnDeflation || 0}`);
      console.log(`     Distribution: ${data.breakdown.distribution || 0}`);
    }
    
    if (data.raw_data) {
      console.log(`\n   Raw Data Received:`);
      console.log(`     Market Cap: $${(data.raw_data.marketCap / 1e6).toFixed(2)}M`);
      console.log(`     FDV: $${(data.raw_data.fdv / 1e6).toFixed(2)}M`);
      console.log(`     Liquidity: $${(data.raw_data.liquidityUSD / 1e3).toFixed(2)}K`);
      console.log(`     Holders: ${data.raw_data.holderCount?.toLocaleString() || 'unknown'}`);
      console.log(`     Top 10 %: ${(data.raw_data.top10HoldersPct * 100)?.toFixed(1) || 'unknown'}%`);
      console.log(`     Tx 24h: ${data.raw_data.txCount24h || 'unknown'}`);
      console.log(`     Age (days): ${data.raw_data.ageDays || 'unknown'}`);
      console.log(`     Mintable: ${data.raw_data.is_mintable ? 'YES ⚠️' : 'NO'}`);
    }
    
    if (data.critical_flags && data.critical_flags.length > 0) {
      console.log(`\n   ⚠️  Critical Flags:`);
      data.critical_flags.forEach(flag => {
        console.log(`      • ${flag}`);
      });
    }
    
    console.log(`\n   Test Points:`);
    token.testPoints.forEach(point => {
      console.log(`     • ${point}`);
    });
    
    return { passed: scoreInRange && levelCorrect, score, level };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { passed: false, score: null, level: null };
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting battle test suite...\n');
  console.log('Testing 5 tokens across 2 chains');
  console.log('═'.repeat(60));
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  for (const token of tokens) {
    const result = await testToken(token);
    results.push({ name: token.name, ...result });
    if (result.passed) passed++;
    else failed++;
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log(`📊 TEST RESULTS:`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`✅ Passed: ${passed}/5`);
  console.log(`❌ Failed: ${failed}/5`);
  console.log(`Success Rate: ${(passed / 5 * 100).toFixed(1)}%`);
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`SUMMARY TABLE:`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`Token         │ Expected      │ Actual        │ Status`);
  console.log(`${'-'.repeat(60)}`);
  
  results.forEach(r => {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${r.name.padEnd(13)} │ ${(r.name.includes('MAGA') ? 'HIGH' : r.name.includes('PEPE') ? 'LOW' : r.name.includes('BONK') ? 'MEDIUM' : r.name.includes('WIF') ? 'CRITICAL' : 'LOW').padEnd(13)} │ ${(r.level || 'ERROR').padEnd(13)} │ ${status}`);
  });
  
  console.log(`${'═'.repeat(60)}`);
  
  if (passed === 5) {
    console.log(`\n🎉 ALL TESTS PASSED! Algorithm is working correctly.`);
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Review results above.`);
  }
  
  process.exit(passed === 5 ? 0 : 1);
}

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
