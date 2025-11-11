/**
 * Historical Charts Orchestrator
 * MAIN LOGIC: Tries Mobula first (better OHLCV), falls back to Moralis
 * 
 * Strategy:
 * 1. Mobula: Preferred - native OHLCV data
 * 2. Moralis: Fallback - price snapshots → reconstructed OHLCV
 * 3. Combined result with data quality scoring
 */

import {
  getMobulaHistorical,
  parseMobulaChartData,
  clearMobulaCache,
} from "../../apis/historical/mobula-historical";
import {
  getMoralisHistorical,
  parseMoralisChartData,
  clearMoralisCache,
} from "../../apis/historical/moralis-historical";

export interface HistoricalChartData {
  labels: string[]; // Time labels
  opens: number[]; // Opening prices
  highs: number[]; // Highest prices
  lows: number[]; // Lowest prices
  closes: number[]; // Closing prices
  volumes?: number[]; // Trading volumes (if available)
  source: "mobula" | "moralis" | "combined";
  dataQuality: "EXCELLENT" | "GOOD" | "MODERATE" | "POOR" | "UNAVAILABLE";
  priceCount: number;
  priceChangePercent: number; // (close - open) / open * 100
  volatility: number; // Standard deviation of closes / mean close * 100
  timeSpanDays: number;
  fetchedAt: number;
  warnings: string[];
}

/**
 * Calculate volatility (standard deviation)
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;

  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance =
    prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) /
    prices.length;
  const stdDev = Math.sqrt(variance);

  return (stdDev / mean) * 100; // As percentage
}

/**
 * Main orchestrator: Fetch historical data with fallback strategy
 */
export async function getHistoricalChartData(
  tokenAddress: string,
  chain: string,
  days: number = 7,
  userPlan: "free" | "pro" | "premium" = "free"
): Promise<HistoricalChartData> {
  const warnings: string[] = [];
  let data: HistoricalChartData | null = null;

  // Step 1: Try Mobula (preferred, has native OHLCV)
  try {
    console.log("[HistoricalChart] Attempting Mobula fetch...");
    const mobulaResult = await getMobulaHistorical(tokenAddress, chain, days);
    const parsed = parseMobulaChartData(mobulaResult);

    if (parsed.closes.length === 0) {
      warnings.push("Mobula returned empty dataset");
    } else {
      const volatility = calculateVolatility(parsed.closes);
      const priceChange =
        ((parsed.closes[parsed.closes.length - 1] - parsed.closes[0]) /
          parsed.closes[0]) *
        100;

      data = {
        labels: parsed.labels,
        opens: parsed.opens,
        highs: parsed.highs,
        lows: parsed.lows,
        closes: parsed.closes,
        volumes: parsed.volumes,
        source: "mobula",
        dataQuality:
          mobulaResult.dataQuality === "EXCELLENT"
            ? "EXCELLENT"
            : mobulaResult.dataQuality === "GOOD"
              ? "GOOD"
              : "MODERATE",
        priceCount: parsed.closes.length,
        priceChangePercent: priceChange,
        volatility,
        timeSpanDays: days,
        fetchedAt: Date.now(),
        warnings,
      };

      console.log("[HistoricalChart] ✓ Mobula fetch successful");
      return data;
    }
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : String(error);
    console.warn("[HistoricalChart] Mobula fetch failed:", errorMsg);
    warnings.push(`Mobula failed: ${errorMsg}`);
  }

  // Step 2: Fallback to Moralis
  try {
    console.log("[HistoricalChart] Falling back to Moralis...");
    const moralisResult = await getMoralisHistorical(tokenAddress, chain, days);
    const parsed = parseMoralisChartData(moralisResult);

    if (parsed.closes.length === 0) {
      warnings.push("Moralis returned empty dataset");
      throw new Error("No price data available");
    }

    const volatility = calculateVolatility(parsed.closes);
    const priceChange =
      ((parsed.closes[parsed.closes.length - 1] - parsed.closes[0]) /
        parsed.closes[0]) *
      100;

    data = {
      labels: parsed.labels,
      opens: parsed.opens,
      highs: parsed.highs,
      lows: parsed.lows,
      closes: parsed.closes,
      source: "moralis",
      dataQuality:
        moralisResult.dataQuality === "GOOD"
          ? "GOOD"
          : moralisResult.dataQuality === "MODERATE"
            ? "MODERATE"
            : "POOR",
      priceCount: parsed.closes.length,
      priceChangePercent: priceChange,
      volatility,
      timeSpanDays: days,
      fetchedAt: Date.now(),
      warnings,
    };

    console.log("[HistoricalChart] ✓ Moralis fetch successful");
    return data;
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : String(error);
    console.warn("[HistoricalChart] Moralis fetch also failed:", errorMsg);
    warnings.push(`Moralis failed: ${errorMsg}`);
  }

  // Step 3: Both failed - return unavailable
  return {
    labels: [],
    opens: [],
    highs: [],
    lows: [],
    closes: [],
    source: "combined",
    dataQuality: "UNAVAILABLE",
    priceCount: 0,
    priceChangePercent: 0,
    volatility: 0,
    timeSpanDays: days,
    fetchedAt: Date.now(),
    warnings: [
      ...warnings,
      "Both Mobula and Moralis failed. Token may be too new (<1 day) or unsupported.",
    ],
  };
}

