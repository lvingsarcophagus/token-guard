/**
 * Moralis Historical Chart Fetching
 * FIXED: Uses getTokenPrice with toBlock loop for historical data
 * 
 * Key fixes:
 * - Validates token exists via single getTokenPrice call
 * - Loops through blocks/timestamps using toBlock parameter
 * - Handles chains with different support levels (EVM vs Solana)
 * - Includes proper error handling for unsupported tokens
 */

interface HistoricalPrice {
  time: number; // Unix timestamp
  block: number;
  price: number;
  nativePrice?: number;
}

interface MoralisHistoricalResult {
  prices: HistoricalPrice[];
  source: "moralis";
  dataQuality: "GOOD" | "MODERATE" | "POOR";
  priceCount: number;
  chain: string;
  tokenAddress: string;
  timespan: { from: number; to: number };
}

const MORALIS_KEY = process.env.MORALIS_API_KEY;
const BLOCK_CACHE = new Map<string, { block: number; timestamp: number }>();
const PRICE_CACHE = new Map<string, { data: MoralisHistoricalResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Convert Unix timestamp to nearest block number using Moralis RPC
 * This is more accurate than time-based approximation
 */
async function getBlockByTimestamp(
  chain: string,
  timestamp: number
): Promise<number | null> {
  try {
    // Check cache first
    const cacheKey = `${chain}-${timestamp}`;
    const cached = BLOCK_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.block;
    }

    // Map chain names to Moralis API chain identifiers
    const chainMap: Record<string, string> = {
      ethereum: "eth",
      "ethereum-mainnet": "eth",
      eth: "eth",
      bsc: "bsc",
      "binance-smart-chain": "bsc",
      polygon: "polygon",
      arbitrum: "arbitrum",
      avalanche: "avalanche",
      fantom: "fantom",
      optimism: "optimism",
      base: "base",
      solana: "solana",
      cardano: "cardano",
    };

    const moralisChain = chainMap[chain.toLowerCase()] || chain.toLowerCase();

    const url = `https://deep-index.moralis.io/api/v2/block/date?chain=${moralisChain}&date=${new Date(
      timestamp * 1000
    ).toISOString()}`;

    const response = await fetch(url, {
      headers: {
        "X-API-Key": MORALIS_KEY || "",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        `[Moralis] Block lookup failed for ${chain} at ${new Date(timestamp * 1000).toISOString()}`
      );
      return null;
    }

    const data = await response.json();
    const blockNumber = data?.block;

    if (blockNumber) {
      BLOCK_CACHE.set(cacheKey, { block: blockNumber, timestamp: Date.now() });
      return blockNumber;
    }

    return null;
  } catch (error) {
    console.error("[Moralis] Block lookup error:", error);
    return null;
  }
}

/**
 * Step 1: Validate token exists and is supported
 */
async function validateMoralisToken(
  tokenAddress: string,
  chain: string
): Promise<{ valid: boolean; decimals?: number; symbol?: string }> {
  try {
    const chainMap: Record<string, string> = {
      ethereum: "0x1",
      eth: "0x1",
      bsc: "0x38",
      polygon: "0x89",
      arbitrum: "0xa4b1",
      avalanche: "0xa86a",
      fantom: "0xfa",
      optimism: "0xa",
      base: "0x2105",
    };

    const chainId = chainMap[chain.toLowerCase()];
    if (!chainId) {
      console.warn(`[Moralis] Unsupported chain: ${chain}`);
      return { valid: false };
    }

    // Check if token exists by fetching its current metadata
    const url = `https://deep-index.moralis.io/api/v2/token/${tokenAddress}/metadata?chain=${chainId}`;

    const response = await fetch(url, {
      headers: {
        "X-API-Key": MORALIS_KEY || "",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        `[Moralis] Token validation failed: ${response.status} for ${tokenAddress} on ${chain}`
      );
      return { valid: false };
    }

    const data = await response.json();

    if (data?.[0]) {
      console.log(
        `[Moralis] ✓ Token validated: ${data[0].name} (${data[0].symbol})`
      );
      return {
        valid: true,
        decimals: data[0].decimals,
        symbol: data[0].symbol,
      };
    }

    return { valid: false };
  } catch (error) {
    console.error("[Moralis] Token validation error:", error);
    return { valid: false };
  }
}

/**
 * Step 2: Fetch historical prices using Moralis API (block-based)
 * Note: Moralis doesn't provide OHLCV directly via REST - use price snapshots
 */
export async function getMoralisHistorical(
  tokenAddress: string,
  chain: string,
  days: number = 7,
  interval: number = 3600 // Seconds between price samples (3600 = 1 hour)
): Promise<MoralisHistoricalResult> {
  try {
    // Check cache first
    const cacheKey = `${tokenAddress}-${chain}-${days}-${interval}`;
    const cached = PRICE_CACHE.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Moralis] Cache hit for ${tokenAddress}`);
      return cached.data;
    }

    console.log(
      `[Moralis] Fetching historical prices: ${tokenAddress} on ${chain}, ${days}D, ${interval}s interval`
    );

    // Step 1: Validate token
    const validation = await validateMoralisToken(tokenAddress, chain);

    if (!validation.valid) {
      throw new Error(
        `Invalid or unsupported token: ${tokenAddress} on ${chain}`
      );
    }

    // Step 2: Build time range
    const now = Math.floor(Date.now() / 1000);
    const startTime = now - days * 24 * 3600;
    const prices: HistoricalPrice[] = [];

    // Step 3: Loop through timestamps and fetch prices
    // Moralis rate limit: typically 10-50 req/s depending on plan
    const chainMap: Record<string, string> = {
      ethereum: "0x1",
      eth: "0x1",
      bsc: "0x38",
      polygon: "0x89",
      arbitrum: "0xa4b1",
      avalanche: "0xa86a",
      fantom: "0xfa",
      optimism: "0xa",
      base: "0x2105",
    };

    const chainId = chainMap[chain.toLowerCase()];

    for (let time = startTime; time < now; time += interval) {
      try {
        // Get block number for this timestamp
        const block = await getBlockByTimestamp(chain, time);

        if (!block) {
          console.warn(
            `[Moralis] Could not find block for timestamp ${time}`
          );
          continue;
        }

        // Fetch token price at this block
        const url = `https://deep-index.moralis.io/api/v2/token/${tokenAddress}/price?chain=${chainId}&to_block=${block}`;

        const response = await fetch(url, {
          headers: {
            "X-API-Key": MORALIS_KEY || "",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          console.warn(
            `[Moralis] Price fetch failed for block ${block}: ${response.status}`
          );
          continue;
        }

        const data = await response.json();

        if (data?.usdPrice !== undefined) {
          prices.push({
            time,
            block,
            price: data.usdPrice,
            nativePrice: data.nativePrice?.value,
          });
        }

        // Rate limiting: small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(
          `[Moralis] Error fetching price for time ${time}:`,
          error instanceof Error ? error.message : error
        );
        continue;
      }
    }

    // Step 4: Validate we got data
    if (prices.length === 0) {
      throw new Error(
        `No historical price data available for ${tokenAddress} on ${chain} - token may be too new`
      );
    }

    // Determine data quality based on how much data we got
    let dataQuality: "GOOD" | "MODERATE" | "POOR" = "GOOD";
    const expectedCount = Math.ceil((now - startTime) / interval);
    const coverageRatio = prices.length / expectedCount;

    if (coverageRatio < 0.3) {
      dataQuality = "POOR";
    } else if (coverageRatio < 0.7) {
      dataQuality = "MODERATE";
    }

    const result: MoralisHistoricalResult = {
      prices: prices.sort((a, b) => a.time - b.time),
      source: "moralis",
      dataQuality,
      priceCount: prices.length,
      chain,
      tokenAddress,
      timespan: { from: startTime, to: now },
    };

    // Cache the result
    PRICE_CACHE.set(cacheKey, { data: result, timestamp: Date.now() });

    console.log(
      `[Moralis] ✓ Retrieved ${result.priceCount} price samples (${dataQuality} quality)`
    );
    return result;
  } catch (error) {
    console.error(
      `[Moralis] Historical fetch failed for ${tokenAddress}:`,
      error instanceof Error ? error.message : error
    );
    throw error;
  }
}

