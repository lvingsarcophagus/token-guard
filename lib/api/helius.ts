/**
 * Helius API Service (Solana)
 * Provides comprehensive Solana data using DAS API and Enhanced Transactions
 * Free tier includes: Token metadata, authorities, holder data, transaction history
 */

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_BASE_URL = 'https://api.helius.xyz/v0';
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

export interface SolanaSecurityData {
  freezeAuthority: string | null;
  mintAuthority: string | null;
  programAuthority: string | null;
  supply?: number;
  decimals?: number;
  holderCount?: number;
}

export interface SolanaEnhancedData {
  metadata: {
    name: string;
    symbol: string;
    decimals: number;
    supply: number;
  };
  authorities: {
    freezeAuthority: string | null;
    mintAuthority: string | null;
    updateAuthority: string | null;
  };
  holders: {
    count: number;
    topHolders: Array<{
      address: string;
      balance: number;
      percentage: number;
    }>;
  };
  transactions: {
    count24h: number;
    volume24h: number;
    uniqueTraders24h: number;
  };
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

    // Extract authorities and additional data with proper fallbacks
    const securityData: SolanaSecurityData = {
      freezeAuthority: tokenData.freezeAuthority || null,
      mintAuthority: tokenData.mintAuthority || null,
      programAuthority: tokenData.updateAuthority || null,
      supply: tokenData.supply || 
              tokenData.onChainMetadata?.tokenAmount?.amount ||
              tokenData.offChainMetadata?.supply,
      decimals: tokenData.decimals || 
                tokenData.onChainMetadata?.tokenAmount?.decimals ||
                tokenData.offChainMetadata?.decimals || 
                9, // Default for most SPL tokens
      holderCount: tokenData.holderCount || undefined
    };

