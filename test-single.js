// Single token test to check Mobula data
async function testSingleToken() {
  const token = {
    name: "PEPE",
    address: "0x6982508145454ce325ddbe47a25d4ec3d2311933",
    chain: "ETHEREUM"
  };
  
  console.log(`🧪 Testing: ${token.name}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenAddress: token.address,
        chainId: '1',
        plan: 'FREE',
        userId: 'test-user-' + Date.now()
      })
    });
    
    const data = await response.json();
    
    console.log(`\n✅ Response received!`);
    console.log(`\nRaw Data:`);
    console.log(JSON.stringify(data.raw_data, null, 2));
    
    console.log(`\nBreakdown:`);
    console.log(JSON.stringify(data.breakdown, null, 2));
    
    console.log(`\nFull Response:`)
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

testSingleToken();
