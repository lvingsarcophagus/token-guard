'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  Lock,
  Unlock,
  Info,
  ExternalLink,
  ArrowLeft,
  Zap,
  Target,
  Clock,
  BarChart3
} from 'lucide-react'
import { TokenScanService, CompleteTokenData } from '@/lib/token-scan-service'
import type { RiskResult } from '@/lib/types/token-data'

export default function ScanPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokenData, setTokenData] = useState<CompleteTokenData | null>(null)
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null)

  const handleSearch = async () => {
    if (!search.trim()) {
      setError('PLEASE ENTER A TOKEN ADDRESS OR SYMBOL')
      return
    }

    setLoading(true)
    setError('')
    setTokenData(null)
    setRiskResult(null)

    try {
      const query = search.trim()
      const data = await TokenScanService.scanToken(query)

      if (!data.priceData && !data.securityData) {
        setError('TOKEN NOT FOUND. PLEASE CHECK THE ADDRESS OR SYMBOL.')
        setLoading(false)
        return
      }

      setTokenData(data)

      // If it's an EVM address, get risk analysis
      if (query.startsWith('0x') && query.length === 42) {
        try {
          const res = await fetch('/api/analyze-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokenAddress: query,
              chainId: data.chain,
              userId: user?.uid || 'anonymous',
              plan: userProfile?.plan || 'FREE',
            }),
          })

          if (res.ok) {
            const result = await res.json()
            setRiskResult(result)
          }
        } catch (err) {
          console.error('Risk analysis failed:', err)
        }
      }
    } catch (err: any) {
      setError(err.message || 'SCAN FAILED. PLEASE TRY AGAIN.')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-500'
    if (score < 50) return 'text-yellow-500'
    if (score < 75) return 'text-orange-500'
    return 'text-red-500'
  }

  const getRiskLevel = (score: number) => {
    if (score < 30) return 'LOW RISK'
    if (score < 50) return 'MEDIUM RISK'
    if (score < 75) return 'HIGH RISK'
    return 'CRITICAL RISK'
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background */}
      <div className="fixed inset-0 stars-bg pointer-events-none opacity-30"></div>
      <div className="fixed inset-0 grid-pattern pointer-events-none opacity-20"></div>

      {/* Navbar */}
      <nav className="border-b border-white/20 bg-black/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <img src="/tokenomics-lab-logo.ico" alt="Tokenomics Lab" className="w-8 h-8 object-contain" />
              <span className="text-white font-mono font-bold tracking-wider text-lg">
                TOKENOMICS LAB
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href={userProfile?.plan === 'PREMIUM' ? '/premium' : '/free-dashboard'}
                className="flex items-center gap-2 px-4 py-2 bg-transparent border border-white/30 text-white font-mono text-xs tracking-wider hover:bg-white hover:text-black transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                DASHBOARD
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative px-4 lg:px-8 py-12 max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 opacity-60">
            <div className="w-8 h-px bg-white"></div>
            <span className="text-white text-[10px] font-mono tracking-wider">SECURITY ANALYSIS</span>
            <div className="flex-1 h-px bg-white"></div>
          </div>

          <h1 className="text-3xl lg:text-5xl font-bold text-white font-mono tracking-wider mb-4">
            TOKEN SCANNER
          </h1>
          <p className="text-white/60 font-mono text-xs">
            REAL-TIME TOKEN SECURITY ANALYSIS
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-12 max-w-3xl">
          <div className="border border-white/30 bg-black/50 backdrop-blur-sm">
            <div className="flex items-center gap-4 p-6">
              <Search className="w-6 h-6 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="ENTER TOKEN ADDRESS (0x...) OR SYMBOL (BTC, ETH, SOL)..."
                className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder:text-white/30"
              />
              <button
                onClick={handleSearch}
                disabled={loading || !search.trim()}
                className="px-6 py-3 bg-white text-black font-mono text-xs tracking-wider hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'SCANNING...' : 'ANALYZE'}
              </button>
            </div>
          </div>

          {/* Example Buttons */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-white/40 font-mono text-[10px]">TRY:</span>
            {['BTC', 'ETH', 'SOL', '0xdac17f958d2ee523a2206206994597c13d831ec7'].map((example) => (
              <button
                key={example}
                onClick={() => setSearch(example)}
                className="px-3 py-1 bg-transparent border border-white/20 text-white/60 font-mono text-[10px] hover:bg-white/10 transition-all"
              >
                {example.length > 20 ? example.slice(0, 10) + '...' + example.slice(-6) : example}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 border border-red-500/50 bg-red-500/10 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-red-500 font-mono text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {tokenData && (
          <div className="space-y-6">

            {/* Token Info Header */}
            <div className="border border-white/30 bg-black/50 backdrop-blur-sm p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-white/60" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white font-mono tracking-wider">
                      {tokenData.priceData?.name || 'UNKNOWN TOKEN'}
                    </h2>
                    <p className="text-white/60 font-mono text-sm mt-1">
                      {tokenData.priceData?.symbol?.toUpperCase()}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-white/10 border border-white/20 text-white/60 font-mono text-[10px]">
                        {tokenData.chain?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {tokenData.priceData?.price && (
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white font-mono">
                      ${tokenData.priceData.price.toLocaleString()}
                    </p>
                    {tokenData.priceData.priceChange24h !== undefined && (
                      <div className={`flex items-center gap-1 justify-end mt-1 ${tokenData.priceData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                        {tokenData.priceData.priceChange24h >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-mono text-sm">
                          {Math.abs(tokenData.priceData.priceChange24h).toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Risk Score (if available) */}
            {riskResult && (
              <div className="border border-white/30 bg-black/50 backdrop-blur-sm p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-5 h-5 text-white" />
                  <h3 className="text-xl font-bold text-white font-mono tracking-wider">
                    RISK ASSESSMENT
                  </h3>
                </div>

                <div className="text-center mb-8">
                  <div className={`text-6xl font-bold font-mono mb-2 ${getRiskColor(riskResult.overall_risk_score)}`}>
                    {riskResult.overall_risk_score}
                  </div>
                  <div className={`text-xl font-mono tracking-wider ${getRiskColor(riskResult.overall_risk_score)}`}>
                    {getRiskLevel(riskResult.overall_risk_score)}
                  </div>
                </div>

                {/* Risk Flags and Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Critical Flags */}
                  {riskResult.critical_flags && riskResult.critical_flags.length > 0 && (
                    <div className="border border-red-500/30 bg-black/30 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 mt-0.5 text-red-500" />
                        <div className="flex-1">
                          <p className="text-white font-mono text-sm font-bold mb-2">
                            Critical Alerts
                          </p>
                          <ul className="space-y-1">
                            {riskResult.critical_flags.map((flag, index) => (
                              <li key={index} className="text-white/60 font-mono text-xs">
                                • {flag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detailed Insights */}
                  {riskResult.detailed_insights && riskResult.detailed_insights.length > 0 && (
                    <div className="border border-white/20 bg-black/30 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 mt-0.5 text-white/70" />
                        <div className="flex-1">
                          <p className="text-white font-mono text-sm font-bold mb-2">
                            Risk Insights
                          </p>
                          <ul className="space-y-1">
                            {riskResult.detailed_insights.map((insight, index) => (
                              <li key={index} className="text-white/60 font-mono text-xs">
                                • {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Market Data */}
            {tokenData.priceData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tokenData.priceData.marketCap && (
                  <div className="border border-white/20 bg-black/30 p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-white/60" />
                      <p className="text-white/60 font-mono text-xs">MARKET CAP</p>
                    </div>
                    <p className="text-2xl font-bold text-white font-mono">
                      ${(tokenData.priceData.marketCap / 1000000).toFixed(2)}M
                    </p>
                  </div>
                )}

                {tokenData.priceData.volume24h && (
                  <div className="border border-white/20 bg-black/30 p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-white/60" />
                      <p className="text-white/60 font-mono text-xs">24H VOLUME</p>
                    </div>
                    <p className="text-2xl font-bold text-white font-mono">
                      ${(tokenData.priceData.volume24h / 1000000).toFixed(2)}M
                    </p>
                  </div>
                )}

                {tokenData.priceData.priceChange24h !== undefined && (
                  <div className="border border-white/20 bg-black/30 p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-white/60" />
                      <p className="text-white/60 font-mono text-xs">24H CHANGE</p>
                    </div>
                    <p className={`text-2xl font-bold font-mono ${tokenData.priceData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {tokenData.priceData.priceChange24h >= 0 ? '+' : ''}{tokenData.priceData.priceChange24h.toFixed(2)}%
                    </p>
                  </div>
                )}

                {tokenData.priceData.liquidity && (
                  <div className="border border-white/20 bg-black/30 p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-white/60" />
                      <p className="text-white/60 font-mono text-xs">LIQUIDITY</p>
                    </div>
                    <p className="text-2xl font-bold text-white font-mono">
                      ${(tokenData.priceData.liquidity / 1000000).toFixed(2)}M
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Security Data */}
            {tokenData.securityData && (
              <div className="border border-white/30 bg-black/50 backdrop-blur-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Lock className="w-5 h-5 text-white" />
                  <h3 className="text-xl font-bold text-white font-mono tracking-wider">
                    SECURITY CHECKS
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(tokenData.securityData).map(([key, value]) => {
                    if (typeof value === 'boolean' || typeof value === 'string') {
                      const isGood = value === false || value === '0' || value === 'false'
                      return (
                        <div key={key} className="flex items-center gap-3 border border-white/10 bg-black/20 p-3">
                          {isGood ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-white font-mono text-xs">
                              {key.replace(/_/g, ' ').toUpperCase()}
                            </p>
                            <p className={`font-mono text-[10px] mt-1 ${isGood ? 'text-green-500' : 'text-red-500'}`}>
                              {String(value).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  )
}
