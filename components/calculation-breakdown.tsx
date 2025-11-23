'use client'

import { Shield, AlertTriangle, CheckCircle, Info, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface CalculationBreakdownProps {
  breakdown: {
    supplyDilution: number
    holderConcentration: number
    liquidityDepth: number
    vestingUnlock: number
    contractControl: number
    taxFee: number
    distribution: number
    burnDeflation: number
    adoption: number
    auditTransparency: number
  }
  overallScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  chain?: string
  isMeme?: boolean
  dataSources?: string[]
  missingData?: string[]
}

export default function CalculationBreakdown({
  breakdown,
  overallScore,
  riskLevel,
  chain = 'ETHEREUM',
  isMeme = false,
  dataSources = [],
  missingData = []
}: CalculationBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const factors = [
    { name: 'Supply Dilution', key: 'supplyDilution', weight: 18, description: 'FDV/Market Cap ratio and mintability' },
    { name: 'Holder Concentration', key: 'holderConcentration', weight: 16, description: 'Top holders control percentage' },
    { name: 'Liquidity Depth', key: 'liquidityDepth', weight: 14, description: 'DEX liquidity and lock status' },
    { name: 'Vesting Unlock', key: 'vestingUnlock', weight: 13, description: 'Upcoming token releases' },
    { name: 'Contract Control', key: 'contractControl', weight: 12, description: 'Ownership and authorities' },
    { name: 'Tax/Fee Structure', key: 'taxFee', weight: 10, description: 'Buy/sell taxes' },
    { name: 'Distribution', key: 'distribution', weight: 9, description: 'Initial allocation fairness' },
    { name: 'Burn/Deflation', key: 'burnDeflation', weight: 8, description: 'Token burn mechanisms' },
    { name: 'Adoption', key: 'adoption', weight: 7, description: 'Usage and activity metrics' },
    { name: 'Audit/Transparency', key: 'auditTransparency', weight: 3, description: 'Contract verification' }
  ]

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-red-500'
    if (score >= 50) return 'text-orange-500'
    if (score >= 35) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getRiskBgColor = (score: number) => {
    if (score >= 75) return 'bg-red-500/10 border-red-500/30'
    if (score >= 50) return 'bg-orange-500/10 border-orange-500/30'
    if (score >= 35) return 'bg-yellow-500/10 border-yellow-500/30'
    return 'bg-green-500/10 border-green-500/30'
  }

  return (
    <div className="border border-white/10 bg-black/40 backdrop-blur-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-white/60" />
          <h3 className="text-white font-mono text-sm tracking-wider">RISK CALCULATION BREAKDOWN</h3>
        </div>
        <ChevronDown className={`w-5 h-5 text-white/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Overall Score */}
          <div className={`border p-4 ${getRiskBgColor(overallScore)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 font-mono text-xs">FINAL RISK SCORE</span>
              <span className={`font-mono text-2xl font-bold ${getRiskColor(overallScore)}`}>
                {overallScore}/100
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${overallScore >= 75 ? 'bg-red-500' :
                    overallScore >= 50 ? 'bg-orange-500' :
                      overallScore >= 35 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                  style={{ width: `${overallScore}%` }}
                />
              </div>
              <span className={`font-mono text-xs font-bold ${getRiskColor(overallScore)}`}>
                {riskLevel}
              </span>
            </div>
          </div>

          {/* Chain & Classification Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-white/10 bg-white/5 p-3">
              <div className="text-white/60 font-mono text-[10px] mb-1">BLOCKCHAIN</div>
              <div className="text-white font-mono text-xs">{chain}</div>
            </div>
            <div className="border border-white/10 bg-white/5 p-3">
              <div className="text-white/60 font-mono text-[10px] mb-1">CLASSIFICATION</div>
              <div className="text-white font-mono text-xs">
                {isMeme ? 'MEME TOKEN (+15 baseline)' : 'UTILITY TOKEN'}
              </div>
            </div>
          </div>

          {/* Data Sources */}
          {dataSources.length > 0 && (
            <div className="border border-blue-500/30 bg-blue-500/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-mono text-[10px]">DATA SOURCES</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dataSources.map((source, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 font-mono text-[9px]">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Data Warning */}
          {missingData.length > 0 && (
            <div className="border border-yellow-500/30 bg-yellow-500/10 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-mono text-[10px]">MISSING DATA</span>
              </div>
              <ul className="space-y-1">
                {missingData.map((item, i) => (
                  <li key={i} className="text-yellow-300 font-mono text-[9px]">• {item}</li>
                ))}
              </ul>
              <p className="text-yellow-400/80 font-mono text-[9px] mt-2">
                Missing data may result in conservative (higher) risk scores
              </p>
            </div>
          )}

          {/* Factor Breakdown */}
          <div className="space-y-2">
            <h4 className="text-white/80 font-mono text-[10px] tracking-wider mb-3">
              10-FACTOR ANALYSIS (Weighted)
            </h4>
            {factors.map((factor) => {
              const score = breakdown[factor.key as keyof typeof breakdown]
              const weightedContribution = (score * factor.weight) / 100

              return (
                <div key={factor.key} className="border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono text-xs">{factor.name}</span>
                        <span className="text-white/40 font-mono text-[9px]">({factor.weight}% weight)</span>
                      </div>
                      <p className="text-white/60 font-mono text-[9px] mt-0.5">{factor.description}</p>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-sm font-bold ${getRiskColor(score)}`}>
                        {score}/100
                      </div>
                      <div className="text-white/40 font-mono text-[9px]">
                        +{weightedContribution.toFixed(1)} pts
                      </div>
                    </div>
                  </div>
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${score >= 75 ? 'bg-red-500' :
                        score >= 50 ? 'bg-orange-500' :
                          score >= 35 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Calculation Formula */}
          <div className="border border-white/10 bg-black/40 p-3">
            <div className="text-white/60 font-mono text-[10px] mb-2">FORMULA</div>
            <code className="block text-cyan-400 font-mono text-[9px] leading-relaxed">
              Risk Score = Σ(Factor Score × Weight) + Modifiers
              <br />
              <br />
              Modifiers:
              <br />
              • Meme Token: +15 baseline
              <br />
              • Top 1 Holder ≥40%: Force to 94
              <br />
              • 3+ Critical Flags: Min score 75
              <br />
              • Official Token: -45 points
              <br />
              • Dead Token: Force to 90+
            </code>
          </div>
        </div>
      )}
    </div>
  )
}
