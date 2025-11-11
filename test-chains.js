const tokens = [
  // SOLANA (chainId: 501)
  { symbol: 'BONK', address: 'DezXAZ8z7PnrnRJjoBXwACqPE4ah5TbuyhwUV1hCtaFt', chainId: '501', chainName: 'Solana' },
  { symbol: 'WIF', address: 'EKpQGSKe94Fo0Pa1SSqf3xjjXzkyDkaZNVmWNBqa99dD', chainId: '501', chainName: 'Solana' },
  // ETHEREUM (chainId: 1)
  { symbol: 'PEPE', address: '0x6982508145454Ce894eeadb9B8013f9FdbE7D1C0', chainId: '1', chainName: 'Ethereum' },
  { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chainId: '1', chainName: 'Ethereum' },
  // CARDANO (chainId: 1815)
  { symbol: 'ADA', address: 'ada', chainId: '1815', chainName: 'Cardano' }
];

async function testToken(token) {
  try {
    const response = await fetch('http://localhost:3000/api/analyze-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenAddress: token.address,
        chainId: token.chainId,
        plan: 'free'
      })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    const data = await response.json();
    
    if (data.error) throw new Error(data.error);
    console.log(`
================================================================================
Token: ${token.symbol} (${token.chainName})
================================================================================
Risk Score: ${data.overall_risk_score}/100
Risk Level: ${data.risk_level}
Confidence: ${data.confidence_score}%

BREAKDOWN (9 Factors):
  Supply Dilution:        ${data.breakdown.supplyDilution}
  Holder Concentration:   ${data.breakdown.holderConcentration}
  Liquidity Depth:        ${data.breakdown.liquidityDepth}
  Contract Control:       ${data.breakdown.contractControl}
  Tax/Fee:                ${data.breakdown.taxFee}
  Distribution:           ${data.breakdown.distribution}
  Burn/Deflation:         ${data.breakdown.burnDeflation}
  Adoption:               ${data.breakdown.adoption}
  Audit/Transparency:     ${data.breakdown.auditTransparency}

RAW DATA (Only Real Fetched Data):
  Market Cap: ${data.raw_data.marketCap || 'N/A'}
  FDV: ${data.raw_data.fdv || 'N/A'}
  Liquidity: ${data.raw_data.liquidityUSD || 'N/A'}
  Holders: ${data.raw_data.holderCount || 'N/A'}
  Top 10%: ${data.raw_data.top10HoldersPct || 'N/A'}
  Tx 24h: ${data.raw_data.txCount24h ? 'REAL DATA: ' + data.raw_data.txCount24h : 'NOT INCLUDED (estimated)'}
  Age Days: ${data.raw_data.ageDays ? 'REAL DATA: ' + data.raw_data.ageDays : 'NOT INCLUDED (estimated)'}
  Owner Renounced: ${data.raw_data.owner_renounced}
  Mintable: ${data.raw_data.is_mintable}
  LP Locked: ${data.raw_data.lp_locked}

Data Sources: ${data.data_sources ? data.data_sources.join(', ') : 'Unknown'}
`);
  } catch (error) {
    console.log(`
================================================================================
ERROR: ${token.symbol} (${token.chainName})
================================================================================
${error.message}
`);
  }
}

async function runTests() {
  console.log('\n========== TESTING TOKEN GUARD ACROSS CHAINS ==========\n');
  console.log('Testing: SOLANA (BONK, WIF) | ETHEREUM (PEPE, USDC) | CARDANO (ADA)\n');
  
  for (const token of tokens) {
    await testToken(token);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay between requests
  }
  
  console.log('\n========== TESTS COMPLETE ==========\n');
}

runTests().catch(err => console.error('Fatal error:', err.message));
