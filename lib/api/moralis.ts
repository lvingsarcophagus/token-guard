/**
 * Moralis API Service
 * Provides behavioral tokenomics data (holder history, liquidity history, transaction patterns)
 * With integrated rate limiting (40 req/sec) and caching (5-15min TTL)
 */

import { monitoredAPICall, APIService } from '../api-monitor';
import {
  getCachedHolderHistory,
  cacheHolderHistory,
  getCachedLiquidityHistory,
  cacheLiquidityHistory,
  getCachedTransactionPatterns,
  cacheTransactionPatterns,
  getCachedWalletAge,
  cacheWalletAge
} from '../behavioral-cache';

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;
const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

// Chain ID to Moralis chain name mapping
const CHAIN_MAP: Record<string, string> = {
  '1': 'eth',
  '56': 'bsc',
  '137': 'polygon',
  '43114': 'avalanche',
  '250': 'fantom',
  '42161': 'arbitrum',
  '10': 'optimism',
  '8453': 'base',
  '11155111': 'sepolia'
};

interface MoralisHolderHistory {
  current: number;
  day7Ago: number;
  day30Ago: number;
}

interface MoralisTransactionPatterns {
  uniqueBuyers24h: number;
  uniqueSellers24h: number;
  buyTransactions24h: number;
  sellTransactions24h: number;
}

/**
 * Get holder count history for behavioral analysis
 * With caching (10min TTL) and rate limiting (40 req/sec)
 */
