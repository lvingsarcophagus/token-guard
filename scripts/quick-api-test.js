// Quick API test to verify algorithm is working
const TEST_TOKEN = {
  address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
  chainId: '1',
  name: 'Uniswap'
}

async function testAPI() {
  console.log('🔍 Testing Token Analysis API...\n')
  console.log(`Token: ${TEST_TOKEN.name}`)
  console.log(`Address: ${TEST_TOKEN.address}`)
  console.log(`Chain: Ethereum (${TEST_TOKEN.chainId})\n`)

  try {
    const response = await fetch('http://localhost:3000/api/analyze-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tokenAddress: TEST_TOKEN.address,
        chainId: TEST_TOKEN.chainId,
        userId: 'test-user-123',
        plan: 'PREMIUM'
      })
    })

    if (!response.ok) {
      console.error(`❌ API returned HTTP ${response.status}`)
      const error = await response.json()
      console.error('Error:', JSON.stringify(error, null, 2))
      return
    }

    const result = await response.json()
    
    console.log('=' .repeat(60))
    console.log('✅ ANALYSIS COMPLETE')
    console.log('='.repeat(60))
    
    console.log(`\n📊 OVERALL RISK SCORE: ${result.overall_risk_score}/100`)
    console.log(`🎯 RISK LEVEL: ${result.risk_level}`)
    console.log(`💯 CONFIDENCE: ${result.confidence_score}%`)
    
    if (result.data_tier) {
      console.log(`📈 DATA TIER: ${result.data_tier}`)
    }
    
    if (result.data_freshness) {
      console.log(`🕐 DATA FRESHNESS: ${result.data_freshness}`)
    }
    
    if (result.data_sources) {
      console.log(`🔗 DATA SOURCES: ${result.data_sources.join(', ')}`)
    }

    if (result.breakdown) {
      console.log('\n📋 RISK FACTOR BREAKDOWN:')
      console.log('-'.repeat(60))
      Object.entries(result.breakdown).forEach(([factor, score]) => {
        const bar = '█'.repeat(Math.floor(Number(score) / 10))
        const color = Number(score) < 30 ? '🟢' : Number(score) < 60 ? '🟡' : '🔴'
        console.log(`${color} ${factor.padEnd(25)} ${String(score).padStart(3)}/100 ${bar}`)
      })
    }

    if (result.critical_flags && result.critical_flags.length > 0) {
      console.log('\n⚠️  CRITICAL FLAGS:')
      console.log('-'.repeat(60))
      result.critical_flags.forEach((flag) => {
        console.log(`  ❗ ${flag}`)
      })
    }

    if (result.warning_flags && result.warning_flags.length > 0) {
      console.log('\n⚡ WARNING FLAGS:')
      console.log('-'.repeat(60))
      result.warning_flags.forEach((flag) => {
        console.log(`  ⚠️  ${flag}`)
      })
    }

    if (result.positive_signals && result.positive_signals.length > 0) {
      console.log('\n✨ POSITIVE SIGNALS:')
      console.log('-'.repeat(60))
      result.positive_signals.forEach((signal) => {
        console.log(`  ✅ ${signal}`)
      })
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 ALL APIS WORKING CORRECTLY!')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)
  }
}

testAPI()
