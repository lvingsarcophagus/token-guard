/**
 * Mobula Historical Chart Fetching
 * FIXED: Uses correct endpoint /api/1/market/history/pair with validation
 * 
 * Key fixes:
 * - Validates pair exists first via /market/pair endpoint
 * - Uses correct params: address (pair), period, from/to (Unix ms), amount
 * - Handles empty bars (no trades, token too new)
 * - Includes 5-minute caching
 */

const MOBULA_KEY = process.env.MOBULA_API_KEY;
const CACHE_MAP = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Step 1: Validate that a trading pair exists before fetching history
 * This prevents random fetches and 404 errors
 */
async function validateMobulaPair(
  tokenAddress: string,
  chain: string
): Promise<string | null> {
  try {
    const url = `https://api.mobula.io/api/1/market/pair?address=${encodeURIComponent(
      tokenAddress
    )}&blockchain=${chain}`;

    const response = await fetch(url, {
      headers: {
        Authorization: MOBULA_KEY || "",
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // 1 hour cache
    });

    if (!response.ok) {
      console.warn(
        `[Mobula] Pair validation failed: ${response.status} for ${tokenAddress} on ${chain}`
      );
      return null;
    }

    const data = await response.json();
    const pairAddress = data?.data?.pair_address;

    if (pairAddress) {
      console.log(
        `[Mobula] ✓ Pair validated: ${pairAddress} for ${tokenAddress}`
      );
      return pairAddress;
    }

    console.warn(`[Mobula] No pair found for ${tokenAddress} on ${chain}`);
    return null;
  } catch (error) {
    console.error("[Mobula] Pair validation error:", error);
    return null;
  }
}

/**
 * Step 2: Fetch historical OHLCV data from Mobula
 * Uses validated pair address from Step 1
 */
export async function getMobulaHistorical(
  tokenAddress: string,
  chain: string,
  days: number = 7,
  period: string = "1h" // "1min", "15min", "1h", "4h", "1D"
): Promise<any> {
  try {
    // Check cache first
    const cacheKey = `${tokenAddress}-${chain}-${days}-${period}`;
    const cached = CACHE_MAP.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Mobula] Cache hit for ${tokenAddress}`);
      return cached.data;
    }

    console.log(
      `[Mobula] Fetching historical data: ${tokenAddress} on ${chain}, ${days}D, ${period}`
    );

    // Step 1: Validate pair exists
    const pairAddress = await validateMobulaPair(tokenAddress, chain);

    if (!pairAddress) {
      throw new Error(
        `No valid trading pair found for ${tokenAddress} on ${chain} - cannot fetch historical data`
      );
    }

    // Step 2: Calculate time range
    const now = Date.now();
    const from = now - days * 24 * 60 * 60 * 1000; // Unix milliseconds
    const to = now;

    // Calculate appropriate candle count
    // For 7D with 1h candles: ~168 candles
    // For 30D with 1D candles: ~30 candles
    let amount = days * 24; // Default: hourly candles
    if (period === "1D" || period === "4h") {
      amount = Math.ceil((days * 24) / parseInt(period));
    }
    amount = Math.min(amount, 300); // Mobula limit

    // Step 3: Fetch historical data
    const url = new URL("https://api.mobula.io/api/1/market/history/pair");
    url.searchParams.append("address", pairAddress);
    url.searchParams.append("blockchain", chain);
    url.searchParams.append("period", period);
    url.searchParams.append("from", from.toString());
    url.searchParams.append("to", to.toString());
    url.searchParams.append("amount", amount.toString());
    url.searchParams.append("usd", "true");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: MOBULA_KEY || "",
        Accept: "application/json",
      },
      next: { revalidate: 300 }, // 5 minute cache
    });

    if (!response.ok) {
      throw new Error(
        `[Mobula] API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Step 4: Validate response has bars
    if (!data?.data?.bars || data.data.bars.length === 0) {
      console.warn(
        `[Mobula] No historical trades available for ${tokenAddress} (too new or low volume)`
      );
      throw new Error(
        `No historical trades available for ${tokenAddress} on ${chain} - token may be too new or have low volume`
      );
    }

    const result = {
      bars: data.data.bars.map((bar: any) => ({
        time: bar.time, // Unix timestamp
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      })),
      source: "mobula",
      dataQuality: "EXCELLENT",
      barCount: data.data.bars.length,
      period,
      chain,
      tokenAddress,
    };

    // Cache the result
    CACHE_MAP.set(cacheKey, { data: result, timestamp: Date.now() });

    console.log(
      `[Mobula] ✓ Retrieved ${result.barCount} bars for ${tokenAddress}`
    );
    return result;
  } catch (error) {
    console.error(
      `[Mobula] Historical fetch failed for ${tokenAddress}:`,
      error instanceof Error ? error.message : error
    );
    throw error;
  }
}

/**
 * Parse Mobula bars into chart-ready format
 */
export function parseMobulaChartData(
  history: any
): { labels: string[]; opens: number[]; highs: number[]; lows: number[]; closes: number[]; volumes: number[] } {
  if (!history?.bars || history.bars.length === 0) {
    return { labels: [], opens: [], highs: [], lows: [], closes: [], volumes: [] };
  }

  return {
    labels: history.bars.map((bar: any) =>
      new Date(bar.time * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: history.bars.length > 100 ? undefined : "2-digit",
      })
    ),
    opens: history.bars.map((bar: any) => bar.open),
    highs: history.bars.map((bar: any) => bar.high),
    lows: history.bars.map((bar: any) => bar.low),
    closes: history.bars.map((bar: any) => bar.close),
    volumes: history.bars.map((bar: any) => bar.volume),
  };
}

/**
 * Clear cache (for testing/manual refresh)
 */
export function clearMobulaCache(): void {
  CACHE_MAP.clear();
  console.log("[Mobula] Cache cleared");
}
