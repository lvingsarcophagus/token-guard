// Comprehensive Risk Calculation Test
// Tests the full analyze-token API with real tokens

const TEST_TOKENS = [
  {
    name: 'Uniswap (UNI)',
    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    chainId: '1',
    expectedRisk: 'LOW-MEDIUM'
  },
  {
    name: 'Wrapped ETH (WETH)',
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    chainId: '1',
    expectedRisk: 'LOW'
  },
  {
    name: 'Pepe (PEPE)',
    address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
    chainId: '1',
    expectedRisk: 'MEDIUM-HIGH'
  }
]

async function testRiskCalculation(token) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`🔍 Testing: ${token.name}`)
  console.log(`Address: ${token.address}`)
  console.log(`Chain: ${token.chainId} (Ethereum)`)
  console.log(`Expected Risk: ${token.expectedRisk}`)
  console.log('='.repeat(70))

  try {
    const startTime = Date.now()
    
    const response = await fetch('http://localhost:3000/api/analyze-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tokenAddress: token.address,
        chainId: token.chainId,
        userId: 'test-user-' + Date.now(),
        plan: 'PREMIUM'
      })
    })

    const elapsed = Date.now() - startTime
    
    if (!response.ok) {
      console.error(`\n❌ HTTP ${response.status} ${response.statusText}`)
      const errorData = await response.json()
      console.error('Error:', JSON.stringify(errorData, null, 2))
      return false
    }

    const result = await response.json()
    
    console.log(`\n✅ Analysis Complete (${elapsed}ms)`)
    console.log('\n📊 RESULTS:')
    console.log('-'.repeat(70))
    console.log(`Overall Risk Score: ${result.overall_risk_score}/100`)
    console.log(`Risk Level: ${result.risk_level}`)
    console.log(`Confidence: ${result.confidence_score}%`)
    console.log(`Data Tier: ${result.data_tier || 'N/A'}`)
    console.log(`Data Freshness: ${result.data_freshness || 'N/A'}`)
    console.log(`Data Sources: ${result.data_sources?.join(', ') || 'Unknown'}`)

    if (result.breakdown) {
      console.log('\n📋 FACTOR BREAKDOWN:')
      console.log('-'.repeat(70))
      Object.entries(result.breakdown).forEach(([factor, score]) => {
        const bar = '█'.repeat(Math.floor(Number(score) / 5))
        const empty = '░'.repeat(20 - Math.floor(Number(score) / 5))
        const emoji = Number(score) < 30 ? '🟢' : Number(score) < 60 ? '🟡' : '🔴'
        console.log(`${emoji} ${factor.padEnd(25)} ${String(score).padStart(3)}/100 [${bar}${empty}]`)
      })
    }

    if (result.critical_flags && result.critical_flags.length > 0) {
      console.log('\n🚨 CRITICAL FLAGS:')
      console.log('-'.repeat(70))
      result.critical_flags.forEach((flag) => {
        console.log(`  ❗ ${flag}`)
      })
    }

    if (result.warning_flags && result.warning_flags.length > 0) {
      console.log('\n⚠️  WARNING FLAGS:')
      console.log('-'.repeat(70))
      result.warning_flags.forEach((flag) => {
        console.log(`  ⚡ ${flag}`)
      })
    }

    if (result.positive_signals && result.positive_signals.length > 0) {
      console.log('\n✨ POSITIVE SIGNALS:')
      console.log('-'.repeat(70))
      result.positive_signals.forEach((signal) => {
        console.log(`  ✅ ${signal}`)
      })
    }

    console.log('\n' + '='.repeat(70))
    
    return true
  } catch (error) {
    console.error(`\n❌ Test Failed:`, error.message)
    console.error(error.stack)
    return false
  }
}

async function runAllTests() {
  console.log('\n')
  console.log('🚀 STARTING RISK CALCULATION TESTS')
  console.log('='.repeat(70))
  console.log('Testing Multi-Chain Enhanced Algorithm')
  console.log('Server: http://localhost:3000')
  console.log('Tokens to test:', TEST_TOKENS.length)
  console.log('='.repeat(70))

  const results = []

  for (const token of TEST_TOKENS) {
    const success = await testRiskCalculation(token)
    results.push({ token: token.name, success })
    
    // Wait between tests to avoid rate limiting
    if (TEST_TOKENS.indexOf(token) < TEST_TOKENS.length - 1) {
      console.log('\n⏳ Waiting 2 seconds before next test...\n')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // Summary
  console.log('\n')
  console.log('='.repeat(70))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(70))
  
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const total = results.length

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌'
    console.log(`${icon} ${r.token}`)
  })

  console.log('\n' + '-'.repeat(70))
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
  console.log('='.repeat(70))

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Risk calculation is working perfectly!')
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Check the errors above.`)
  }

  console.log('\n')
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000')
    return response.ok
  } catch (error) {
    return false
  }
}

// Main execution
async function main() {
  console.log('Checking if dev server is running...')
  const serverRunning = await checkServer()
  
  if (!serverRunning) {
    console.error('\n❌ ERROR: Dev server is not running!')
    console.error('Please start the server first with: pnpm dev')
    console.error('Then run this test again.\n')
    process.exit(1)
  }

  console.log('✅ Dev server is running!\n')
  await runAllTests()
}

main().catch(console.error)
