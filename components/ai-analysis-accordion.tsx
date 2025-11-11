'use client';

import React, { useState } from 'react';
import { ChevronDown, AlertTriangle, TrendingUp, Zap, Target } from 'lucide-react';
import type { RiskResult } from '@/lib/types/token-data';

interface AIAnalysisAccordionProps {
  aiSummary: RiskResult['ai_summary'];
  tokenName: string;
  riskLevel: string;
}

export default function AIAnalysisAccordion({
  aiSummary,
  tokenName,
  riskLevel,
}: AIAnalysisAccordionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!aiSummary) {
    return null;
  }

  const getRiskColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
        return 'from-red-900/20 to-red-900/5 border-red-500/30';
      case 'HIGH':
        return 'from-orange-900/20 to-orange-900/5 border-orange-500/30';
      case 'MEDIUM':
        return 'from-yellow-900/20 to-yellow-900/5 border-yellow-500/30';
      case 'LOW':
        return 'from-green-900/20 to-green-900/5 border-green-500/30';
      default:
        return 'from-gray-900/20 to-gray-900/5 border-gray-500/30';
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'BUY':
        return 'text-green-400 bg-green-400/10';
      case 'AVOID':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-yellow-400 bg-yellow-400/10';
    }
  };

  const recommendationText = aiSummary.recommendation.replace(/_/g, ' ');

  return (
    <div
      className={`border rounded-lg overflow-hidden bg-gradient-to-br ${getRiskColor(
        riskLevel
      )} mb-4`}
    >
      {/* Header - Collapsible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">🤖</div>
          <div className="text-left">
            <h3 className="text-gray-200 font-mono text-sm font-bold tracking-wider">
              AI ANALYSIS
            </h3>
            <p className="text-gray-400 font-mono text-xs mt-1 line-clamp-1">
              {aiSummary.executive_summary.substring(0, 50)}...
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            expanded ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Expandable Content */}
      {expanded && (
        <div className="border-t border-white/10 bg-black/40">
          <div className="p-4 space-y-6">
            {/* A: Executive Summary */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-gray-400" />
                <h4 className="text-gray-300 font-mono text-xs font-bold tracking-wider">
                  EXECUTIVE SUMMARY
                </h4>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed pl-6">
                {aiSummary.executive_summary}
              </p>
              <div className={`mt-3 pl-6 inline-block px-3 py-1 rounded text-xs font-mono ${getRecommendationColor(aiSummary.recommendation)}`}>
                → {recommendationText}
              </div>
            </div>

            {/* Classification & Confidence */}
            <div className="grid grid-cols-2 gap-4 bg-black/20 p-3 rounded">
              <div>
                <span className="text-gray-500 font-mono text-[10px] block mb-1">
                  TOKEN CLASSIFICATION
                </span>
                <span className="text-gray-200 font-mono text-sm">
                  {aiSummary.classification.type === 'MEME_TOKEN'
                    ? '🎭 MEME TOKEN'
                    : '🏢 UTILITY TOKEN'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 font-mono text-[10px] block mb-1">
                  CONFIDENCE
                </span>
                <span className="text-gray-200 font-mono text-sm">
                  {aiSummary.classification.confidence}%
                </span>
              </div>
            </div>

            {/* B: Factor Explanations */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <h4 className="text-gray-300 font-mono text-xs font-bold tracking-wider">
                  RISK FACTOR BREAKDOWN
                </h4>
              </div>
              <div className="space-y-2 pl-6">
                {Object.entries(aiSummary.factor_explanations).slice(0, 5).map(([factor, explanation]) => (
                  <div key={factor} className="bg-black/20 p-2 rounded text-xs">
                    <span className="text-gray-400 font-mono block mb-1 capitalize">
                      {factor.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-300 block text-[11px] leading-relaxed">
                      {explanation}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* C: Top Risk Factors */}
            {aiSummary.top_risk_factors && aiSummary.top_risk_factors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                  <h4 className="text-gray-300 font-mono text-xs font-bold tracking-wider">
                    TOP RISK FACTORS
                  </h4>
                </div>
                <div className="space-y-3 pl-6">
                  {aiSummary.top_risk_factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="border border-red-500/20 bg-red-500/10 p-3 rounded"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-red-300 font-mono text-sm font-bold capitalize">
                          {idx + 1}. {factor.name.replace(/_/g, ' ')}
                        </span>
                        <span className="text-red-400 font-mono text-xs font-bold">
                          {factor.score}/100
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs mb-2 leading-relaxed">
                        {factor.explanation}
                      </p>
                      <div className="bg-black/30 p-2 rounded border border-red-500/20">
                        <p className="text-gray-400 text-[10px] font-mono">
                          <span className="text-red-400">Impact:</span> {factor.impact}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Insights */}
            {aiSummary.key_insights && aiSummary.key_insights.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-gray-400" />
                  <h4 className="text-gray-300 font-mono text-xs font-bold tracking-wider">
                    KEY INSIGHTS
                  </h4>
                </div>
                <ul className="space-y-2 pl-6">
                  {aiSummary.key_insights.map((insight, idx) => (
                    <li
                      key={idx}
                      className="text-gray-300 text-xs flex gap-2 leading-relaxed"
                    >
                      <span className="text-gray-500 font-mono">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Generated Time */}
            {aiSummary.generated_at && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-gray-500 font-mono text-[10px]">
                  Analysis generated: {new Date(aiSummary.generated_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
