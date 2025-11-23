"use client"

import Link from "next/link"
import Navbar from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Zap, Search, TrendingUp, Eye, CheckCircle, ArrowRight, AlertTriangle, Users, Bell, Settings, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black text-white pt-20">
        {/* Hero Section */}
        <section className="relative px-6 py-20 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <Link href="/">
            <Button 
              variant="outline" 
              className="mb-8 border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-mono tracking-wider transition-all group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              BACK TO HOME
            </Button>
          </Link>

          <div className="flex items-center gap-2 mb-6 opacity-60">
            <div className="w-8 h-px bg-white"></div>
            <span className="text-white text-[10px] font-mono tracking-wider">DOCUMENTATION</span>
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 font-mono tracking-wider">
            USER GUIDE
          </h1>
          
          <p className="text-white/70 text-lg font-mono leading-relaxed mb-8">
            Complete guide to using Tokenomics Lab for multi-chain token risk analysis.
            Learn how to scan tokens, interpret risk scores, and protect your investments.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/signup">
              <Button className="bg-white text-black hover:bg-white/90 font-mono">
                GET STARTED
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-mono">
                VIEW PRICING
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="relative px-6 py-12 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 font-mono">TABLE OF CONTENTS</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/docs/algorithm" className="block p-4 border border-white/20 hover:border-white/40 bg-black/40 backdrop-blur-sm transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-white/90 font-mono text-sm">00. Risk Algorithm</span>
                <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
            <a href="#getting-started" className="block p-4 border border-white/20 hover:border-white/40 bg-black/40 backdrop-blur-sm transition-all">
              <span className="text-white/90 font-mono text-sm">01. Getting Started</span>
            </a>
            <a href="#scanning-tokens" className="block p-4 border border-white/20 hover:border-white/40 bg-black/40 backdrop-blur-sm transition-all">
              <span className="text-white/90 font-mono text-sm">02. Scanning Tokens</span>
            </a>
            <a href="#risk-scores" className="block p-4 border border-white/20 hover:border-white/40 bg-black/40 backdrop-blur-sm transition-all">
              <span className="text-white/90 font-mono text-sm">03. Understanding Risk Scores</span>
            </a>
            <a href="#meme-detection" className="block p-4 border border-white/20 hover:border-white/40 bg-black/40 backdrop-blur-sm transition-all">
              <span className="text-white/90 font-mono text-sm">04. AI Meme Detection</span>
            </a>
            <a href="#chains" className="block p-4 border border-white/20 hover:border-white/40 bg-black/40 backdrop-blur-sm transition-all">
              <span className="text-white/90 font-mono text-sm">05. Supported Blockchains</span>
            </a>
            <a href="#premium" className="block p-4 border border-white/20 hover:border-white/40 bg-black/40 backdrop-blur-sm transition-all">
              <span className="text-white/90 font-mono text-sm">06. Premium Features</span>
            </a>
            <a href="#watchlist" className="block p-4 border border-white/20 hover:border-white/40 bg-black/40 backdrop-blur-sm transition-all">
              <span className="text-white/90 font-mono text-sm">07. Watchlist Management</span>
            </a>
            <a href="#faq" className="block p-4 border border-white/20 hover:border-white/40 bg-black/40 backdrop-blur-sm transition-all">
              <span className="text-white/90 font-mono text-sm">08. FAQ</span>
            </a>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section id="getting-started" className="relative px-6 py-16 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 font-mono">01. GETTING STARTED</h2>
          
          <div className="space-y-6">
            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Create Your Account
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm space-y-3">
                <p>1. Click "SIGN UP" in the top navigation</p>
                <p>2. Enter your email and create a secure password</p>
                <p>3. Verify your email address (check spam folder)</p>
                <p>4. You'll start with a FREE account (10 scans/day)</p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Your First Token Scan
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm space-y-3">
                <p>1. Navigate to your dashboard after logging in</p>
                <p>2. Enter a token contract address or search by name</p>
                <p>3. Select the correct blockchain network</p>
                <p>4. Click "ANALYZE TOKEN" to start the scan</p>
                <p>5. Results appear in 3-5 seconds with full risk breakdown</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Scanning Tokens */}
      <section id="scanning-tokens" className="relative px-6 py-16 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 font-mono">02. SCANNING TOKENS</h2>
          
          <div className="space-y-6">
            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono">Search Methods</CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm space-y-4">
                <div>
                  <h4 className="text-white mb-2">⊡ By Contract Address</h4>
                  <p className="mb-2">Paste the full token contract address:</p>
                  <code className="block bg-white/5 p-3 border border-white/10 text-xs">
                    0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE
                  </code>
                </div>
                
                <div>
                  <h4 className="text-white mb-2">⊡ By Token Name/Symbol</h4>
                  <p className="mb-2">Use CoinMarketCap integration to search:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Type token name (e.g., "Pepe")</li>
                    <li>Select from dropdown suggestions</li>
                    <li>Auto-fills contract address</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-white mb-2">⊡ Chain Selection</h4>
                  <p>Always select the correct blockchain:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>◆ Ethereum (ETH)</li>
                    <li>◇ Binance Smart Chain (BSC)</li>
                    <li>▲ Polygon (MATIC)</li>
                    <li>△ Avalanche (AVAX)</li>
                    <li>● Solana (SOL)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Risk Scores */}
      <section id="risk-scores" className="relative px-6 py-16 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 font-mono">03. UNDERSTANDING RISK SCORES</h2>
          
          <div className="space-y-6">
            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono">Risk Levels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 font-mono font-bold">LOW RISK (0-34)</span>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-white/70 text-sm font-mono">
                    Safe to invest. Token shows strong fundamentals, verified contracts, good liquidity, and decentralized ownership.
                  </p>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-yellow-400 font-mono font-bold">MEDIUM RISK (35-49)</span>
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  </div>
                  <p className="text-white/70 text-sm font-mono">
                    Proceed with caution. Some concerning factors detected. Research thoroughly before investing.
                  </p>
                </div>

                <div className="p-4 bg-orange-500/10 border border-orange-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-orange-400 font-mono font-bold">HIGH RISK (50-74)</span>
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                  </div>
                  <p className="text-white/70 text-sm font-mono">
                    High risk detected. Multiple red flags present. Only invest what you can afford to lose.
                  </p>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-400 font-mono font-bold">CRITICAL RISK (75-100)</span>
                    <Shield className="w-5 h-5 text-red-400" />
                  </div>
                  <p className="text-white/70 text-sm font-mono">
                    Avoid investment. Likely scam, honeypot, or rug pull. Critical security issues detected.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono">10 Risk Factors Analyzed</CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-white mb-2">1. Supply Dilution</h4>
                    <p className="text-xs">FDV/Market Cap ratio, mintable tokens, unlimited supply risks</p>
                  </div>
                  <div>
                    <h4 className="text-white mb-2">2. Holder Concentration</h4>
                    <p className="text-xs">Top 10/50/100 holder percentages, unique buyers, wash trading</p>
                  </div>
                  <div>
                    <h4 className="text-white mb-2">3. Liquidity Depth</h4>
                    <p className="text-xs">Liquidity amount, MC/Liq ratio, LP lock status, liquidity drops</p>
                  </div>
                  <div>
                    <h4 className="text-white mb-2">4. Vesting & Unlocks</h4>
                    <p className="text-xs">Upcoming token unlocks, team vesting schedules</p>
                  </div>
                  <div>
                    <h4 className="text-white mb-2">5. Contract Control</h4>
                    <p className="text-xs">Honeypot detection, mintable flags, ownership, freeze authority</p>
                  </div>
                  <div>
                    <h4 className="text-white mb-2">6. Tax & Fees</h4>
                    <p className="text-xs">Buy/sell taxes, modifiable tax rates</p>
                  </div>
                  <div>
                    <h4 className="text-white mb-2">7. Distribution</h4>
                    <p className="text-xs">Team allocation, holder distribution fairness</p>
                  </div>
                  <div>
                    <h4 className="text-white mb-2">8. Burn & Deflation</h4>
                    <p className="text-xs">Burn rate, deflationary mechanisms, supply cap</p>
                  </div>
                  <div>
                    <h4 className="text-white mb-2">9. Adoption & Usage</h4>
                    <p className="text-xs">Transaction count, volume/MC ratio, age-adjusted metrics</p>
                  </div>
                  <div>
                    <h4 className="text-white mb-2">10. Audit & Transparency</h4>
                    <p className="text-xs">Contract verification, open source status, audit reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Meme Detection */}
      <section id="meme-detection" className="relative px-6 py-16 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 font-mono">04. AI MEME DETECTION</h2>
          
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-gray-500/10 to-transparent backdrop-blur-lg border border-gray-500/30">
              <CardHeader>
                <CardTitle className="text-white font-mono flex items-center gap-2">
                  <span className="text-2xl">◐</span>
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm space-y-4">
                <p>
                  Our AI (powered by Groq Llama 3.3 70B) analyzes token metadata to automatically classify tokens as either MEME or UTILITY.
                </p>
                
                <div className="bg-black/40 p-4 border border-white/10">
                  <h4 className="text-white mb-3">Classification Process:</h4>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Token name and symbol analyzed</li>
                    <li>AI detects meme-related patterns</li>
                    <li>Confidence score calculated (0-100%)</li>
                    <li>Classification applied: ◐ MEME or ◧ UTILITY</li>
                  </ol>
                </div>

                <div className="bg-gray-500/10 p-4 border border-gray-500/30">
                  <h4 className="text-gray-300 mb-2">⚠️ Meme Token Penalty</h4>
                  <p>
                    Tokens classified as MEME automatically receive +15 risk points due to:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>High volatility and price swings</li>
                    <li>Speculative nature</li>
                    <li>Community-driven value</li>
                    <li>Lack of utility or real-world use case</li>
                  </ul>
                </div>

                <div className="bg-white/5 p-4 border border-white/10">
                  <h4 className="text-white mb-2">Manual Override</h4>
                  <p>
                    Don't agree with the AI? You can manually override the classification:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                    <li>⊕ Auto Detect (default AI classification)</li>
                    <li>◐ Force Meme Token classification</li>
                    <li>◧ Force Utility Token classification</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Supported Chains */}
      <section id="chains" className="relative px-6 py-16 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 font-mono">05. SUPPORTED BLOCKCHAINS</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono flex items-center gap-2">
                  <span>◆</span> Ethereum (ETH)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm space-y-2">
                <p><strong>Chain ID:</strong> 1</p>
                <p><strong>Data Sources:</strong> Mobula, Moralis, GoPlus</p>
                <p><strong>Features:</strong> Full contract analysis, holder tracking, liquidity monitoring</p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono flex items-center gap-2">
                  <span>◇</span> Binance Smart Chain
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm space-y-2">
                <p><strong>Chain ID:</strong> 56</p>
                <p><strong>Data Sources:</strong> Mobula, Moralis, GoPlus</p>
                <p><strong>Features:</strong> Fast scans, PancakeSwap integration</p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono flex items-center gap-2">
                  <span>▲</span> Polygon (MATIC)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm space-y-2">
                <p><strong>Chain ID:</strong> 137</p>
                <p><strong>Data Sources:</strong> Mobula, Moralis, GoPlus</p>
                <p><strong>Features:</strong> Low-cost analysis, QuickSwap support</p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono flex items-center gap-2">
                  <span>●</span> Solana (SOL)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm space-y-2">
                <p><strong>Chain ID:</strong> 501</p>
                <p><strong>Data Sources:</strong> Mobula, Helius, GoPlus</p>
                <p><strong>Special:</strong> Freeze authority detection, mint authority checks</p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono flex items-center gap-2">
                  <span>△</span> Avalanche (AVAX)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm space-y-2">
                <p><strong>Chain ID:</strong> 43114</p>
                <p><strong>Data Sources:</strong> Mobula, Moralis</p>
                <p><strong>Features:</strong> Trader Joe integration</p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono flex items-center gap-2">
                  <span>◈</span> Arbitrum
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm space-y-2">
                <p><strong>Chain ID:</strong> 42161</p>
                <p><strong>Data Sources:</strong> Mobula, Moralis</p>
                <p><strong>Features:</strong> Layer 2 optimized scanning</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Premium Features */}
      <section id="premium" className="relative px-6 py-16 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 font-mono">06. PREMIUM FEATURES</h2>
          
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="text-white/60 font-mono text-sm">FREE TIER</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-white/70 font-mono text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>10 scans per day</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 font-mono text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Basic risk analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 font-mono text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>5 watchlist tokens</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 font-mono text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>2 dashboard charts</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 font-mono text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Multi-chain support</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white/10 to-transparent backdrop-blur-lg border border-white/40">
                <CardHeader>
                  <CardTitle className="text-white font-mono text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    PREMIUM TIER
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-white/90 font-mono text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Unlimited scans</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90 font-mono text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>AI-powered insights</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90 font-mono text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Unlimited watchlist</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90 font-mono text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>4 advanced charts</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90 font-mono text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Real-time alerts</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90 font-mono text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Historical analytics</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90 font-mono text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Priority support</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono">Upgrade to Premium</CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm space-y-4">
                <p>Ready to unlock all features? Upgrade from your profile page or dashboard.</p>
                <Link href="/pricing">
                  <Button className="bg-white text-black hover:bg-white/90 font-mono">
                    VIEW PRICING
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Watchlist */}
      <section id="watchlist" className="relative px-6 py-16 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 font-mono">07. WATCHLIST MANAGEMENT</h2>
          
          <div className="space-y-6">
            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Adding Tokens to Watchlist
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm space-y-3">
                <p>After scanning a token, click "Add to Watchlist" to track it:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>FREE users: Up to 5 tokens</li>
                  <li>PREMIUM users: Unlimited tokens</li>
                  <li>Tokens update automatically with latest risk scores</li>
                  <li>View all watchlist tokens from your dashboard</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Alerts (Premium Only)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm space-y-3">
                <p>Premium users receive automatic alerts when:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Risk score increases significantly</li>
                  <li>New critical flags detected</li>
                  <li>Liquidity drops below threshold</li>
                  <li>Holder concentration changes</li>
                </ul>
                <p className="text-white/50 text-xs mt-4">
                  Configure alert preferences in your profile settings.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative px-6 py-16 border-b border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 font-mono">08. FREQUENTLY ASKED QUESTIONS</h2>
          
          <div className="space-y-4">
            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono text-base">How accurate are the risk scores?</CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm">
                <p>
                  Our 10-factor algorithm analyzes real-time data from multiple sources (Mobula, Moralis, GoPlus, Helius). 
                  Confidence scores range from 70-96% depending on data availability. Premium users get higher confidence 
                  scores due to additional data sources.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono text-base">What makes a token "high risk"?</CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm">
                <p>
                  High risk tokens typically have: honeypot detection, mintable contracts, unlocked liquidity, 
                  concentrated ownership (top 10 holders &gt; 70%), low liquidity (&lt; $50K), or are classified 
                  as meme tokens with no utility.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono text-base">Can I scan tokens on any blockchain?</CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm">
                <p>
                  We support 6 major blockchains: Ethereum, BSC, Polygon, Avalanche, Arbitrum, and Solana. 
                  More chains coming soon. Always select the correct chain when scanning to ensure accurate results.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono text-base">What is the meme token penalty?</CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm">
                <p>
                  Tokens classified as meme coins automatically receive +15 risk points due to their speculative 
                  nature and high volatility. This helps users understand the additional risk of investing in 
                  community-driven tokens without real utility.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono text-base">How often is data updated?</CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm">
                <p>
                  Every scan fetches fresh data from APIs in real-time. Watchlist tokens are updated every 
                  15 minutes for Premium users, every hour for Free users. Historical charts update daily.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono text-base">Is my data private and secure?</CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm">
                <p>
                  Yes. We use Firebase Authentication with industry-standard encryption. Your watchlist and 
                  scan history are private and only accessible to you. We are GDPR compliant and never sell 
                  user data. See our <Link href="/privacy" className="text-white underline">Privacy Policy</Link> for details.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono text-base">Can I cancel my Premium subscription?</CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm">
                <p>
                  Yes, you can cancel anytime from your profile settings. You'll retain Premium access until 
                  the end of your billing period, then automatically revert to the Free tier.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-mono text-base">What if a token shows "No data available"?</CardTitle>
              </CardHeader>
              <CardContent className="text-white/70 font-mono text-sm">
                <p>
                  This means the token is not listed on major data aggregators yet, or the contract address 
                  is incorrect. Verify the address and chain selection. Very new tokens (&lt; 24 hours) may 
                  not have sufficient data for analysis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="relative px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 font-mono">NEED MORE HELP?</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-white/10 border border-white/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-mono font-bold mb-2">PROFILE SETTINGS</h3>
                <p className="text-white/60 text-sm font-mono mb-4">
                  Manage your account, upgrade to Premium, and configure preferences
                </p>
                <Link href="/profile">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-mono text-xs">
                    GO TO PROFILE
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-white/10 border border-white/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-mono font-bold mb-2">PRICING</h3>
                <p className="text-white/60 text-sm font-mono mb-4">
                  Compare Free vs Premium features and upgrade your account
                </p>
                <Link href="/pricing">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-mono text-xs">
                    VIEW PRICING
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-white/10 border border-white/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-mono font-bold mb-2">CONTACT US</h3>
                <p className="text-white/60 text-sm font-mono mb-4">
                  Have questions? Reach out to our support team
                </p>
                <Link href="/contact">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-mono text-xs">
                    CONTACT SUPPORT
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative px-6 py-16 border-t border-white/10 bg-gradient-to-b from-transparent to-white/5">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 font-mono">
            READY TO START ANALYZING?
          </h2>
          <p className="text-white/70 font-mono mb-8 max-w-2xl mx-auto">
            Join thousands of users protecting their crypto investments with AI-powered risk analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button className="bg-white text-black hover:bg-white/90 font-mono px-8 py-6 text-base">
                CREATE FREE ACCOUNT
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-mono px-8 py-6 text-base">
                START SCANNING
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  )
}