    console.log(`[Helius] Security data retrieved:`, {
      freezeAuthority: securityData.freezeAuthority ? 'Set' : 'Revoked',
      mintAuthority: securityData.mintAuthority ? 'Set' : 'Revoked',
      programAuthority: securityData.programAuthority ? 'Set' : 'Revoked',
      supply: securityData.supply ? 'Available' : 'N/A',
      decimals: securityData.decimals || 'N/A',
      holderCount: securityData.holderCount || 'N/A'
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


/**
 * Get comprehensive Solana token data using DAS API
 * Uses Helius free tier features for enhanced analysis
 */
export async function getHeliusEnhancedData(
  tokenAddress: string
): Promise<SolanaEnhancedData | null> {
  try {
    if (!HELIUS_API_KEY) {
      console.warn('[Helius] API key not configured for enhanced data');
      return null;
    }

    console.log(`[Helius] Fetching enhanced data for ${tokenAddress}`);

    // Fetch token metadata using DAS API
    const metadataResponse = await fetch(
      `${HELIUS_BASE_URL}/token-metadata?api-key=${HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mintAccounts: [tokenAddress] })
      }
    );

    if (!metadataResponse.ok) {
      console.warn(`[Helius] Metadata fetch failed: ${metadataResponse.status}`);
      return null;
    }

    const metadataData = await metadataResponse.json();
    const tokenMeta = metadataData[0];

    if (!tokenMeta) {
      console.warn('[Helius] No metadata found for token');
      return null;
    }

    // Extract total supply for holder percentage calculations
    const totalSupply = tokenMeta.supply || 0;

    // Get token holders using RPC (pass total supply for percentage calculation)
    const holdersData = await getHeliusTokenHolders(tokenAddress, totalSupply);

    // Get recent transactions using Enhanced Transactions API
    const transactionsData = await getHeliusTransactions(tokenAddress);

    const enhancedData: SolanaEnhancedData = {
      metadata: {
        name: tokenMeta.onChainMetadata?.metadata?.data?.name || tokenMeta.offChainMetadata?.name || 'Unknown',
        symbol: tokenMeta.onChainMetadata?.metadata?.data?.symbol || tokenMeta.offChainMetadata?.symbol || 'UNKNOWN',
        decimals: tokenMeta.decimals || 9,
        supply: totalSupply
      },
      authorities: {
        freezeAuthority: tokenMeta.freezeAuthority || null,
        mintAuthority: tokenMeta.mintAuthority || null,
        updateAuthority: tokenMeta.updateAuthority || null
      },
      holders: holdersData || {
        count: 0,
        topHolders: []
      },
      transactions: transactionsData || {
        count24h: 0,
        volume24h: 0,
        uniqueTraders24h: 0
      }
    };

    console.log(`[Helius] Enhanced data retrieved:`, {
      name: enhancedData.metadata.name,
      symbol: enhancedData.metadata.symbol,
      supply: enhancedData.metadata.supply,
      holderCount: enhancedData.holders.count,
      tx24h: enhancedData.transactions.count24h
    });

    return enhancedData;
  } catch (error: any) {
    console.error('[Helius] Error fetching enhanced data:', error.message);
    return null;
  }
}

/**
 * Get token holders using Helius getTokenAccounts RPC method
 * Uses pagination to get accurate holder count for all tokens
 */
async function getHeliusTokenHolders(tokenAddress: string, totalSupply?: number): Promise<{ count: number; topHolders: any[]; top10Percentage?: number; top50Percentage?: number; top100Percentage?: number } | null> {
  try {
    if (!HELIUS_API_KEY) {
      console.warn('[Helius] API key not configured for holder data');
      return null;
    }

    console.log(`[Helius] Fetching token holders for ${tokenAddress}`);

    // Collect all token accounts with pagination
    let page = 1;
    let allTokenAccounts: any[] = [];
    const maxPages = 20; // Limit to prevent excessive API calls (20k accounts max)
    let hitLimit = false;

    while (page <= maxPages) {
      const response = await fetch(HELIUS_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'helius-holders',
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
        console.warn(`[Helius] Holder RPC request failed: ${response.status}`);
        break;
      }

      const data = await response.json();
      
      // Check for RPC errors
      if (data.error) {
        console.warn(`[Helius] RPC error: ${data.error.message}`);
        break;
      }

      // Check if we have results
      if (!data.result || !data.result.token_accounts || data.result.token_accounts.length === 0) {
        console.log(`[Helius] No more results at page ${page}`);
        break;
      }

      console.log(`[Helius] Page ${page}: Found ${data.result.token_accounts.length} token accounts`);
      allTokenAccounts.push(...data.result.token_accounts);

      // If we got less than 1000, we've reached the end
      if (data.result.token_accounts.length < 1000) {
        break;
      }

      page++;
    }

    // Check if we hit the pagination limit
    if (page > maxPages) {
      hitLimit = true;
      console.log(`[Helius] Hit pagination limit at ${maxPages} pages (${allTokenAccounts.length} accounts)`);
    }

    if (allTokenAccounts.length === 0) {
      console.warn('[Helius] No token accounts found');
      return null;
    }

    // Group by owner to get unique holders and sum their balances
    const holderMap = new Map<string, number>();
    
    allTokenAccounts.forEach((account: any) => {
      const owner = account.owner;
      const amount = parseFloat(account.amount) || 0;
      
      if (holderMap.has(owner)) {
        holderMap.set(owner, holderMap.get(owner)! + amount);
      } else {
        holderMap.set(owner, amount);
      }
    });

    // Convert to array and sort by balance (descending)
    const holders = Array.from(holderMap.entries())
      .map(([address, balance]) => ({ address, balance }))
      .sort((a, b) => b.balance - a.balance);

    const holderCount = holders.length;
    console.log(`[Helius] Total unique holders: ${holderCount}${hitLimit ? ' (minimum, hit pagination limit)' : ''}`);

    // Calculate percentages if total supply is available
    const topHolders = holders.slice(0, 10).map((holder) => {
      const percentage = totalSupply && totalSupply > 0 ? (holder.balance / totalSupply) * 100 : 0;
      
      return {
        address: holder.address,
        balance: holder.balance,
        percentage: percentage
      };
    });

    // Calculate concentration metrics
    let top10Percentage, top50Percentage, top100Percentage;
    
    if (totalSupply && totalSupply > 0) {
      const top10Sum = holders.slice(0, Math.min(10, holders.length))
        .reduce((sum, holder) => sum + holder.balance, 0);
      top10Percentage = (top10Sum / totalSupply) * 100;

      const top50Sum = holders.slice(0, Math.min(50, holders.length))
        .reduce((sum, holder) => sum + holder.balance, 0);
      top50Percentage = (top50Sum / totalSupply) * 100;

      const top100Sum = holders.slice(0, Math.min(100, holders.length))
        .reduce((sum, holder) => sum + holder.balance, 0);
      top100Percentage = (top100Sum / totalSupply) * 100;
    }
    
    return {
      count: holderCount,
      topHolders,
      top10Percentage,
      top50Percentage,
      top100Percentage
    };
  } catch (error: any) {
    console.error('[Helius] Error fetching holders:', error.message);
    return null;
  }
}

/**
 * Get recent transactions using Enhanced Transactions API
 */
async function getHeliusTransactions(tokenAddress: string): Promise<{ count24h: number; volume24h: number; uniqueTraders24h: number } | null> {
  try {
    if (!HELIUS_API_KEY) {
      console.warn('[Helius] API key not configured for transaction data');
      return null;
    }

    // NOTE: The /addresses/{address}/transactions endpoint returns transactions
    // for the MINT ADDRESS itself (token creation events), not token transfers.
    // For accurate token transaction counts, we would need DAS API or Enhanced Transactions
    // which require paid Helius plans. For now, return null to let the system
    // estimate from volume data (more accurate than mint address transactions).
    
    console.log('[Helius] Token transaction history requires paid API tier - using volume estimation');
    
    return null;
    
    // FUTURE: When using paid Helius tier, implement proper token transfer tracking
    // using Enhanced Transactions API or DAS getSignaturesForAsset
  } catch (error) {
    console.error('[Helius] Error fetching transactions:', error);
    return null;
  }
}

/**
 * Get detailed transaction history with human-readable format
 * Uses Enhanced Transactions API for better UX
 */
export async function getHeliusTransactionHistory(
  tokenAddress: string,
  limit: number = 50
): Promise<any[] | null> {
  try {
    if (!HELIUS_API_KEY) return null;

    const response = await fetch(
      `${HELIUS_BASE_URL}/addresses/${tokenAddress}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.ok) return null;

    const transactions = await response.json();
    return Array.isArray(transactions) ? transactions : null;
  } catch (error) {
    console.error('[Helius] Error fetching transaction history:', error);
    return null;
  }
}

/**
 * Get token price data from Helius DAS API
 * Free tier includes top 10k tokens by 24h volume
 */
export async function getHeliusTokenPrice(
  tokenAddress: string
): Promise<{ price: number; priceChange24h: number } | null> {
  try {
    if (!HELIUS_API_KEY) return null;

    // Use DAS API to get token metadata which includes price for verified tokens
    const response = await fetch(
      `${HELIUS_BASE_URL}/token-metadata?api-key=${HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mintAccounts: [tokenAddress] })
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const tokenData = data[0];

    if (!tokenData) return null;

    // Extract price data if available
    return {
      price: tokenData.price || 0,
      priceChange24h: tokenData.priceChange24h || 0
    };
  } catch (error) {
    console.error('[Helius] Error fetching token price:', error);
    return null;
  }
}

/**
 * Get comprehensive dashboard data for Solana tokens
 * Combines all Helius free tier features
 */
export async function getHeliusDashboardData(
  tokenAddress: string
): Promise<{
  metadata: any;
  authorities: any;
  holders: any;
  transactions: any;
  price: any;
  recentActivity: any[];
} | null> {
  try {
    if (!HELIUS_API_KEY) {
      console.warn('[Helius] API key not configured for dashboard data');
      return null;
    }

    console.log(`[Helius] Fetching comprehensive dashboard data for ${tokenAddress}`);

    // Fetch all data in parallel for better performance
    const [enhancedData, transactionHistory, priceData] = await Promise.all([
      getHeliusEnhancedData(tokenAddress),
      getHeliusTransactionHistory(tokenAddress, 20),
      getHeliusTokenPrice(tokenAddress)
    ]);

    if (!enhancedData) {
      console.warn('[Helius] No enhanced data available');
      return null;
    }

    return {
      metadata: enhancedData.metadata,
      authorities: enhancedData.authorities,
      holders: enhancedData.holders,
      transactions: enhancedData.transactions,
      price: priceData,
      recentActivity: transactionHistory || []
    };
  } catch (error: any) {
    console.error('[Helius] Error fetching dashboard data:', error.message);
    return null;
  }
}
