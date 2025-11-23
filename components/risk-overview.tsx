'use client'

import { Shield, AlertTriangle, Sparkles } from 'lucide-react'

interface RiskOverviewProps {
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  confidence?: number
  aiClassification?: string
  aiConfidence?: number
  isMemeToken?: boolean
  memeBaseline?: number
}

export default function RiskOverview({
  riskScore,
  riskLevel,
  confidence = 95,
  aiClassification,
  aiConfidence,
  isMemeToken,
  memeBaseline
}: RiskOverviewProps) {
  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-500'
    if (score < 60) return 'text-yellow-500'
    if (score < 80) return 'text-orange-500'
    return 'text-red-500'
  }

  const getRiskBgColor = (score: number) => {
    if (score < 30) return 'bg-green-500/10 border-green-500/30'
    if (score < 60) return 'bg-yellow-500/10 border-yellow-500/30'
    if (score < 80) return 'bg-orange-500/10 border-orange-500/30'
    return 'bg-red-500/10 border-red-500/30'
  }

  return (
    <div className="border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <h3 className="text-white font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4" />
        RISK OVERVIEW
      </h3>

      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Risk Score */}
        <div className="border border-white/10 bg-black/20 p-4 text-center">
          <div className="text-white/60 font-mono text-[10px] tracking-wider mb-2">
            RISK SCORE
          </div>
          <div className={`font-mono text-4xl font-bold ${getRiskColor(riskScore)}`}>
            {riskScore}
          </div>
          <div className="text-white/40 font-mono text-[10px] mt-1">
            / 100
          </div>
        </div>

        {/* Risk Level */}
        <div className="border border-white/10 bg-black/20 p-4 text-center">
          <div className="text-white/60 font-mono text-[10px] tracking-wider mb-2">
            RISK LEVEL
          </div>
          <div className={`px-3 py-2 rounded border font-mono text-xs tracking-wider inline-block ${getRiskBgColor(riskScore)} ${getRiskColor(riskScore)}`}>
            {riskLevel}
          </div>
        </div>

        {/* Confidence */}
        <div className="border border-white/10 bg-black/20 p-4 text-center">
          <div className="text-white/60 font-mono text-[10px] tracking-wider mb-2">
            CONFIDENCE
          </div>
          <div className="text-cyan-400 font-mono text-4xl font-bold">
            {confidence}
          </div>
          <div className="text-white/40 font-mono text-[10px] mt-1">
            %
          </div>
        </div>
      </div>

      {/* AI Classification */}
      {aiClassification && (
        <div className={`border p-4 ${
          isMemeToken 
            ? 'border-purple-500/30 bg-purple-500/5' 
            : 'border-cyan-500/30 bg-cyan-500/5'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${isMemeToken ? 'text-purple-400' : 'text-cyan-400'}`} />
              <span className="text-white font-mono text-xs tracking-wider">
                AI CLASSIFICATION
              </span>
            </div>
            {aiConfidence && (
              <span className={`font-mono text-xs ${isMemeToken ? 'text-purple-400' : 'text-cyan-400'}`}>
                {aiConfidence}% CONFIDENCE
              </span>
            )}
          </div>
          
          <div className={`font-mono text-sm font-bold ${isMemeToken ? 'text-purple-400' : 'text-cyan-400'}`}>
            {aiClassification.replace(/_/g, ' ')}
          </div>

          {/* Meme Token Warning */}
          {isMemeToken && memeBaseline && (
            <div className="mt-3 pt-3 border-t border-purple-500/20 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-mono text-xs">
                MEME BASELINE APPLIED: +{memeBaseline} RISK POINTS
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
