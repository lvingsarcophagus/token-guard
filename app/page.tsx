"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, BarChart3, Search, Eye, Activity, Database, Globe, CheckCircle, ArrowRight, AlertTriangle, Cpu, Zap, Bell, Layers, GitBranch, Sparkles, Binary, Hexagon, Box } from "lucide-react"
import dynamic from "next/dynamic"
import { Suspense } from "react"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import Navbar from "@/components/navbar"

// Dynamically import the 3D scene to avoid SSR issues
const GenerativeArtScene = dynamic(
  () => import("@/components/generative-art-scene"),
  { ssr: false }
)

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Use shared Navbar component */}
      <Navbar />

      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 stars-bg pointer-events-none opacity-30"></div>
      <div className="fixed inset-0 grid-pattern pointer-events-none opacity-20"></div>

      {/* 3D Generative Art Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <Suspense fallback={<div className="w-full h-full bg-black" />}>
          <GenerativeArtScene />
        </Suspense>
      </div>

      {/* Animated gradient overlay */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Hero Section - Enhanced */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
        <div className="max-w-6xl w-full mx-auto">
            {/* Top decorative line with enhanced styling - Centered */}
            <div className="flex items-center justify-center gap-3 mb-12 opacity-70">
              <div className="w-12 lg:w-16 h-px bg-gradient-to-r from-transparent via-white to-white"></div>
              <div className="flex items-center gap-2">
                <span className="text-white text-[10px] font-mono tracking-[0.3em]">∞</span>
                <div className="w-px h-4 bg-white/50"></div>
                <span className="text-white text-[10px] font-mono tracking-[0.3em]">TOKENOMICS.LAB</span>
              </div>
              <div className="w-12 lg:w-16 h-px bg-gradient-to-r from-white to-transparent"></div>
            </div>

          {/* Main Title - Centered */}
          <div className="relative mb-12 text-center">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl xl:text-9xl font-bold text-white leading-[0.9] font-mono tracking-tight">
                ADVANCED
                <br />
                <span className="text-white/70">TOKENOMICS</span>
                <br />
                <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">ANALYSIS</span>
              </h1>
              
              {/* Enhanced badges with better spacing - Centered */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <div className="group relative px-4 py-2 bg-white/5 border border-white/20 backdrop-blur-sm hover:bg-white/10 hover:border-white/40 transition-all duration-300">
                  <span className="text-white text-xs font-mono tracking-[0.2em] font-bold">10-FACTOR ALGORITHM</span>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="px-4 py-2 bg-white/5 border border-white/20 backdrop-blur-sm">
                  <span className="text-white/80 text-xs font-mono tracking-[0.2em]">MULTI-CHAIN</span>
                </div>
                <div className="px-4 py-2 bg-white/5 border border-white/20 backdrop-blur-sm">
                  <span className="text-white/80 text-xs font-mono tracking-[0.2em]">REAL-TIME</span>
                </div>
                <div className="px-4 py-2 bg-white/5 border border-white/20 backdrop-blur-sm">
                  <span className="text-white/80 text-xs font-mono tracking-[0.2em]">MEME + UTILITY</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative separator with animation - Centered */}
          <div className="flex items-center justify-center gap-1 mb-12 opacity-40">
            {Array.from({ length: 100 }).map((_, i) => (
              <div 
                key={i} 
                className="w-0.5 h-0.5 bg-white animate-pulse" 
                style={{ animationDelay: `${i * 20}ms`, animationDuration: '2s' }}
              ></div>
            ))}
          </div>

          {/* Description - Centered */}
          <div className="relative max-w-4xl mx-auto mb-14 text-center">
            <div className="space-y-6">
              <p className="text-xl lg:text-2xl text-white font-mono leading-relaxed font-bold">
                PROTECT YOUR INVESTMENTS WITH PROPRIETARY 10-FACTOR RISK SCORING.
              </p>
              <p className="text-base lg:text-lg text-white/60 font-mono leading-relaxed">
                Detect scams, rug pulls & honeypots before you buy. Our custom algorithm analyzes contract security, holder distribution, liquidity depth, and market behavior across 6+ blockchains.
              </p>
              
              {/* Feature highlights with icons - Centered */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 max-w-5xl mx-auto">
                <div className="flex flex-col items-center text-center gap-3 p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
                  <Binary className="w-6 h-6 text-white/80" />
                  <div>
                    <div className="text-white font-mono text-sm font-bold mb-1">10 RISK FACTORS</div>
                    <div className="text-white/50 font-mono text-xs">Comprehensive analysis</div>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center gap-3 p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
                  <GitBranch className="w-6 h-6 text-white/80" />
                  <div>
                    <div className="text-white font-mono text-sm font-bold mb-1">6 BLOCKCHAINS</div>
                    <div className="text-white/50 font-mono text-xs">Multi-chain support</div>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center gap-3 p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
                  <Hexagon className="w-6 h-6 text-white/80" />
                  <div>
                    <div className="text-white font-mono text-sm font-bold mb-1">5 DATA SOURCES</div>
                    <div className="text-white/50 font-mono text-xs">Real-time aggregation</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button - Centered */}
          <div className="flex justify-center mb-16">
            <Link href="/signup">
              <button className="group relative px-16 py-6 bg-white text-black font-mono text-base lg:text-xl border-2 border-white hover:bg-black hover:text-white transition-all duration-300 overflow-hidden">
                <span className="relative z-10 flex items-center gap-3 justify-center font-bold tracking-wider">
                  GET STARTED
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </Link>
          </div>

          {/* Bottom technical notation with enhanced styling */}
          <div className="flex items-center justify-center gap-3 opacity-50 pt-8">
            <span className="text-white text-[10px] font-mono tracking-[0.3em]">∞</span>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
            <span className="text-white text-[10px] font-mono tracking-[0.3em]">RISK.ALGORITHM.V2.0</span>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
            <span className="text-white text-[10px] font-mono tracking-[0.3em]">∞</span>
          </div>
        </div>
      </section>

      {/* Meme Coin Detection Section - FEATURED */}
      <section className="relative px-6 py-20 border-t border-gray-500/20 bg-gradient-to-b from-gray-500/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-gray-500/10 border border-gray-500/30 backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-gray-300" />
              <span className="text-gray-300 text-xs font-mono tracking-wider">MEME COIN SPECIALIST</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-white font-mono tracking-wider mb-6">
              INTELLIGENT TOKEN CLASSIFICATION
            </h2>
            <p className="text-white/70 text-sm lg:text-base font-mono max-w-3xl mx-auto leading-relaxed">
              Our AI analyzes token metadata to instantly classify tokens as meme or utility, applying appropriate risk assessment.
              Meme tokens receive +15 risk penalty due to higher volatility, while utility tokens are evaluated on fundamentals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Feature 1 */}
            <Card className="bg-black/60 backdrop-blur-lg border border-gray-500/30 hover:border-gray-500/50 transition-all group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gray-500/20 border border-gray-500/40 flex items-center justify-center mb-4 group-hover:bg-gray-500/30 transition-all">
                  <Cpu className="w-6 h-6 text-gray-300" />
                </div>
                <h4 className="text-lg font-bold text-gray-300 font-mono tracking-wider mb-3">AI CLASSIFICATION</h4>
                <p className="text-white/60 text-sm font-mono leading-relaxed mb-4">
                  Advanced Groq AI (Llama 3.3 70B) analyzes token names, symbols, and metadata to classify as meme or utility with 80%+ accuracy.
                </p>
                <div className="flex items-center gap-2 text-gray-400/60 text-xs font-mono">
                  <CheckCircle className="w-3 h-3" />
                  <span>INSTANT DETECTION</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-black/60 backdrop-blur-lg border border-gray-500/30 hover:border-gray-500/50 transition-all group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gray-500/20 border border-gray-500/40 flex items-center justify-center mb-4 group-hover:bg-gray-500/30 transition-all">
                  <AlertTriangle className="w-6 h-6 text-gray-300" />
                </div>
                <h4 className="text-lg font-bold text-gray-300 font-mono tracking-wider mb-3">+15 RISK PENALTY</h4>
                <p className="text-white/60 text-sm font-mono leading-relaxed mb-4">
                  Meme tokens automatically receive +15 additional risk points due to high volatility and speculative nature.
                </p>
                <div className="flex items-center gap-2 text-gray-400/60 text-xs font-mono">
                  <CheckCircle className="w-3 h-3" />
                  <span>AUTOMATIC ADJUSTMENT</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-black/60 backdrop-blur-lg border border-gray-500/30 hover:border-gray-500/50 transition-all group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gray-500/20 border border-gray-500/40 flex items-center justify-center mb-4 group-hover:bg-gray-500/30 transition-all">
                  <Layers className="w-6 h-6 text-gray-300" />
                </div>
                <h4 className="text-lg font-bold text-gray-300 font-mono tracking-wider mb-3">MANUAL OVERRIDE</h4>
                <p className="text-white/60 text-sm font-mono leading-relaxed mb-4">
                  Override AI classification with manual selection: Auto Detect, Meme Token, or Utility Token for customized risk analysis.
                </p>
                <div className="flex items-center gap-2 text-gray-400/60 text-xs font-mono">
                  <CheckCircle className="w-3 h-3" />
                  <span>USER CONTROL</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <div className="border border-gray-500/20 bg-black/40 backdrop-blur-lg p-8">
            <h3 className="text-xl font-bold text-gray-300 font-mono mb-6 flex items-center gap-3">
              <Zap className="w-6 h-6 text-gray-300" />
              HOW TOKEN CLASSIFICATION WORKS
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 border border-white/30 rounded-full flex items-center justify-center mx-auto mb-3 text-white/90 font-mono font-bold">
                  1
                </div>
                <p className="text-white/70 text-xs font-mono leading-relaxed">
                  Scan token by address or symbol across 5+ blockchains
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 border border-white/30 rounded-full flex items-center justify-center mx-auto mb-3 text-white/90 font-mono font-bold">
                  2
                </div>
                <p className="text-white/70 text-xs font-mono leading-relaxed">
                  AI analyzes token name, symbol, and metadata patterns
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 border border-white/30 rounded-full flex items-center justify-center mx-auto mb-3 text-white/90 font-mono font-bold">
                  3
                </div>
                <p className="text-white/70 text-xs font-mono leading-relaxed">
                  AI classifies as Meme Token or Utility Token
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 border border-white/30 rounded-full flex items-center justify-center mx-auto mb-3 text-white/90 font-mono font-bold">
                  4
                </div>
                <p className="text-white/70 text-xs font-mono leading-relaxed">
                  Apply appropriate risk scoring based on token type
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Technology Section - NEW */}
      <section id="technology" className="relative px-6 py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-4 opacity-60">
              <div className="w-8 h-px bg-white"></div>
              <span className="text-white text-[10px] font-mono tracking-wider">CORE.TECHNOLOGY</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-white font-mono tracking-wider mb-4">
              POWERED BY INDUSTRY LEADERS
            </h2>
            <p className="text-white/60 text-sm lg:text-base font-mono max-w-3xl">
              Our advanced risk engine aggregates data from multiple premium sources for comprehensive token analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                  <h4 className="text-lg font-bold text-white font-mono">GOPLUS</h4>
                </div>
                <p className="text-white/60 text-xs font-mono leading-relaxed mb-3">
                  Smart contract security analysis, honeypot detection, and token safety verification.
                </p>
                <div className="flex items-center gap-2">
                  <Box className="w-3 h-3 text-white/40" />
                  <span className="text-[10px] text-white/40 font-mono">PRIMARY SECURITY</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                  <h4 className="text-lg font-bold text-white font-mono">MOBULA</h4>
                </div>
                <p className="text-white/60 text-xs font-mono leading-relaxed mb-3">
                  Real-time market data, liquidity tracking, and price monitoring across all chains.
                </p>
                <div className="flex items-center gap-2">
                  <Box className="w-3 h-3 text-white/40" />
                  <span className="text-[10px] text-white/40 font-mono">MARKET DATA</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                  <h4 className="text-lg font-bold text-white font-mono">MORALIS</h4>
                </div>
                <p className="text-white/60 text-xs font-mono leading-relaxed mb-3">
                  Blockchain indexing, token metadata, holder analytics, and transaction tracking.
                </p>
                <div className="flex items-center gap-2">
                  <Box className="w-3 h-3 text-white/40" />
                  <span className="text-[10px] text-white/40 font-mono">BLOCKCHAIN DATA</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                  <h4 className="text-lg font-bold text-white font-mono">HELIUS</h4>
                </div>
                <p className="text-white/60 text-xs font-mono leading-relaxed mb-3">
                  Solana-specific data, freeze authority detection, and SPL token analysis.
                </p>
                <div className="flex items-center gap-2">
                  <Box className="w-3 h-3 text-white/40" />
                  <span className="text-[10px] text-white/40 font-mono">SOLANA FOCUS</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Search className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                  <h4 className="text-lg font-bold text-white font-mono">COINMARKETCAP</h4>
                </div>
                <p className="text-white/60 text-xs font-mono leading-relaxed mb-3">
                  Token search by name/symbol, market rankings, and comprehensive token discovery.
                </p>
                <div className="flex items-center gap-2">
                  <Box className="w-3 h-3 text-white/40" />
                  <span className="text-[10px] text-white/40 font-mono">TOKEN SEARCH</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Cpu className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                  <h4 className="text-lg font-bold text-white font-mono">GROQ AI</h4>
                </div>
                <p className="text-white/60 text-xs font-mono leading-relaxed mb-3">
                  Llama 3.3 70B for meme token classification and comprehensive risk analysis.
                </p>
                <div className="flex items-center gap-2">
                  <Box className="w-3 h-3 text-white/40" />
                  <span className="text-[10px] text-white/40 font-mono">AI ENGINE</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section id="features" className="relative px-6 py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-4 opacity-60">
              <div className="w-8 h-px bg-white"></div>
              <span className="text-white text-[10px] font-mono tracking-wider">CAPABILITIES</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-white font-mono tracking-wider mb-4">
              ADVANCED FEATURES
            </h2>
            <p className="text-white/60 text-sm lg:text-base font-mono max-w-3xl">
              Comprehensive security analysis toolkit designed for both novice and professional crypto traders.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="relative bg-gradient-to-br from-white/10 to-transparent backdrop-blur-lg border border-white/30 hover:border-white/50 transition-all group overflow-hidden rounded-lg">
              <GlowingEffect disabled={false} proximity={100} spread={30} blur={10} borderWidth={2} />
              <CardContent className="p-6 relative z-10">
                <div className="w-12 h-12 bg-white/10 border border-white/30 flex items-center justify-center mb-4 group-hover:bg-white/15 transition-all">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-px bg-white/50"></div>
                  <h4 className="text-lg font-bold text-white/90 font-mono tracking-wider">AI MEME CLASSIFIER</h4>
                </div>
                <p className="text-white/60 text-sm font-mono leading-relaxed">
                  Groq AI (Llama 3.3 70B) classifies tokens as meme or utility by analyzing metadata. Applies appropriate risk scoring for each type.
                </p>
              </CardContent>
            </Card>

            <Card className="relative bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all group overflow-hidden rounded-lg">
              <GlowingEffect disabled={false} proximity={100} spread={30} blur={10} borderWidth={2} />
              <CardContent className="p-6 relative z-10">
                <div className="w-12 h-12 border border-white/30 flex items-center justify-center mb-4 group-hover:bg-white transition-all duration-200">
                  <Search className="w-6 h-6 text-white group-hover:text-black transition-colors" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-px bg-white"></div>
                  <h4 className="text-lg font-bold text-white font-mono tracking-wider">MULTI-CHAIN SEARCH</h4>
                </div>
                <p className="text-white/60 text-sm font-mono leading-relaxed">
                  Search tokens across Ethereum, BSC, Polygon, Avalanche, and Solana with real-time suggestions and instant scanning.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all group">
              <CardContent className="p-6">
                <div className="w-12 h-12 border border-white/30 flex items-center justify-center mb-4 group-hover:bg-white transition-all duration-200">
                  <AlertTriangle className="w-6 h-6 text-white group-hover:text-black transition-colors" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-px bg-white"></div>
                  <h4 className="text-lg font-bold text-white font-mono tracking-wider">SCAM DETECTION</h4>
                </div>
                <p className="text-white/60 text-sm font-mono leading-relaxed">
                  Advanced honeypot detection, rug pull identification, and malicious contract analysis with 93%+ confidence.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all group">
              <CardContent className="p-6">
                <div className="w-12 h-12 border border-white/30 flex items-center justify-center mb-4 group-hover:bg-white transition-all duration-200">
                  <BarChart3 className="w-6 h-6 text-white group-hover:text-black transition-colors" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-px bg-white"></div>
                  <h4 className="text-lg font-bold text-white font-mono tracking-wider">RISK SCORING</h4>
                </div>
                <p className="text-white/60 text-sm font-mono leading-relaxed">
                  7-factor algorithm analyzing contract security, supply distribution, liquidity, whale concentration, and more.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all group">
              <CardContent className="p-6">
                <div className="w-12 h-12 border border-white/30 flex items-center justify-center mb-4 group-hover:bg-white transition-all duration-200">
                  <Eye className="w-6 h-6 text-white group-hover:text-black transition-colors" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-px bg-white"></div>
                  <h4 className="text-lg font-bold text-white font-mono tracking-wider">WATCHLIST</h4>
                </div>
                <p className="text-white/60 text-sm font-mono leading-relaxed">
                  Track unlimited tokens with real-time price updates, risk monitoring, and customizable alerts for portfolio management.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all group">
              <CardContent className="p-6">
                <div className="w-12 h-12 border border-white/30 flex items-center justify-center mb-4 group-hover:bg-white transition-all duration-200">
                  <Activity className="w-6 h-6 text-white group-hover:text-black transition-colors" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-px bg-white"></div>
                  <h4 className="text-lg font-bold text-white font-mono tracking-wider">LIVE CHARTS</h4>
                </div>
                <p className="text-white/60 text-sm font-mono leading-relaxed">
                  Historical analytics with 6 comprehensive charts: risk timeline, price history, holder trends, volume, and whale activity.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all group">
              <CardContent className="p-6">
                <div className="w-12 h-12 border border-white/30 flex items-center justify-center mb-4 group-hover:bg-white transition-all duration-200">
                  <Bell className="w-6 h-6 text-white group-hover:text-black transition-colors" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-px bg-white"></div>
                  <h4 className="text-lg font-bold text-white font-mono tracking-wider">SMART ALERTS</h4>
                </div>
                <p className="text-white/60 text-sm font-mono leading-relaxed">
                  Instant notifications for risk increases, price changes, liquidity drops, and suspicious holder activity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section - NEW */}
      <section className="relative px-6 py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-4 opacity-60">
              <div className="w-8 h-px bg-white"></div>
              <span className="text-white text-[10px] font-mono tracking-wider">PROCESS</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-white font-mono tracking-wider mb-4">
              HOW IT WORKS
            </h2>
            <p className="text-white/60 text-sm lg:text-base font-mono max-w-3xl">
              Three simple steps to secure your investments and avoid scams.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="absolute -left-4 top-0 text-6xl font-bold text-white/10 font-mono">01</div>
              <div className="relative z-10">
                <div className="w-16 h-16 border-2 border-white/30 bg-black/80 flex items-center justify-center mb-6">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white font-mono mb-3 tracking-wider">SEARCH TOKEN</h3>
                <p className="text-white/60 text-sm font-mono leading-relaxed mb-4">
                  Enter any token symbol or contract address. Our system searches across 7+ blockchains with intelligent auto-suggestions.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-white/10 border border-white/20 text-[10px] font-mono text-white">ETHEREUM</span>
                  <span className="px-2 py-1 bg-white/10 border border-white/20 text-[10px] font-mono text-white">BSC</span>
                  <span className="px-2 py-1 bg-white/10 border border-white/20 text-[10px] font-mono text-white">POLYGON</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-4 top-0 text-6xl font-bold text-white/10 font-mono">02</div>
              <div className="relative z-10">
                <div className="w-16 h-16 border-2 border-white/30 bg-black/80 flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white font-mono mb-3 tracking-wider">ANALYZE</h3>
                <p className="text-white/60 text-sm font-mono leading-relaxed mb-4">
                  Our AI engine analyzes 7 risk factors using data from 5 premium APIs, delivering results in seconds with confidence scores.
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white"></div>
                    <span className="text-[10px] font-mono text-white/60">CONTRACT SECURITY</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white"></div>
                    <span className="text-[10px] font-mono text-white/60">SUPPLY DISTRIBUTION</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white"></div>
                    <span className="text-[10px] font-mono text-white/60">WHALE CONCENTRATION</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-4 top-0 text-6xl font-bold text-white/10 font-mono">03</div>
              <div className="relative z-10">
                <div className="w-16 h-16 border-2 border-white/30 bg-black/80 flex items-center justify-center mb-6">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white font-mono mb-3 tracking-wider">MONITOR</h3>
                <p className="text-white/60 text-sm font-mono leading-relaxed mb-4">
                  Add tokens to your watchlist for 24/7 monitoring. Receive instant alerts on risk changes, price movements, and suspicious activity.
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[10px] font-mono text-white/60">REAL-TIME UPDATES</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[10px] font-mono text-white/60">CUSTOM ALERTS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[10px] font-mono text-white/60">HISTORICAL CHARTS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Enhanced */}
      <section className="relative px-6 py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <div className="flex items-center gap-2 mb-4 opacity-60 justify-center">
              <div className="w-8 h-px bg-white"></div>
              <span className="text-white text-[10px] font-mono tracking-wider">HYBRID MONETIZATION</span>
              <div className="w-8 h-px bg-white"></div>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-white font-mono tracking-wider mb-4">
              CHOOSE YOUR PLAN
            </h2>
            <p className="text-white/60 text-sm lg:text-base font-mono max-w-3xl mx-auto">
              Start free, pay only for what you use, or go unlimited. No barriers to entry, sustainable for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Tier 1: Free */}
            <Card className="bg-black/60 backdrop-blur-lg border border-white/20 hover:border-white/40 transition-all group">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-4 opacity-60">
                  <div className="w-6 h-px bg-white"></div>
                  <span className="text-white text-[9px] font-mono">TIER.01</span>
                </div>
                <h4 className="text-2xl font-bold text-white mb-2 font-mono tracking-wider">FREE</h4>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-white font-mono">$0</span>
                  <span className="text-white/40 text-sm font-mono">/month</span>
                </div>
                <p className="text-xs text-white/50 font-mono mb-8 h-10">Casual User / Social Sharer</p>

                <div className="space-y-4 mb-10">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-white/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm font-bold mb-1">Honeypot Check</div>
                      <div className="text-white/50 text-xs font-mono">Safety First - Free for everyone</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-white/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <BarChart3 className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm font-bold mb-1">Risk Score</div>
                      <div className="text-white/50 text-xs font-mono">10-factor algorithm (0-100)</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-white/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm font-bold mb-1">PDF Export</div>
                      <div className="text-white/50 text-xs font-mono">Watermarked reports</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 rounded-full mt-0.5 flex-shrink-0"></div>
                    <div>
                      <div className="text-white/40 font-mono text-sm font-bold mb-1">AI Analyst</div>
                      <div className="text-white/30 text-xs font-mono">Raw data only</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 rounded-full mt-0.5 flex-shrink-0"></div>
                    <div>
                      <div className="text-white/40 font-mono text-sm font-bold mb-1">Portfolio Audit</div>
                      <div className="text-white/30 text-xs font-mono">Not available</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 rounded-full mt-0.5 flex-shrink-0"></div>
                    <div>
                      <div className="text-white/40 font-mono text-sm font-bold mb-1">Smart Alerts</div>
                      <div className="text-white/30 text-xs font-mono">Not available</div>
                    </div>
                  </div>
                </div>

                <Link href="/signup" className="block">
                  <button className="w-full px-6 py-4 bg-transparent border-2 border-white text-white font-mono text-sm hover:bg-white hover:text-black transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-105 transform">
                    START FREE
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </CardContent>
            </Card>

            {/* Tier 2: Pay-As-You-Go */}
            <Card className="bg-black/60 backdrop-blur-lg border-2 border-white/30 relative overflow-hidden group hover:border-white/50 transition-all">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1.5 text-xs font-mono tracking-wider border-2 border-white z-10 font-bold">
                ⚡ x402 CREDITS
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>

              <CardContent className="p-8 relative z-10">
                <div className="flex items-center gap-2 mb-4 opacity-60">
                  <div className="w-6 h-px bg-white"></div>
                  <span className="text-white text-[9px] font-mono">TIER.02</span>
                </div>
                <h4 className="text-2xl font-bold text-white mb-2 font-mono tracking-wider">PAY-AS-YOU-GO</h4>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-white font-mono">$5</span>
                  <span className="text-white/40 text-sm font-mono">= 50 Credits</span>
                </div>
                <p className="text-xs text-white/60 font-mono mb-2">USDC on Base (x402)</p>
                <p className="text-xs text-white/50 font-mono mb-6 h-10">Weekend Trader</p>

                <div className="space-y-4 mb-10">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-white/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm font-bold mb-1">Honeypot Check</div>
                      <div className="text-white/50 text-xs font-mono">Included</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-white/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm font-bold mb-1">Risk Score</div>
                      <div className="text-white/50 text-xs font-mono">Included</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-white/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm font-bold mb-1">PDF Export</div>
                      <div className="text-white/50 text-xs font-mono">No watermark</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-white/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Cpu className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm font-bold mb-1">AI Analyst</div>
                      <div className="text-white/60 text-xs font-mono">1 Credit / report</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-white/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Eye className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm font-bold mb-1">Portfolio Audit</div>
                      <div className="text-white/60 text-xs font-mono">0.5 Credits / token</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 rounded-full mt-0.5 flex-shrink-0"></div>
                    <div>
                      <div className="text-white/40 font-mono text-sm font-bold mb-1">Smart Alerts</div>
                      <div className="text-white/30 text-xs font-mono">Not available</div>
                    </div>
                  </div>
                </div>

                <Link href="/pay-per-scan" className="block">
                  <button className="w-full px-6 py-4 bg-white text-black border-2 border-white font-mono text-sm hover:bg-transparent hover:text-white transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-105 transform font-bold">
                    BUY CREDITS
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </CardContent>
            </Card>

            {/* Tier 3: Pro Plan */}
            <Card className="bg-gradient-to-br from-white/10 to-black/60 backdrop-blur-lg border-2 border-white relative overflow-hidden group hover:border-white/80 transition-all">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1.5 text-xs font-mono tracking-wider border-2 border-white z-10 font-bold">
                ⚡ RECOMMENDED
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>

              <CardContent className="p-8 relative z-10">
                <div className="flex items-center gap-2 mb-4 opacity-60">
                  <div className="w-6 h-px bg-white"></div>
                  <span className="text-white text-[9px] font-mono">TIER.03</span>
                </div>
                <h4 className="text-2xl font-bold text-white mb-2 font-mono tracking-wider">PRO PLAN</h4>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-white font-mono">$29</span>
                  <span className="text-white/40 text-sm font-mono">/month</span>
                </div>
                <p className="text-xs text-white/50 font-mono mb-8 h-10">Active Power User</p>

                <div className="space-y-4 mb-10">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-white/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm font-bold mb-1">Honeypot Check</div>
                      <div className="text-white/50 text-xs font-mono">Included</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-white/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <BarChart3 className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm font-bold mb-1">Risk Score</div>
                      <div className="text-white/50 text-xs font-mono">Included</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-white/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm font-bold mb-1">PDF Export</div>
                      <div className="text-white/50 text-xs font-mono">Custom logo branding</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-white/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Cpu className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm font-bold mb-1">AI Analyst</div>
                      <div className="text-white/60 text-xs font-mono">✓ Unlimited</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-white/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Eye className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm font-bold mb-1">Portfolio Audit</div>
                      <div className="text-white/60 text-xs font-mono">✓ Unlimited</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 border border-white/30 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Bell className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm font-bold mb-1">Smart Alerts</div>
                      <div className="text-white/60 text-xs font-mono">Real-Time 24/7</div>
                    </div>
                  </div>
                </div>

                <Link href="/pricing" className="block">
                  <button className="w-full px-6 py-4 bg-white text-black font-mono text-sm hover:bg-transparent hover:text-white border-2 border-white transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-105 transform font-bold">
                    UPGRADE TO PRO
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* How Credits Work - Pay-As-You-Go */}
          <div className="mt-16 border border-white/20 bg-black/40 backdrop-blur-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 border border-white/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white font-mono tracking-wider">HOW CREDITS WORK</h3>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 border border-white/30 flex items-center justify-center mx-auto mb-3 text-white/90 font-mono font-bold">
                  1
                </div>
                <h4 className="text-white font-mono text-sm font-bold mb-2">SIGN IN</h4>
                <p className="text-white/60 text-xs font-mono leading-relaxed">
                  Log in using your Web3 Wallet via Firebase Authentication
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 border border-white/30 flex items-center justify-center mx-auto mb-3 text-white/90 font-mono font-bold">
                  2
                </div>
                <h4 className="text-white font-mono text-sm font-bold mb-2">TOP-UP</h4>
                <p className="text-white/60 text-xs font-mono leading-relaxed">
                  Click "Add Funds" and select $5.00 (50 Credits). Pay with USDC via x402
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 border border-white/30 flex items-center justify-center mx-auto mb-3 text-white/90 font-mono font-bold">
                  3
                </div>
                <h4 className="text-white font-mono text-sm font-bold mb-2">TRACK BALANCE</h4>
                <p className="text-white/60 text-xs font-mono leading-relaxed">
                  Dashboard displays progress bar: "Credits Remaining: 50 / 50"
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-white/10 border border-white/30 flex items-center justify-center mx-auto mb-3 text-white/90 font-mono font-bold">
                  4
                </div>
                <h4 className="text-white font-mono text-sm font-bold mb-2">USE INSTANTLY</h4>
                <p className="text-white/60 text-xs font-mono leading-relaxed">
                  Request AI Report (1 credit) or Portfolio Audit (0.5 credits/token). No wallet popup needed
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 border border-white/30 flex items-center justify-center flex-shrink-0">
                    <Cpu className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h5 className="text-white font-mono text-sm font-bold mb-1">AI ANALYST (1 Credit)</h5>
                    <p className="text-white/50 text-xs font-mono">Natural language risk explanation powered by Llama 3.3 70B</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 border border-white/30 flex items-center justify-center flex-shrink-0">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h5 className="text-white font-mono text-sm font-bold mb-1">PORTFOLIO AUDIT (0.5 Credits/token)</h5>
                    <p className="text-white/50 text-xs font-mono">Batch scan your wallet. 10 tokens = 5 credits ($0.50)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Justification */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card className="bg-black/40 backdrop-blur-lg border border-white/10">
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-white/10 border border-white/20 flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h5 className="text-white font-mono text-sm font-bold mb-2">FREE TIER</h5>
                <p className="text-white/50 text-xs font-mono leading-relaxed">
                  User acquisition funnel. Essential safety tools build trust and traffic. Fulfills ethical mission of fraud reduction.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-lg border border-white/10">
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-white/10 border border-white/20 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h5 className="text-white font-mono text-sm font-bold mb-2">PAY-AS-YOU-GO</h5>
                <p className="text-white/50 text-xs font-mono leading-relaxed">
                  Solves market gap. Traditional processors can&apos;t handle $0.10 profitably. x402 enables micropayments, covering API costs in real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-lg border border-white/10">
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-white/10 border border-white/20 flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <h5 className="text-white font-mono text-sm font-bold mb-2">PRO PLAN</h5>
                <p className="text-white/50 text-xs font-mono leading-relaxed">
                  Long-term viability. $29/month covers VPS costs for 24/7 Smart Alert workers and unlimited API access for power users.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Money-back guarantee */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/20 backdrop-blur-sm">
              <Shield className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-mono">30-DAY MONEY-BACK GUARANTEE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative px-6 py-32 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-white font-mono tracking-wider mb-6">
            ELEVATE YOUR TOKEN RESEARCH
          </h2>
          <p className="text-white/70 text-base lg:text-lg font-mono mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of traders using Tokenomics Lab for comprehensive token analysis, risk assessment, and data-driven investment decisions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signup">
              <button className="px-10 py-5 bg-white text-black font-mono text-base border-2 border-white hover:bg-transparent hover:text-white transition-all duration-200 group font-bold">
                <span className="flex items-center gap-2 justify-center">
                  GET STARTED FREE
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>

            <Link href="/dashboard">
              <button className="px-10 py-5 bg-transparent border-2 border-white text-white font-mono text-base hover:bg-white/10 transition-all duration-200">
                VIEW DEMO
              </button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 text-white/40 text-xs font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>NO CREDIT CARD</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>FREE FOREVER</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>INSTANT ACCESS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-white" />
                <span className="text-white font-mono font-bold tracking-wider">TOKENGUARD</span>
              </div>
              <p className="text-white/60 font-mono text-xs leading-relaxed">
                Advanced token analysis and security insights for informed crypto decisions.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-mono font-bold text-sm mb-4 uppercase tracking-wider">PRODUCT</h4>
              <ul className="space-y-2">
                <li><Link href="/pricing" className="text-white/60 hover:text-white font-mono text-xs transition">Pricing</Link></li>
                <li><Link href="/signup" className="text-white/60 hover:text-white font-mono text-xs transition">Sign Up</Link></li>
                <li><Link href="/login" className="text-white/60 hover:text-white font-mono text-xs transition">Log In</Link></li>
                <li><Link href="/dashboard" className="text-white/60 hover:text-white font-mono text-xs transition">Demo</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-mono font-bold text-sm mb-4 uppercase tracking-wider">RESOURCES</h4>
              <ul className="space-y-2">
                <li><Link href="/docs" className="text-white/60 hover:text-white font-mono text-xs transition">Documentation</Link></li>
                <li><Link href="/profile" className="text-white/60 hover:text-white font-mono text-xs transition">Profile</Link></li>
                <li><Link href="/contact" className="text-white/60 hover:text-white font-mono text-xs transition">Contact</Link></li>
                <li><Link href="/privacy-settings" className="text-white/60 hover:text-white font-mono text-xs transition">Privacy Settings</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-mono font-bold text-sm mb-4 uppercase tracking-wider">LEGAL</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-white/60 hover:text-white font-mono text-xs transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-white/60 hover:text-white font-mono text-xs transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 font-mono text-xs">
              © 2025 TOKENGUARD. ALL RIGHTS RESERVED.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-white/40 hover:text-white font-mono text-xs transition uppercase">Privacy</Link>
              <Link href="/terms" className="text-white/40 hover:text-white font-mono text-xs transition uppercase">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
