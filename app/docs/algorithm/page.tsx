'use client'

import Link from 'next/link'
import Navbar from '@/components/navbar'
import { Shield, TrendingUp, Users, Lock, Droplet, Activity, AlertTriangle, CheckCircle, Zap, Database, ArrowLeft } from 'lucide-react'

export default function AlgorithmDocumentation() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black text-white pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="mb-16">
            <Link href="/docs" className="inline-flex items-center gap-2 mb-6 text-white/60 hover:text-white transition-colors font-mono text-sm group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              BACK TO DOCS
            </Link>
            
            <div className="flex items-center gap-2 mb-4 opacity-60">
              <div className="w-8 h-px bg-white"></div>
              <span className="text-white text-[10px] font-mono tracking-wider">DOCUMENTATION</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold font-mono tracking-wider mb-6 text-white">
              RISK ALGORITHM
            </h1>
            <p className="text-white/60 font-mono text-sm leading-relaxed max-w-3xl">
              Comprehensive documentation of our multi-chain token risk assessment algorithm. 
              Learn how we analyze 10+ risk factors across different blockchain networks to provide accurate security scores.
            </p>
          </div>

          {/* Overview */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold font-mono tracking-wider mb-6 text-white flex items-center gap-3">
              <Shield className="w-6 h-6" />
              ALGORITHM OVERVIEW
            </h2>
            <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-8 space-y-4">
              <p className="text-white/80 font-mono text-sm leading-relaxed">
                Our risk assessment algorithm is a sophisticated multi-factor analysis system that evaluates tokens across 
                multiple blockchain networks. It combines on-chain data, smart contract analysis, and market metrics to 
                generate a comprehensive risk score from 0-100.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="border border-white/20 bg-white/5 p-4">
                  <div className="text-green-400 font-mono text-2xl font-bold mb-2">0-30</div>
                  <div className="text-white/60 font-mono text-xs">LOW RISK</div>
                </div>
                <div className="border border-white/20 bg-white/5 p-4">
                  <div className="text-yellow-400 font-mono text-2xl font-bold mb-2">31-60</div>
                  <div className="text-white/60 font-mono text-xs">MEDIUM RISK</div>
                </div>
                <div className="border border-white/20 bg-white/5 p-4">
                  <div className="text-red-400 font-mono text-2xl font-bold mb-2">61-100</div>
                  <div className="text-white/60 font-mono text-xs">HIGH/CRITICAL</div>
                </div>
              </div>
            </div>
          </section>

          {/* Risk Factors */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold font-mono tracking-wider mb-6 text-white flex items-center gap-3">
              <Activity className="w-6 h-6" />
              10 RISK FACTORS
            </h2>
            
            {/* Contract Security */}
            <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-6 mb-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 border border-white/30 bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-mono text-lg font-bold mb-2">1. CONTRACT SECURITY</h3>
                  <p className="text-white/60 font-mono text-sm mb-3">
                    Analyzes smart contract code for vulnerabilities, malicious functions, and security risks.
                  </p>
                  <div className="space-y-2 text-white/70 font-mono text-xs">
                    <div>• <span className="text-white/90">Honeypot Detection:</span> Checks if tokens can be sold after purchase</div>
                    <div>• <span className="text-white/90">Ownership Analysis:</span> Verifies if contract ownership is renounced</div>
                    <div>• <span className="text-white/90">Proxy Contracts:</span> Identifies upgradeable contracts that could be modified</div>
                    <div>• <span className="text-white/90">Hidden Functions:</span> Scans for mint, burn, or blacklist capabilities</div>
                  </div>
                  <div className="mt-4 p-3 bg-white/5 border border-white/10">
                    <div className="text-white/50 font-mono text-xs mb-1">WEIGHT: 25%</div>
                    <div className="text-white/80 font-mono text-xs">Highest priority factor - critical for token safety</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Liquidity */}
            <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-6 mb-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 border border-white/30 bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Droplet className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-mono text-lg font-bold mb-2">2. LIQUIDITY</h3>
                  <p className="text-white/60 font-mono text-sm mb-3">
                    Evaluates available liquidity and lock status to prevent rug pulls.
                  </p>
                  <div className="space-y-2 text-white/70 font-mono text-xs">
                    <div>• <span className="text-white/90">Total Liquidity:</span> Minimum $10K required for low risk</div>
                    <div>• <span className="text-white/90">Lock Status:</span> Checks if liquidity is locked or burned</div>
                    <div>• <span className="text-white/90">Lock Duration:</span> Longer locks = lower risk</div>
                    <div>• <span className="text-white/90">LP Token Distribution:</span> Analyzes liquidity provider concentration</div>
                  </div>
                  <div className="mt-4 p-3 bg-white/5 border border-white/10">
                    <div className="text-white/50 font-mono text-xs mb-1">WEIGHT: 20%</div>
                    <div className="text-white/80 font-mono text-xs">Essential for preventing rug pulls and ensuring tradability</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Holder Distribution */}
            <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-6 mb-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 border border-white/30 bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-mono text-lg font-bold mb-2">3. HOLDER DISTRIBUTION</h3>
                  <p className="text-white/60 font-mono text-sm mb-3">
                    Analyzes token holder concentration to identify centralization risks.
                  </p>
                  <div className="space-y-2 text-white/70 font-mono text-xs">
                    <div>• <span className="text-white/90">Top 10 Holders:</span> Should hold less than 50% of supply</div>
                    <div>• <span className="text-white/90">Whale Concentration:</span> Identifies large holders who could dump</div>
                    <div>• <span className="text-white/90">Total Holders:</span> More holders = better distribution</div>
                    <div>• <span className="text-white/90">Creator Holdings:</span> Checks if creator holds excessive supply</div>
                  </div>
                  <div className="mt-4 p-3 bg-white/5 border border-white/10">
                    <div className="text-white/50 font-mono text-xs mb-1">WEIGHT: 15%</div>
                    <div className="text-white/80 font-mono text-xs">Prevents manipulation by concentrated holders</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trading Volume */}
            <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-6 mb-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 border border-white/30 bg-white/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-mono text-lg font-bold mb-2">4. TRADING VOLUME</h3>
                  <p className="text-white/60 font-mono text-sm mb-3">
                    Assesses trading activity and market interest over time.
                  </p>
                  <div className="space-y-2 text-white/70 font-mono text-xs">
                    <div>• <span className="text-white/90">24h Volume:</span> Minimum $5K for active trading</div>
                    <div>• <span className="text-white/90">Volume Trend:</span> Consistent volume indicates real interest</div>
                    <div>• <span className="text-white/90">Volume/Liquidity Ratio:</span> Healthy ratio prevents manipulation</div>
                    <div>• <span className="text-white/90">Transaction Count:</span> More transactions = more activity</div>
                  </div>
                  <div className="mt-4 p-3 bg-white/5 border border-white/10">
                    <div className="text-white/50 font-mono text-xs mb-1">WEIGHT: 10%</div>
                    <div className="text-white/80 font-mono text-xs">Indicates genuine market interest and liquidity</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Factors */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-4">
                <h4 className="text-white font-mono text-sm font-bold mb-2">5. BUY/SELL TAX</h4>
                <p className="text-white/60 font-mono text-xs mb-2">Analyzes transaction fees</p>
                <div className="text-white/50 font-mono text-xs">WEIGHT: 8%</div>
              </div>
              
              <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-4">
                <h4 className="text-white font-mono text-sm font-bold mb-2">6. TOKEN AGE</h4>
                <p className="text-white/60 font-mono text-xs mb-2">Evaluates contract maturity</p>
                <div className="text-white/50 font-mono text-xs">WEIGHT: 7%</div>
              </div>
              
              <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-4">
                <h4 className="text-white font-mono text-sm font-bold mb-2">7. MARKET CAP</h4>
                <p className="text-white/60 font-mono text-xs mb-2">Assesses token valuation</p>
                <div className="text-white/50 font-mono text-xs">WEIGHT: 5%</div>
              </div>
              
              <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-4">
                <h4 className="text-white font-mono text-sm font-bold mb-2">8. PRICE VOLATILITY</h4>
                <p className="text-white/60 font-mono text-xs mb-2">Measures price stability</p>
                <div className="text-white/50 font-mono text-xs">WEIGHT: 4%</div>
              </div>
              
              <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-4">
                <h4 className="text-white font-mono text-sm font-bold mb-2">9. SOCIAL PRESENCE</h4>
                <p className="text-white/60 font-mono text-xs mb-2">Verifies community activity</p>
                <div className="text-white/50 font-mono text-xs">WEIGHT: 3%</div>
              </div>
              
              <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-4">
                <h4 className="text-white font-mono text-sm font-bold mb-2">10. AUDIT STATUS</h4>
                <p className="text-white/60 font-mono text-xs mb-2">Checks for security audits</p>
                <div className="text-white/50 font-mono text-xs">WEIGHT: 3%</div>
              </div>
            </div>
          </section>

          {/* Chain-Adaptive Weighting */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold font-mono tracking-wider mb-6 text-white flex items-center gap-3">
              <Zap className="w-6 h-6" />
              CHAIN-ADAPTIVE WEIGHTING
            </h2>
            <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-8">
              <p className="text-white/80 font-mono text-sm leading-relaxed mb-6">
                Our algorithm adapts factor weights based on the blockchain network, recognizing that different chains 
                have unique characteristics and risk profiles.
              </p>
              
              <div className="space-y-4">
                <div className="border border-white/10 bg-white/5 p-4">
                  <h4 className="text-white font-mono text-sm font-bold mb-2">ETHEREUM & EVM CHAINS</h4>
                  <p className="text-white/60 font-mono text-xs">
                    Standard weighting with emphasis on contract security (25%) and liquidity (20%). 
                    GoPlus API provides comprehensive security analysis.
                  </p>
                </div>
                
                <div className="border border-white/10 bg-white/5 p-4">
                  <h4 className="text-white font-mono text-sm font-bold mb-2">SOLANA</h4>
                  <p className="text-white/60 font-mono text-xs">
                    Adjusted weighting due to different architecture. Uses Helius DAS API for enhanced transaction data. 
                    Holder distribution weight increased to 20% due to better on-chain visibility.
                  </p>
                </div>
                
                <div className="border border-white/10 bg-white/5 p-4">
                  <h4 className="text-white font-mono text-sm font-bold mb-2">MEME TOKENS</h4>
                  <p className="text-white/60 font-mono text-xs">
                    Baseline +15 risk penalty applied. Volatility weight increased to 8%. 
                    AI classification identifies meme tokens based on name, symbol, and market behavior.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Special Cases */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold font-mono tracking-wider mb-6 text-white flex items-center gap-3">
              <AlertTriangle className="w-6 h-6" />
              SPECIAL CASES
            </h2>
            
            <div className="space-y-4">
              <div className="border border-green-500/30 bg-green-500/5 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h4 className="text-white font-mono text-sm font-bold">STABLECOINS</h4>
                </div>
                <p className="text-white/70 font-mono text-xs">
                  USDT, USDC, DAI, and other major stablecoins automatically receive LOW risk scores (0-20) 
                  due to their established nature and regulatory backing.
                </p>
              </div>
              
              <div className="border border-blue-500/30 bg-blue-500/5 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                  <h4 className="text-white font-mono text-sm font-bold">OFFICIAL TOKENS</h4>
                </div>
                <p className="text-white/70 font-mono text-xs">
                  Tokens verified on CoinGecko with market cap over $50M receive -10 risk score adjustment 
                  due to established legitimacy and market presence.
                </p>
              </div>
              
              <div className="border border-red-500/30 bg-red-500/5 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h4 className="text-white font-mono text-sm font-bold">DEAD TOKENS</h4>
                </div>
                <p className="text-white/70 font-mono text-xs">
                  Tokens with zero liquidity, zero volume, or zero transaction count are automatically 
                  flagged as CRITICAL risk (95-100) regardless of other factors.
                </p>
              </div>
            </div>
          </section>

          {/* Data Sources */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold font-mono tracking-wider mb-6 text-white flex items-center gap-3">
              <Database className="w-6 h-6" />
              DATA SOURCES
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-6">
                <h4 className="text-white font-mono text-sm font-bold mb-3">MOBULA API</h4>
                <p className="text-white/60 font-mono text-xs mb-3">
                  Primary source for market data including price, volume, liquidity, and market cap across all chains.
                </p>
                <div className="text-white/50 font-mono text-xs">Real-time pricing • Multi-chain support</div>
              </div>
              
              <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-6">
                <h4 className="text-white font-mono text-sm font-bold mb-3">MORALIS API</h4>
                <p className="text-white/60 font-mono text-xs mb-3">
                  Blockchain transaction data, holder information, and historical analytics for EVM chains.
                </p>
                <div className="text-white/50 font-mono text-xs">Transaction history • Holder data</div>
              </div>
              
              <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-6">
                <h4 className="text-white font-mono text-sm font-bold mb-3">GOPLUS API</h4>
                <p className="text-white/60 font-mono text-xs mb-3">
                  Comprehensive smart contract security analysis for EVM chains including honeypot detection.
                </p>
                <div className="text-white/50 font-mono text-xs">Contract security • Risk flags</div>
              </div>
              
              <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-6">
                <h4 className="text-white font-mono text-sm font-bold mb-3">HELIUS API</h4>
                <p className="text-white/60 font-mono text-xs mb-3">
                  Solana-specific data including DAS API for enhanced transaction analysis and holder information.
                </p>
                <div className="text-white/50 font-mono text-xs">Solana transactions • Enhanced data</div>
              </div>
            </div>
          </section>

          {/* AI Integration */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold font-mono tracking-wider mb-6 text-white flex items-center gap-3">
              <Zap className="w-6 h-6" />
              AI INTEGRATION
            </h2>
            <div className="border border-white/20 bg-black/40 backdrop-blur-sm p-8">
              <p className="text-white/80 font-mono text-sm leading-relaxed mb-6">
                Our algorithm is enhanced with AI-powered analysis using Groq (Llama 3.3 70B) and Google Gemini as fallback.
              </p>
              
              <div className="space-y-4">
                <div className="border border-white/10 bg-white/5 p-4">
                  <h4 className="text-white font-mono text-sm font-bold mb-2">MEME TOKEN DETECTION</h4>
                  <p className="text-white/60 font-mono text-xs">
                    AI analyzes token name, symbol, and market behavior to identify meme tokens and apply appropriate risk adjustments.
                  </p>
                </div>
                
                <div className="border border-white/10 bg-white/5 p-4">
                  <h4 className="text-white font-mono text-sm font-bold mb-2">RISK EXPLANATIONS</h4>
                  <p className="text-white/60 font-mono text-xs">
                    Natural language explanations of risk factors, helping users understand why a token received its score.
                  </p>
                </div>
                
                <div className="border border-white/10 bg-white/5 p-4">
                  <h4 className="text-white font-mono text-sm font-bold mb-2">PATTERN RECOGNITION</h4>
                  <p className="text-white/60 font-mono text-xs">
                    Identifies suspicious patterns in trading activity, holder behavior, and contract interactions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-white/10 pt-8">
            <p className="text-white/40 font-mono text-xs text-center">
              Algorithm version 2.0 • Last updated: January 2025
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
