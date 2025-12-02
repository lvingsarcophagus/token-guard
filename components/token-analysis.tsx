import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown, DollarSign, BarChart3, Shield, Clock, Users } from "lucide-react"
import { CompleteTokenData } from "@/lib/token-scan-service"
import RiskExplanation from "@/components/risk-explanation"

interface TokenAnalysisProps {
  token: CompleteTokenData
  userTier?: "free" | "pro"
}

export default function TokenAnalysis({ token, userTier }: TokenAnalysisProps) {
  const { priceData, securityData } = token

  const getRiskLabel = (score: number) => {
    if (score >= 70) return "High Risk"
    if (score >= 40) return "Medium Risk"
    return "Low Risk"
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  const formatPrice = (num: number) => {
    if (num < 0.000001) return `$${num.toExponential(4)}`
    if (num < 0.01) return `$${num.toFixed(6)}`
    if (num < 1) return `$${num.toFixed(4)}`
    return `$${num.toFixed(2)}`
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Token Info */}
      <div className="bg-black/60 backdrop-blur-lg border border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 border border-white/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-px bg-white"></div>
                <h2 className="text-xl lg:text-2xl font-bold text-white font-mono tracking-wider">
                  {priceData?.name?.toUpperCase() || "TOKEN ANALYSIS"}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-white/60">{priceData?.symbol || token.address}</span>
                <span className="text-white/40">•</span>
                <span className="text-white/40">CHAIN: {token.chainInfo?.chainName?.toUpperCase() || 'AUTO-DETECTED'}</span>
                {priceData?.source && (
                  <>
                    <span className="text-white/40">•</span>
                    <span className="text-white/60">SOURCE: {priceData.source.toUpperCase()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-white/40" />
            <span className="text-xs text-white/60 font-mono">
              {new Date(token.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* AI-Powered Risk Explanation - Full Width */}
      {securityData && (
        <RiskExplanation
          riskScore={securityData.riskScore}
          riskLevel={securityData.riskLevel}
          aiInsights={(token as any).ai_insights || (securityData as any).ai_insights}
          aiSummary={(token as any).ai_summary || (securityData as any).ai_summary}
          criticalFlags={(token as any).critical_flags || (securityData as any).critical_flags || []}
          isPremium={userTier === "pro"}
        />
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Price Info Card */}
          {priceData && (
            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 font-mono tracking-wider text-sm">
                  <DollarSign className="w-4 h-4 text-white" />
                  MARKET DATA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-black/40 border border-white/20">
                    <div className="text-xs text-white/60 mb-1 font-mono">PRICE</div>
                    <div className="text-xl lg:text-2xl font-bold text-white font-mono">{formatPrice(priceData.price)}</div>
                  </div>

                  <div className="p-4 bg-black/40 border border-white/20">
                    <div className="text-xs text-white/60 mb-1 flex items-center gap-1 font-mono">
                      24H CHANGE
                    </div>
                    <div className={`text-xl lg:text-2xl font-bold flex items-center gap-1 font-mono ${
                      priceData.priceChange24h >= 0 ? "text-white" : "text-white"
                    }`}>
                      {priceData.priceChange24h >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {priceData.priceChange24h >= 0 ? "+" : ""}
                      {priceData.priceChange24h.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-black/40 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-3 h-3 text-white" />
                      <div className="text-xs text-white/60 font-mono">MARKET CAP</div>
                    </div>
                    <div className="text-lg font-bold text-white font-mono">{formatNumber(priceData.marketCap)}</div>
                  </div>

                  <div className="p-4 bg-black/40 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-3 h-3 text-white" />
                      <div className="text-xs text-white/60 font-mono">24H VOLUME</div>
                    </div>
                    <div className="text-lg font-bold text-white font-mono">{formatNumber(priceData.volume24h)}</div>
                  </div>
                </div>

                {priceData.liquidity && (
                  <div className="p-4 bg-black/40 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-3 h-3 text-white" />
                      <div className="text-xs text-white/60 font-mono">LIQUIDITY</div>
                    </div>
                    <div className="text-lg font-bold text-white font-mono">{formatNumber(priceData.liquidity)}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Risk Score Card */}
          {securityData && (
            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 font-mono tracking-wider text-sm">
                  <Shield className="w-4 h-4 text-white" />
                  SECURITY ANALYSIS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xs text-white/60 mb-2 font-mono">OVERALL RISK SCORE</div>
                    <div className="text-4xl lg:text-5xl font-bold text-white mb-2 font-mono">
                      {securityData.riskScore}
                      <span className="text-xl text-white/40">/100</span>
                    </div>
                    <div className="text-base font-bold text-white font-mono tracking-wider">
                      {getRiskLabel(securityData.riskScore).toUpperCase()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {securityData.isHoneypot && (
                      <div className="px-3 py-2 bg-black/40 border-2 border-white text-white text-xs font-bold flex items-center gap-2 font-mono">
                        <AlertTriangle className="w-3 h-3" />
                        HONEYPOT
                      </div>
                    )}
                    {securityData.isVerified && (
                      <div className="px-3 py-2 bg-black/40 border-2 border-white text-white text-xs font-bold flex items-center gap-2 font-mono">
                        <CheckCircle className="w-3 h-3" />
                        VERIFIED
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-white/60 font-mono">
                    <span>RISK LEVEL</span>
                    <span>{securityData.riskLevel.toUpperCase()}</span>
                  </div>
                  <div className="h-1 bg-black/40 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-500"
                      style={{ width: `${securityData.riskScore}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Safety Checks */}
          {securityData && securityData.safetyChecks && (
            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono tracking-wider text-sm">SAFETY CHECKS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityData.safetyChecks.map((check, index) => {
                    const Icon =
                      check.status === "safe" ? CheckCircle : check.status === "warning" ? AlertTriangle : XCircle

                    return (
                      <div key={index} className="flex items-start gap-3 p-4 bg-black/40 border border-white/20 transition-all hover:border-white/40">
                        <Icon className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-white font-bold mb-1 text-xs font-mono tracking-wider">{check.label.toUpperCase()}</div>
                          <div className="text-xs text-white/60 font-mono">{check.message.toUpperCase()}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Issues List - Full Width */}
      {securityData && securityData.issues && securityData.issues.length > 0 && (
        <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 font-mono tracking-wider text-sm">
              <AlertTriangle className="w-4 h-4 text-white" />
              DETECTED ISSUES ({securityData.issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {securityData.issues.map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-black/40 border border-white/20">
                  <XCircle className="w-3 h-3 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-white/80 font-mono">{issue.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
