/**
 * Chain-Adaptive Security Adapters
 * Different blockchains require different security checks
 */

export interface SecurityCheck {
  name: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  score: number;
  chain_specific: boolean;
}

export interface SecurityResult {
  checks: SecurityCheck[];
  score: number;
  critical_count: number;
  warning_count: number;
}

// ============================================================================
// EVM SECURITY ADAPTER (Ethereum, BSC, Polygon, Arbitrum, etc.)
// ============================================================================

export async function checkEVMSecurity(
  tokenAddress: string,
  chainId: number
): Promise<SecurityResult> {
  
  const checks: SecurityCheck[] = [];
  
  try {
    console.log(`[EVM Security] Checking ${tokenAddress} on chain ${chainId}`);
    
    const response = await fetch(
      `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${tokenAddress}`,
      {
        headers: { 'Accept': 'application/json' }
      }
    );
    
    const data = await response.json();
    const token = data.result?.[tokenAddress.toLowerCase()];
    
    if (!token) {
      console.log('[EVM Security] No data from GoPlus');
      return compileSecurityResult(checks);
    }
    
    // CHECK 1: Honeypot (CRITICAL)
    if (token.is_honeypot === '1') {
      checks.push({
        name: 'Honeypot Detected',
        severity: 'CRITICAL',
        message: '🚨 HONEYPOT - You cannot sell this token',
        score: 95,
        chain_specific: true
      });
    }
    
    // CHECK 2: High Sell Tax (CRITICAL if >50%)
    const sellTax = parseFloat(token.sell_tax || '0');
    if (sellTax > 0.50) {
      checks.push({
        name: 'Extreme Sell Tax',
        severity: 'CRITICAL',
        message: `🚨 ${(sellTax * 100).toFixed(0)}% sell tax - Exit blocked`,
        score: 80,
        chain_specific: true
      });
    } else if (sellTax > 0.20) {
      checks.push({
        name: 'High Sell Tax',
        severity: 'WARNING',
        message: `⚠️ ${(sellTax * 100).toFixed(0)}% sell tax`,
        score: 40,
        chain_specific: true
      });
    }
    
    // CHECK 3: Owner Can Mint Tokens (WARNING)
    if (token.is_mintable === '1' && token.owner_address && 
        token.owner_address !== '0x0000000000000000000000000000000000000000') {
      checks.push({
        name: 'Mintable',
        severity: 'WARNING',
        message: '⚠️ Owner can create unlimited tokens',
        score: 50,
        chain_specific: false
      });
    }
    
    // CHECK 4: Proxy Contract (WARNING)
    if (token.is_proxy === '1') {
      checks.push({
        name: 'Proxy Contract',
        severity: 'WARNING',
        message: '⚠️ Contract logic can be changed by owner',
        score: 35,
        chain_specific: true
      });
    }
    
    // CHECK 5: Owner Not Renounced (INFO)
    if (token.owner_address && 
        token.owner_address !== '0x0000000000000000000000000000000000000000') {
      checks.push({
        name: 'Owner Exists',
        severity: 'INFO',
        message: 'ℹ️ Owner has not renounced control',
        score: 20,
        chain_specific: false
      });
    }
    
    // CHECK 6: Cannot Buy (CRITICAL)
    if (token.cannot_buy === '1') {
      checks.push({
        name: 'Cannot Buy',
        severity: 'CRITICAL',
        message: '🚨 Trading is disabled - Cannot buy',
        score: 95,
        chain_specific: true
      });
    }
    
    // CHECK 7: High Buy Tax (WARNING if >10%)
    const buyTax = parseFloat(token.buy_tax || '0');
    if (buyTax > 0.10) {
      checks.push({
        name: 'High Buy Tax',
        severity: 'WARNING',
        message: `⚠️ ${(buyTax * 100).toFixed(0)}% buy tax`,
        score: 30,
        chain_specific: true
      });
    }
    
    // CHECK 8: Trading Cooldown (WARNING)
    if (token.trading_cooldown === '1') {
      checks.push({
        name: 'Trading Cooldown',
        severity: 'WARNING',
        message: '⚠️ Forced delay between trades',
        score: 25,
        chain_specific: true
      });
    }
    
    console.log(`[EVM Security] ✅ Found ${checks.length} security issues`);
    
  } catch (error) {
    console.error('❌ EVM security check failed:', error);
  }
  
  return compileSecurityResult(checks);
}

// ============================================================================
// SOLANA SECURITY ADAPTER
// ============================================================================

