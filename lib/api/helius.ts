/**
 * Helius API Service (Solana)
 * Provides Solana-specific security data (authorities, mint capability)
 */

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_BASE_URL = 'https://api.helius.xyz/v0';

export interface SolanaSecurityData {
  freezeAuthority: string | null;
  mintAuthority: string | null;
  programAuthority: string | null;
}

/**
 * Get Solana token authorities for security analysis
 */
export async function getHeliusSolanaData(
  tokenAddress: string
): Promise<SolanaSecurityData | null> {
  try {
    console.log(`[Helius] API key available: ${!!HELIUS_API_KEY}`);
    if (!HELIUS_API_KEY) {
      console.warn('[Helius] API key not configured');
      return null;
    }

    console.log(`[Helius] Fetching Solana data for ${tokenAddress}`);

    const response = await fetch(
      `${HELIUS_BASE_URL}/token-metadata?api-key=${HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mintAccounts: [tokenAddress]
        })
      }
    );

    if (!response.ok) {
      console.warn(`[Helius] HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.warn('[Helius] No data returned for token');
      return null;
    }

    const tokenData = data[0];

    // Extract authorities
    const securityData: SolanaSecurityData = {
      freezeAuthority: tokenData.freezeAuthority || null,
      mintAuthority: tokenData.mintAuthority || null,
      programAuthority: tokenData.updateAuthority || null
    };

    console.log(`[Helius] Security data retrieved:`, {
      freezeAuthority: securityData.freezeAuthority ? 'Set' : 'Revoked',
      mintAuthority: securityData.mintAuthority ? 'Set' : 'Revoked',
      programAuthority: securityData.programAuthority ? 'Set' : 'Revoked'
    });

    return securityData;
  } catch (error: any) {
    console.error('[Helius] Error fetching Solana data:', error.message);
    return null;
  }
}

/**
 * Get Solana token supply info
 */
export async function getHeliusSupplyInfo(
  tokenAddress: string
): Promise<{ supply: number; decimals: number } | null> {
  try {
    if (!HELIUS_API_KEY) {
      return null;
    }

    const response = await fetch(
      `${HELIUS_BASE_URL}/token-metadata?api-key=${HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mintAccounts: [tokenAddress]
        })
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const tokenData = data[0];

    return {
      supply: tokenData.supply || 0,
      decimals: tokenData.decimals || 9
    };
  } catch (error: any) {
    console.error('[Helius] Error fetching supply info:', error.message);
    return null;
  }
}