export async function getMoralisHolderHistory(
  tokenAddress: string,
  chainId: string
): Promise<MoralisHolderHistory | null> {
  try {
    const chainIdNum = parseInt(chainId);
    
    // Check cache first
    const cached = getCachedHolderHistory(tokenAddress, chainIdNum);
    if (cached) {
      return cached;
    }
    
    const chain = CHAIN_MAP[chainId];
    if (!chain) {
      console.warn(`[Moralis] Chain ${chainId} not supported`);
      return null;
    }

    if (!MORALIS_API_KEY) {
      console.warn('[Moralis] API key not configured');
      return null;
    }

    // Use monitored API call with automatic rate limiting
    const result = await monitoredAPICall(APIService.MORALIS, async () => {
      const response = await fetch(
        `${MORALIS_BASE_URL}/erc20/${tokenAddress}/stats?chain=${chain}`,
        {
          headers: {
            'X-API-Key': MORALIS_API_KEY,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    });

    const holderHistory = {
      current: result.holders_count || 0,
      day7Ago: result.holders_count_7d || result.holders_count || 0,
      day30Ago: result.holders_count_30d || result.holders_count || 0
    };
    
    // Cache the result
    cacheHolderHistory(tokenAddress, chainIdNum, holderHistory);
    
    return holderHistory;
  } catch (error: any) {
    console.error('[Moralis] Error fetching holder history:', error.message);
    return null;
  }
}

/**
 * Get liquidity history for rug pull detection
 */
export async function getMoralisLiquidityHistory(
  tokenAddress: string,
  chainId: string
): Promise<{ current: number; day7Ago: number } | null> {
  try {
    const chain = CHAIN_MAP[chainId];
    if (!chain) {
      console.warn(`[Moralis] Chain ${chainId} not supported`);
      return null;
    }

    if (!MORALIS_API_KEY) {
      console.warn('[Moralis] API key not configured');
      return null;
    }

    // Get current liquidity from pairs
    const response = await fetch(
      `${MORALIS_BASE_URL}/erc20/${tokenAddress}/pairs?chain=${chain}`,
      {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.warn(`[Moralis] HTTP ${response.status} for liquidity history`);
      return null;
    }

    const data = await response.json();
    
    // Sum liquidity across all pairs
    const currentLiquidity = data.pairs?.reduce((sum: number, pair: any) => {
      return sum + (parseFloat(pair.liquidity_usd) || 0);
    }, 0) || 0;

    // Note: Moralis doesn't provide historical liquidity directly
    // We'll use current value for both (can be enhanced with on-chain queries)
    return {
      current: currentLiquidity,
      day7Ago: currentLiquidity // Fallback to current
    };
  } catch (error: any) {
    console.error('[Moralis] Error fetching liquidity history:', error.message);
    return null;
  }
}

/**
 * Get transaction patterns for wash trading detection
 */
export async function getMoralisTransactionPatterns(
  tokenAddress: string,
  chainId: string
): Promise<MoralisTransactionPatterns | null> {
  try {
    const chain = CHAIN_MAP[chainId];
    if (!chain) {
      console.warn(`[Moralis] Chain ${chainId} not supported`);
      return null;
    }

    if (!MORALIS_API_KEY) {
      console.warn('[Moralis] API key not configured');
      return null;
    }

    // Get recent transfers to analyze buy/sell patterns
    const response = await fetch(
      `${MORALIS_BASE_URL}/erc20/${tokenAddress}/transfers?chain=${chain}&limit=100`,
      {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.warn(`[Moralis] HTTP ${response.status} for transaction patterns`);
      return null;
    }

    const data = await response.json();
    const transfers = data.result || [];

    // Analyze last 24h of transfers
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentTransfers = transfers.filter((tx: any) => {
      const txTime = new Date(tx.block_timestamp).getTime();
      return txTime > oneDayAgo;
    });

    // Count unique addresses
    const buyers = new Set<string>();
    const sellers = new Set<string>();
    let buyTxCount = 0;
    let sellTxCount = 0;

    recentTransfers.forEach((tx: any) => {
      const from = tx.from_address?.toLowerCase();
      const to = tx.to_address?.toLowerCase();

      // Simple heuristic: transfers TO user wallets = buys, FROM user wallets = sells
      // This is simplified - production would check DEX router addresses
      if (from) {
        sellers.add(from);
        sellTxCount++;
      }
      if (to) {
        buyers.add(to);
        buyTxCount++;
      }
    });

    return {
      uniqueBuyers24h: buyers.size,
      uniqueSellers24h: sellers.size,
      buyTransactions24h: buyTxCount,
      sellTransactions24h: sellTxCount
    };
  } catch (error: any) {
    console.error('[Moralis] Error fetching transaction patterns:', error.message);
    return null;
  }
}

/**
 * Get wallet age for smart money detection
 */
export async function getMoralisWalletAge(
  walletAddress: string,
  chainId: string
): Promise<number | null> {
  try {
    const chain = CHAIN_MAP[chainId];
    if (!chain || !MORALIS_API_KEY) {
      return null;
    }

    // Get first transaction to determine wallet age
    const response = await fetch(
      `${MORALIS_BASE_URL}/${walletAddress}?chain=${chain}`,
      {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.first_transaction_date) {
      const firstTxDate = new Date(data.first_transaction_date).getTime();
      const ageDays = Math.floor((Date.now() - firstTxDate) / (24 * 60 * 60 * 1000));
      return ageDays;
    }

    return null;
  } catch (error: any) {
    console.error('[Moralis] Error fetching wallet age:', error.message);
    return null;
  }
}

/**
 * Get average holder wallet age
 */
export async function getMoralisAverageHolderAge(
  tokenAddress: string,
  chainId: string,
  sampleSize: number = 10
): Promise<number | null> {
  try {
    const chain = CHAIN_MAP[chainId];
    if (!chain || !MORALIS_API_KEY) {
      return null;
    }

    // Get top holders
    const response = await fetch(
      `${MORALIS_BASE_URL}/erc20/${tokenAddress}/owners?chain=${chain}&limit=${sampleSize}`,
      {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const holders = data.result || [];

    // Get wallet ages for sample of holders
    const agePromises = holders.slice(0, sampleSize).map((holder: any) =>
      getMoralisWalletAge(holder.owner_address, chainId)
    );

    const ages = await Promise.all(agePromises);
    const validAges = ages.filter((age): age is number => age !== null);

    if (validAges.length === 0) {
      return null;
    }

    const avgAge = validAges.reduce((sum, age) => sum + age, 0) / validAges.length;
    return Math.floor(avgAge);
  } catch (error: any) {
    console.error('[Moralis] Error fetching average holder age:', error.message);
    return null;
  }
}

/**
 * Get token metadata for enhanced tokenomics data
 * Returns: supply, decimals, holder count, transaction count
 * This complements Mobula data with real-time on-chain metrics
 */
export async function getMoralisTokenMetadata(
  tokenAddress: string,
  chainId: string
): Promise<{
  totalSupply: number;
  circulatingSupply: number;
  holderCount: number;
  txCount24h: number;
} | null> {
  try {
    const chainIdNum = parseInt(chainId);
    const chain = CHAIN_MAP[chainId];
    
    if (!chain) {
      console.log(`[Moralis Metadata] Chain ${chainId} not supported`);
      return null;
    }

    if (!MORALIS_API_KEY) {
      console.log('[Moralis Metadata] API key not configured');
      return null;
    }

    console.log(`[Moralis Metadata] Fetching tokenomics for ${tokenAddress} on ${chain}`);

    // Use monitored API call with automatic rate limiting - Get metadata first
    const metadataResult = await monitoredAPICall(APIService.MORALIS, async () => {
      const response = await fetch(
        `${MORALIS_BASE_URL}/erc20/metadata?chain=${chain}&addresses[]=${tokenAddress}`,
        {
          headers: {
            'X-API-Key': MORALIS_API_KEY,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    });

    // Extract tokenomics data from metadata response
    const tokenData = metadataResult && metadataResult.length > 0 ? metadataResult[0] : null;
    
    if (!tokenData) {
      console.log('[Moralis Metadata] No metadata found');
      return null;
    }

    const totalSupply = tokenData.total_supply ? parseFloat(tokenData.total_supply) / Math.pow(10, parseInt(tokenData.decimals || '18')) : 0;
    const circulatingSupply = tokenData.circulating_supply ? parseFloat(tokenData.circulating_supply) : totalSupply;
    const holderCount = 0; // Not available in metadata, need to get from stats or other endpoint
    
    // Get transaction count from recent transfers
    let txCount24h = 0;
    try {
      const transfersResult = await monitoredAPICall(APIService.MORALIS, async () => {
        const response = await fetch(
          `${MORALIS_BASE_URL}/erc20/${tokenAddress}/transfers?chain=${chain}&limit=100`,
          {
            headers: {
              'X-API-Key': MORALIS_API_KEY,
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      });

      // Count transfers in last 24 hours
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      txCount24h = transfersResult.result?.filter((tx: any) => 
        new Date(tx.block_timestamp).getTime() > oneDayAgo
      ).length || 0;
    } catch (err) {
      console.log('[Moralis Metadata] Could not fetch transfer count');
    }

    console.log(`[Moralis Metadata] ✅ Retrieved: holders=${holderCount}, supply=${totalSupply}, tx24h=${txCount24h}`);

    return {
      totalSupply,
      circulatingSupply,
      holderCount,
      txCount24h
    };
  } catch (error: any) {
    console.error('[Moralis Metadata] Error fetching token metadata:', error.message);
    return null;
  }
}

export type { MoralisHolderHistory, MoralisTransactionPatterns };