/**
 * Calculate volatility score for risk algorithm (0-100)
 * Input: volatility percentage (from calculateVolatility)
 * Output: Risk score (0=stable, 100=extremely volatile)
 */
export function getVolatilityRiskScore(volatility: number): number {
  // Map volatility % to risk score
  // 0-5% volatility = low risk (0-20)
  // 5-15% volatility = moderate risk (20-60)
  // 15-30% volatility = high risk (60-85)
  // >30% volatility = extreme risk (85-100)

  if (volatility <= 5) {
    return Math.min(20, (volatility / 5) * 20);
  } else if (volatility <= 15) {
    return 20 + ((volatility - 5) / 10) * 40;
  } else if (volatility <= 30) {
    return 60 + ((volatility - 15) / 15) * 25;
  } else {
    return Math.min(100, 85 + ((volatility - 30) / 30) * 15);
  }
}

/**
 * Validate chart data quality
 */
export function isChartDataValid(data: HistoricalChartData): boolean {
  return (
    data.dataQuality !== "UNAVAILABLE" &&
    data.closes.length > 0 &&
    data.labels.length === data.closes.length
  );
}

/**
 * Get human-readable summary
 */
export function getChartSummary(data: HistoricalChartData): string {
  if (!isChartDataValid(data)) {
    return `⚠️ Historical data unavailable. ${data.warnings.join(" ")}`;
  }

  const direction = data.priceChangePercent >= 0 ? "📈" : "📉";
  const change = Math.abs(data.priceChangePercent).toFixed(2);
  const volatilityLabel =
    data.volatility < 5
      ? "stable"
      : data.volatility < 15
        ? "moderate"
        : data.volatility < 30
          ? "high"
          : "extreme";

  return `${direction} ${change}% over ${data.timeSpanDays}D • ${data.priceCount} samples • ${volatilityLabel} volatility (${data.volatility.toFixed(1)}%)`;
}

/**
 * Clear all caches (for testing/manual refresh)
 */
export function clearAllHistoricalCaches(): void {
  clearMobulaCache();
  clearMoralisCache();
  console.log("[HistoricalChart] All caches cleared");
}

/**
 * Format chart data for Chart.js library
 */
export function formatForChartJS(data: HistoricalChartData): {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor?: string;
    fill: boolean;
    tension: number;
  }>;
} {
  return {
    labels: data.labels,
    datasets: [
      {
        label: "Close Price",
        data: data.closes,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "High",
        data: data.highs,
        borderColor: "rgba(255, 99, 132, 0.5)",
        fill: false,
        tension: 0.4,
      },
      {
        label: "Low",
        data: data.lows,
        borderColor: "rgba(54, 162, 235, 0.5)",
        fill: false,
        tension: 0.4,
      },
    ],
  };
}
