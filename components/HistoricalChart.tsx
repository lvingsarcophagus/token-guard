/**
 * Historical Chart Component
 * Displays OHLCV data using Recharts
 */

"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import type { HistoricalChartData } from "@/lib/risk-engine/utils/historicalCharts";
import {
  getHistoricalChartData,
  isChartDataValid,
  getChartSummary,
  getVolatilityRiskScore,
} from "@/lib/risk-engine/utils/historicalCharts";

interface HistoricalChartProps {
  tokenAddress: string;
  chain: string;
  days?: number;
  userPlan?: "free" | "pro" | "premium";
  onVolatilityChange?: (volatilityScore: number) => void;
}

export const HistoricalChart: React.FC<HistoricalChartProps> = ({
  tokenAddress,
  chain,
  days = 7,
  userPlan = "free",
  onVolatilityChange,
}) => {
  const [chartData, setChartData] = useState<HistoricalChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch historical data
  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        `[HistoricalChart] Fetching data for ${tokenAddress} on ${chain}`
      );

      const data = await getHistoricalChartData(
        tokenAddress,
        chain,
        days,
        userPlan
      );

      setChartData(data);

      // Notify parent of volatility score
      if (onVolatilityChange) {
        const riskScore = getVolatilityRiskScore(data.volatility);
        onVolatilityChange(riskScore);
      }

      if (!isChartDataValid(data)) {
        setError(getChartSummary(data));
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch chart data";
      console.error("[HistoricalChart] Error:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, chain, days, userPlan, onVolatilityChange]);

  // Fetch data on mount or when dependencies change
  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-gray-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading historical data...</p>
        </div>
      </div>
    );
  }

  if (error || !isChartDataValid(chartData!)) {
    return (
      <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h4 className="font-semibold text-yellow-900">
              Historical Data Unavailable
            </h4>
            <p className="text-sm text-yellow-800 mt-1">
              {error || getChartSummary(chartData!)}
            </p>
            {chartData?.warnings && chartData.warnings.length > 0 && (
              <ul className="text-xs text-yellow-700 mt-2 list-disc list-inside">
                {chartData.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!error && isChartDataValid(chartData!)) {
    // Prepare data for Recharts
    const chartData_formatted = chartData!.labels.map((label, idx) => ({
      time: label,
      close: chartData!.closes[idx] || 0,
      high: chartData!.highs[idx] || 0,
      low: chartData!.lows[idx] || 0,
      open: chartData!.opens[idx] || 0,
    }));

    // Calculate volatility risk level
    const volatilityLevel =
      chartData!.volatility < 5
        ? "Low"
        : chartData!.volatility < 15
          ? "Moderate"
          : chartData!.volatility < 30
            ? "High"
            : "Extreme";

    const volatilityColor =
      volatilityLevel === "Low"
        ? "text-green-600"
        : volatilityLevel === "Moderate"
          ? "text-yellow-600"
          : volatilityLevel === "High"
            ? "text-orange-600"
            : "text-red-600";

    return (
      <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Price History Chart
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {getChartSummary(chartData!)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-2">Data Quality</div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                chartData!.dataQuality === "EXCELLENT"
                  ? "bg-green-100 text-green-800"
                  : chartData!.dataQuality === "GOOD"
                    ? "bg-blue-100 text-blue-800"
                    : chartData!.dataQuality === "MODERATE"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
              }`}
            >
              {chartData!.dataQuality}
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full h-96 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData_formatted}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "12px",
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(value: number) => [
                  `$${value.toFixed(6)}`,
                  "Price",
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="line"
                verticalAlign="top"
                height={36}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="Close Price"
              />
              <Line
                type="monotone"
                dataKey="high"
                stroke="rgba(239, 68, 68, 0.5)"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="High"
              />
              <Line
                type="monotone"
                dataKey="low"
                stroke="rgba(34, 197, 94, 0.5)"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Low"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Statistics Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div>
            <div className="text-xs text-gray-600 uppercase tracking-wider">
              Price Change
            </div>
            <p
              className={`text-lg font-semibold mt-1 ${
                chartData!.priceChangePercent >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {chartData!.priceChangePercent >= 0 ? "+" : ""}
              {chartData!.priceChangePercent.toFixed(2)}%
            </p>
          </div>

          <div>
            <div className="text-xs text-gray-600 uppercase tracking-wider">
              Volatility
            </div>
            <p className={`text-lg font-semibold mt-1 ${volatilityColor}`}>
              {chartData!.volatility.toFixed(1)}%
            </p>
            <p className={`text-xs mt-1 ${volatilityColor}`}>
              {volatilityLevel}
            </p>
          </div>

          <div>
            <div className="text-xs text-gray-600 uppercase tracking-wider">
              Data Points
            </div>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {chartData!.priceCount}
            </p>
          </div>

          <div>
            <div className="text-xs text-gray-600 uppercase tracking-wider">
              Source
            </div>
            <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
              {chartData!.source}
            </p>
          </div>
        </div>

        {/* Warnings */}
        {chartData!.warnings && chartData!.warnings.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Fetch Notes:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              {chartData!.warnings.map((warning, idx) => (
                <li key={idx}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
};

export default HistoricalChart;