export async function checkSolanaSecurity(
  tokenAddress: string
): Promise<SecurityResult> {
  
  const checks: SecurityCheck[] = [];
  
  try {
    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey) {
      console.log('[Solana Security] No Helius API key configured');
      return compileSecurityResult(checks);
    }
    
    console.log(`[Solana Security] Checking ${tokenAddress}`);
    
    const response = await fetch(
      `https://api.helius.xyz/v0/token-metadata?api-key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mintAccounts: [tokenAddress] })
      }
    );
    
    const data = await response.json();
    const token = data[0];
    
    if (!token) {
      console.log('[Solana Security] No data from Helius');
      return compileSecurityResult(checks);
    }
    
    const info = token.onChainAccountInfo?.accountInfo?.data?.parsed?.info;
    
    console.log(`[Solana Security] Freeze Authority: "${info?.freezeAuthority}", Mint Authority: "${info?.mintAuthority}"`)
    
    // CHECK 1: Freeze Authority (MOST CRITICAL ON SOLANA)
    // Empty string means revoked, non-empty string means exists
    if (info?.freezeAuthority && info.freezeAuthority !== null && info.freezeAuthority !== '') {
      checks.push({
        name: 'Freeze Authority',
        severity: 'CRITICAL',
        message: '🚨 FREEZE AUTHORITY - Creator can lock your wallet',
        score: 90,
        chain_specific: true
      });
    }
    
    // CHECK 2: Mint Authority (Context-dependent)
    // Empty string means revoked, non-empty string means exists
    if (info?.mintAuthority && info.mintAuthority !== null && info.mintAuthority !== '') {
      const tokenAge = token.deployedDaysAgo || 0;
      
      if (tokenAge < 90) {
        checks.push({
          name: 'Mint Authority (New Token)',
          severity: 'CRITICAL',
          message: '🚨 Unlimited minting possible on new token',
          score: 60,
          chain_specific: true
        });
      } else {
        checks.push({
          name: 'Mint Authority (Old Token)',
          severity: 'WARNING',
          message: '⚠️ Mint authority exists but token is established',
          score: 25,
          chain_specific: true
        });
      }
    }
    
    // CHECK 3: Update Authority (WARNING)
    if (token.updateAuthority && token.updateAuthority !== null) {
      checks.push({
        name: 'Update Authority',
        severity: 'WARNING',
        message: '⚠️ Token metadata can be changed',
        score: 20,
        chain_specific: true
      });
    }
    
    console.log(`[Solana Security] ✅ Found ${checks.length} security issues`);
    
  } catch (error) {
    console.error('❌ Solana security check failed:', error);
  }
  
  return compileSecurityResult(checks);
}

// ============================================================================
// CARDANO SECURITY ADAPTER
// ============================================================================

export async function checkCardanoSecurity(
  assetId: string
): Promise<SecurityResult> {
  
  const checks: SecurityCheck[] = [];
  
  try {
    const apiKey = process.env.BLOCKFROST_PROJECT_ID;
    if (!apiKey) {
      console.log('[Cardano Security] No Blockfrost API key configured');
      return compileSecurityResult(checks);
    }
    
    console.log(`[Cardano Security] Checking ${assetId}`);
    
    const response = await fetch(
      `https://cardano-mainnet.blockfrost.io/api/v0/assets/${assetId}`,
      {
        headers: { 'project_id': apiKey }
      }
    );
    
    const asset = await response.json();
    
    if (!asset || asset.error) {
      console.log('[Cardano Security] No data from Blockfrost');
      return compileSecurityResult(checks);
    }
    
    // Get policy info
    const policyResponse = await fetch(
      `https://cardano-mainnet.blockfrost.io/api/v0/scripts/${asset.policy_id}`,
      {
        headers: { 'project_id': apiKey }
      }
    );
    
    const policyScript = await policyResponse.json();
    
    // CHECK 1: Policy Not Locked (CRITICAL if active)
    if (asset.mint_or_burn_count > 1) {
      checks.push({
        name: 'Active Minting Policy',
        severity: 'CRITICAL',
        message: '🚨 Policy allows unlimited minting',
        score: 75,
        chain_specific: true
      });
    } else if (asset.mint_or_burn_count === 1) {
      checks.push({
        name: 'One-Time Mint Policy',
        severity: 'INFO',
        message: '✅ Policy used once (time-locked)',
        score: 10,
        chain_specific: true
      });
    } else if (asset.mint_or_burn_count === 0) {
      checks.push({
        name: 'Expired Policy',
        severity: 'INFO',
        message: '✅ Policy expired (supply fixed)',
        score: 0,
        chain_specific: true
      });
    }
    
    // CHECK 2: Script Type
    if (policyScript.type === 'plutusV2') {
      checks.push({
        name: 'Plutus V2 Script',
        severity: 'INFO',
        message: 'ℹ️ Advanced smart contract policy',
        score: 15,
        chain_specific: true
      });
    }
    
    console.log(`[Cardano Security] ✅ Found ${checks.length} security issues`);
    
  } catch (error) {
    console.error('❌ Cardano security check failed:', error);
  }
  
  return compileSecurityResult(checks);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function compileSecurityResult(checks: SecurityCheck[]): SecurityResult {
  const critical_count = checks.filter(c => c.severity === 'CRITICAL').length;
  const warning_count = checks.filter(c => c.severity === 'WARNING').length;
  
  // Calculate total score (sum of all check scores)
  const score = checks.reduce((sum, check) => sum + check.score, 0);
  
  return {
    checks,
    score: Math.min(score, 100),
    critical_count,
    warning_count
  };
}

/**
 * Auto-detect chain type and run appropriate adapter
 */
export async function checkSecurityAuto(
  tokenAddress: string,
  chainId?: number
): Promise<SecurityResult> {
  
  // Solana address pattern
  if (tokenAddress.length >= 32 && tokenAddress.length <= 44 && 
      !tokenAddress.startsWith('0x')) {
    return await checkSolanaSecurity(tokenAddress);
  }
  
  // Cardano asset pattern (policyId.assetName)
  if (tokenAddress.includes('.')) {
    return await checkCardanoSecurity(tokenAddress);
  }
  
  // EVM address pattern
  if (tokenAddress.startsWith('0x') && tokenAddress.length === 42) {
    return await checkEVMSecurity(tokenAddress, chainId || 1);
  }
  
  // Default to EVM
  return await checkEVMSecurity(tokenAddress, chainId || 1);
}