/**
 * Parse Moralis prices into chart-ready format
 * Note: This generates approximated OHLCV from price snapshots
 */
export function parseMoralisChartData(
  history: MoralisHistoricalResult,
  groupByHours: number = 1
): {
  labels: string[];
  opens: number[];
  highs: number[];
  lows: number[];
  closes: number[];
} {
  if (!history?.prices || history.prices.length === 0) {
    return { labels: [], opens: [], highs: [], lows: [], closes: [] };
  }

  // Group prices by time window
  const grouped = new Map<number, number[]>();
  const groupInterval = groupByHours * 3600;

  for (const price of history.prices) {
    const groupKey = Math.floor(price.time / groupInterval) * groupInterval;
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey)!.push(price.price);
  }

  // Create OHLC from grouped prices
  const labels: string[] = [];
  const opens: number[] = [];
  const highs: number[] = [];
  const lows: number[] = [];
  const closes: number[] = [];

  const sorted = Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);

  for (const [timestamp, priceGroup] of sorted) {
    if (priceGroup.length === 0) continue;

    const sorted_prices = priceGroup.sort((a, b) => a - b);

    labels.push(
      new Date(timestamp * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
      })
    );
    opens.push(priceGroup[0]);
    highs.push(Math.max(...sorted_prices));
    lows.push(Math.min(...sorted_prices));
    closes.push(priceGroup[priceGroup.length - 1]);
  }

  return { labels, opens, highs, lows, closes };
}

/**
 * Clear cache (for testing/manual refresh)
 */
export function clearMoralisCache(): void {
  PRICE_CACHE.clear();
  BLOCK_CACHE.clear();
  console.log("[Moralis] Cache cleared");
}
