'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { auth } from '@/lib/firebase'
import Navbar from '@/components/navbar'
import AIAnalysisAccordion from '@/components/ai-analysis-accordion'
import { MorphingSquare } from '@/components/ui/morphing-square'
import TokenSearchComponent from '@/components/token-search-cmc'
import DexSearchPremium from '@/components/dex-search-premium'
import SolanaHeliusPanel from '@/components/solana-helius-panel'
import Loader from '@/components/loader'
import AIExplanationPanel from '@/components/ai-explanation-panel'
import RiskOverview from '@/components/risk-overview'
import MarketMetrics from '@/components/market-metrics'
import HolderDistribution from '@/components/holder-distribution'
import { 
  Shield, TrendingUp, TrendingDown, Activity, Users, Droplet,
  Zap, Crown, AlertCircle, CheckCircle, Sparkles, BarChart3,
  Clock, Target, Plus, Search, Bell, Settings, LogOut, Menu, X,
  User, Flame, BadgeCheck, Loader2, AlertTriangle, Eye, RefreshCw,
  ChevronDown, ChevronUp, ArrowRight, Star, Bookmark, ExternalLink, Database
} from 'lucide-react'
import { TokenScanService, CompleteTokenData } from '@/lib/token-scan-service'
import type { RiskResult } from '@/lib/types/token-data'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { 
  getDashboardStats, 
  addToWatchlist, 
  removeFromWatchlist,
  getWatchlist,
  isInWatchlist
} from '@/lib/services/firestore-service'
import type { DashboardStats, WatchlistToken as FirestoreWatchlistToken } from '@/lib/firestore-schema'

interface WatchlistToken {
  address: string
  name: string
  symbol: string
  chain: string
  chainId: number
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  price: number
  change24h: number
  lastUpdated: number
  alerts: Alert[]
  behavioralSignals?: {
    holderVelocity?: number
    washTrading?: boolean
    smartMoney?: boolean
    liquidityStability?: number
  }
}

interface Alert {
  id: string
  type: 'risk_increase' | 'price_change' | 'holder_exodus' | 'liquidity_drop'
  severity: 'info' | 'warning' | 'critical'
  message: string
  timestamp: number
  read: boolean
}

interface PortfolioStats {
  totalTokens: number
  averageRiskScore: number
  criticalTokens: number
  totalScans: number
  behavioralInsights: number
}

export default function PremiumDashboard() {
  const router = useRouter()
  const { user, userProfile, loading: authLoading } = useAuth()
  
  // State management
  const [watchlist, setWatchlist] = useState<WatchlistToken[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Scan states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'bsc' | 'polygon' | 'avalanche' | 'solana'>('ethereum')
  const [manualTokenType, setManualTokenType] = useState<'MEME_TOKEN' | 'UTILITY_TOKEN' | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [scannedToken, setScannedToken] = useState<CompleteTokenData | null>(null)
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null)
  const [selectedToken, setSelectedToken] = useState<any>(null)
  const [isInWatchlistState, setIsInWatchlistState] = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  
  // Token suggestions state
  const [tokenSuggestions, setTokenSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showTokenSearch, setShowTokenSearch] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  
  // Historical data states
  const [timeframe, setTimeframe] = useState('30D')
  const [historicalData, setHistoricalData] = useState<{
    risk: any[]
    price: any[]
    holders: any[]
    volume: any[]
    transactions: any[]
    whales: any[]
  }>({
    risk: [],
    price: [],
    holders: [],
    volume: [],
    transactions: [],
    whales: []
  })
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Insight data states
  const [insightData, setInsightData] = useState<{
    sentiment: any | null
    security: any | null
    holders: any | null
  }>({
    sentiment: null,
    security: null,
    holders: null
  })
  const [loadingInsights, setLoadingInsights] = useState(false)
  
  // Recent activity state
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  
  // Helius data state (for Solana tokens)
  const [heliusData, setHeliusData] = useState<any>(null)
  
  // Wallet analysis state
  const [walletData, setWalletData] = useState<any>(null)
  const [loadingWallet, setLoadingWallet] = useState(false)
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.token-search-container')) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Check authentication and redirect FREE users to free dashboard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
    // No redirect - unified dashboard handles both free and premium users
  }, [user, userProfile, authLoading, router])
  
  // Determine if user has premium features
  const isPremium = userProfile?.plan === 'PREMIUM'
  
  // DEBUG: Log premium status
  useEffect(() => {
    console.log('🔍 PREMIUM STATUS:', {
      userProfile,
      plan: userProfile?.plan,
      isPremium,
      user: user?.email
    })
  }, [userProfile, isPremium, user])
  
  // Load dashboard data
  useEffect(() => {
    if (user && userProfile) {
      loadDashboardData()
    }
  }, [user, userProfile])
  
  // Check if scanned token is in watchlist
  useEffect(() => {
    if (selectedToken) {
      checkIfInWatchlist()
    }
  }, [selectedToken])
  
  const loadDashboardData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Load real data from Firebase
      const userPlan = userProfile?.plan === 'PREMIUM' ? 'PREMIUM' : 'FREE'
      const [stats, userWatchlist] = await Promise.all([
        getDashboardStats(user.uid, userPlan),
        getWatchlist(user.uid)
      ])
      
      // Convert Firestore watchlist to dashboard format
      const dashboardWatchlist: WatchlistToken[] = userWatchlist.map(token => {
        // Handle Firestore Timestamp properly - could be Timestamp or Date
        const lastUpdated = token.lastUpdatedAt 
          ? (typeof (token.lastUpdatedAt as any).toDate === 'function' 
              ? (token.lastUpdatedAt as any).toDate().getTime() 
              : (token.lastUpdatedAt instanceof Date ? token.lastUpdatedAt.getTime() : Date.now()))
          : Date.now()
        
        return {
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          chain: typeof token.chainId === 'number' ? `Chain ${token.chainId}` : token.chainId,
          chainId: typeof token.chainId === 'number' ? token.chainId : 1,
          riskScore: token.latestAnalysis?.riskScore || 0,
          riskLevel: token.latestAnalysis?.riskLevel || 'MEDIUM',
          price: token.marketData?.price || 0,
          change24h: token.marketData?.priceChange24h || 0,
          lastUpdated,
          alerts: [],
          behavioralSignals: {
            holderVelocity: 0,
            washTrading: false,
            smartMoney: false,
            liquidityStability: 0
          }
        }
      })
      
      setWatchlist(dashboardWatchlist)
      setAlerts([]) // TODO: Load alerts from Firebase
      
      // Calculate portfolio stats from Firebase data
      const criticalTokens = dashboardWatchlist.filter(t => t.riskLevel === 'CRITICAL').length
      const avgRisk = dashboardWatchlist.length > 0
        ? Math.round(dashboardWatchlist.reduce((sum, t) => sum + t.riskScore, 0) / dashboardWatchlist.length)
        : 0
      
      setPortfolioStats({
        totalTokens: stats.watchlistCount,
        averageRiskScore: avgRisk,
        criticalTokens: criticalTokens,
        totalScans: stats.tokensAnalyzed,
        behavioralInsights: 0 // TODO: Calculate from behavioral data
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
      // Set empty state on error
      setWatchlist([])
      setAlerts([])
      setPortfolioStats({
        totalTokens: 0,
        averageRiskScore: 0,
        criticalTokens: 0,
        totalScans: 0,
        behavioralInsights: 0
      })
    } finally {
      setLoading(false)
    }
  }
  

  
  const searchTokenSuggestions = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setTokenSuggestions([])
      setShowSuggestions(false)
      return
    }

    // If it's a contract address (0x... or Solana address), don't show suggestions
    if (query.startsWith('0x') || query.length > 40) {
      setTokenSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoadingSuggestions(true)
    try {
      // Use CoinMarketCap search (faster and supports Solana)
  // Pass selectedChain to the search endpoint so results can be filtered
  // to the chain the user selected (prevents returning Ethereum tokens
  // when the user explicitly chose Solana).
  const response = await fetch(`/api/search-token?query=${encodeURIComponent(query)}&chain=${encodeURIComponent(selectedChain)}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.results && data.results.length > 0) {
          // Transform CMC results to match expected format
          const transformedTokens = data.results.map((token: any) => ({
            symbol: token.symbol,
            name: token.name,
            address: token.address,
            chainId: getChainIdFromName(token.chain),
            chainName: token.chain,
            marketCap: null, // CMC doesn't return this in search
            logo: null
          })).filter((t: any) => t.address) // Only show tokens with addresses
          
          setTokenSuggestions(transformedTokens)
          setShowSuggestions(transformedTokens.length > 0)
        }
      }
    } catch (error) {
      console.error('[Suggestions] Failed to fetch:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Helper to convert chain name to chainId
  const getChainIdFromName = (chainName: string): string => {
    if (!chainName) return '1'
    const lower = chainName.toLowerCase()
    
    if (lower.includes('ethereum')) return '1'
    if (lower.includes('bsc') || lower.includes('binance')) return '56'
    if (lower.includes('polygon')) return '137'
    if (lower.includes('avalanche')) return '43114'
    if (lower.includes('arbitrum')) return '42161'
    if (lower.includes('solana')) return '1399811149'
    if (lower.includes('optimism')) return '10'
    if (lower.includes('base')) return '8453'
    
    return '1' // Default to Ethereum
  }

  const handleSelectSuggestion = (token: any) => {
    setSearchQuery(token.address)
    setShowSuggestions(false)
    setTokenSuggestions([])
    
    // Determine the correct chain from token data
    let chainToUse: 'ethereum' | 'bsc' | 'polygon' | 'avalanche' | 'solana' = 'ethereum'
    if (token.chainName) {
      const chainLower = token.chainName.toLowerCase()
      if (chainLower.includes('ethereum')) chainToUse = 'ethereum'
      else if (chainLower.includes('bsc') || chainLower.includes('binance')) chainToUse = 'bsc'
      else if (chainLower.includes('polygon')) chainToUse = 'polygon'
      else if (chainLower.includes('avalanche')) chainToUse = 'avalanche'
      else if (chainLower.includes('solana')) chainToUse = 'solana'
      
      console.log(`[Dashboard] Selected chain from suggestion: ${chainLower} -> ${chainToUse}`)
    }
    
    setSelectedChain(chainToUse)
    
    // Automatically trigger scan with the correct chain
    setTimeout(() => {
      handleScan(chainToUse)
    }, 100)
  }

  // Handle token selection from CMC search
  const handleTokenSelectFromSearch = async (address: string, chain: string, symbol: string, name: string) => {
    console.log(`[Premium Dashboard] Token selected from search: ${name} (${symbol}) on ${chain}`)
    console.log(`[Premium Dashboard] Address: ${address}`)
    
    // Determine the chain to use
    let chainToScan: 'ethereum' | 'bsc' | 'polygon' | 'avalanche' | 'solana' = 'ethereum';
    const chainLower = chain.toLowerCase()
    if (chainLower.includes('ethereum')) chainToScan = 'ethereum';
    else if (chainLower.includes('bsc') || chainLower.includes('binance')) chainToScan = 'bsc';
    else if (chainLower.includes('polygon')) chainToScan = 'polygon';
    else if (chainLower.includes('avalanche')) chainToScan = 'avalanche';
    else if (chainLower.includes('solana')) chainToScan = 'solana';
    
    // Set the state for the UI
    setSelectedChain(chainToScan);
    setSearchQuery(address)
    
    // Close all modals and popups immediately
    setShowSuggestions(false)
    setShowSearchModal(false)
    setShowTokenSearch(false)
    
    // Small delay to ensure modal closes before scan starts
    setTimeout(() => {
      // Trigger scan with the address passed directly (fixes race condition)
      handleScan(chainToScan, address)
      
      // Smooth scroll to scanner section after modal closes
      setTimeout(() => {
        const scannerElement = document.getElementById('scanner')
        if (scannerElement) {
          scannerElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 200)
    }, 100)
  }

  const handleScan = async (chainOverride?: 'ethereum' | 'bsc' | 'polygon' | 'avalanche' | 'solana', addressOverride?: string) => {
    // Use addressOverride if provided, otherwise use searchQuery
    const queryToUse = addressOverride || searchQuery
    if (!queryToUse.trim()) return
    
    if (!user) {
      setScanError('USER NOT AUTHENTICATED. PLEASE LOGIN AGAIN.')
      return
    }
    
    // Check scan limit for FREE users (20 scans per day)
    if (!isPremium && portfolioStats && portfolioStats.totalScans >= 20) {
      setScanError('DAILY LIMIT REACHED (20/20). UPGRADE TO PREMIUM FOR UNLIMITED SCANS.')
      return
    }
    
    // Prioritize chainOverride. If no override, use selectedChain. If the query itself is a Solana address, force solana.
    let chainToUse = chainOverride || selectedChain
    
    // Force chain detection based on address format
    const isEVMAddress = queryToUse.startsWith('0x') && queryToUse.length === 42
    const isSolanaAddress = queryToUse.length >= 32 && queryToUse.length <= 44 && !queryToUse.startsWith('0x')
    
    if (isSolanaAddress && !chainOverride) {
      chainToUse = 'solana'
      console.log('[Scanner] Solana address detected from query, forcing chain to solana')
    }
    
    console.log(`[Scanner] ========== NEW SCAN ==========`)
    console.log(`[Scanner] Query: ${queryToUse}`)
    console.log(`[Scanner] Chain: ${chainToUse}`)
    console.log(`[Scanner] Chain Override: ${chainOverride || 'NONE'}`)
    console.log(`[Scanner] Address Override: ${addressOverride || 'NONE'}`)
    console.log(`[Scanner] Manual Classification: ${manualTokenType || 'AUTO DETECT'}`)
    
    setScanning(true)
    setScanError('')
    setSelectedToken(null)
    setScannedToken(null)
    setRiskResult(null)
    setShowSuggestions(false)
    setShowSearchModal(false)
    setShowTokenSearch(false) // Close all modals when scan starts
    
    // Scroll to top of page smoothly when scan starts
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    try {
      console.log('[Scanner] Starting scan for:', queryToUse)
      
      // Check if input is an address (supports both EVM and Solana)
      let addressToScan = queryToUse
      const isAddress = isEVMAddress || isSolanaAddress
      
      if (!isAddress) {
        console.log('[Scanner] Not an address, searching for token:', queryToUse)
        try {
          // Use faster CoinMarketCap search
          // When resolving a symbol to an address, include the selectedChain so
          // the search prefers tokens on the chosen network.
          const searchRes = await fetch(`/api/search-token?query=${encodeURIComponent(queryToUse)}&chain=${encodeURIComponent(chainToUse)}`)
          if (searchRes.ok) {
            const searchData = await searchRes.json()
            if (searchData.results && searchData.results.length > 0) {
              // Use the first matching token's address
              addressToScan = searchData.results[0].address
              console.log('[Scanner] Resolved to address:', addressToScan)
              
              // Also update the chain selector if we got chain info
              const chainName = searchData.results[0].chain?.toLowerCase()
              if (chainName) {
                if (chainName.includes('ethereum')) setSelectedChain('ethereum')
                else if (chainName.includes('bsc') || chainName.includes('binance')) setSelectedChain('bsc')
                else if (chainName.includes('polygon')) setSelectedChain('polygon')
                else if (chainName.includes('avalanche')) setSelectedChain('avalanche')
                else if (chainName.includes('solana')) setSelectedChain('solana')
              }
            } else {
              console.log('[Scanner] No matching tokens found, proceeding with original query')
            }
          }
        } catch (searchError) {
          console.warn('[Scanner] Token search failed, proceeding with original query:', searchError)
        }
      }
      
  // Pass user's selected chain preference to the scanner so chain detection
  // prefers the explicit selection (prevents defaulting to Ethereum for symbols)
  const data = await TokenScanService.scanToken(addressToScan, chainToUse)
      console.log('[Scanner] Scan complete:', data)
      
      setScannedToken(data)
      
      // Check if we have a valid contract address (supports both EVM and Solana)
      const isValidEVMAddress = data.address && data.address !== 'N/A' && data.address.startsWith('0x')
      const isValidSolanaAddress = data.address && data.address !== 'N/A' && data.address.length >= 32 && data.address.length <= 44 && !data.address.startsWith('0x')
      const hasValidAddress = (isValidEVMAddress || isValidSolanaAddress) && data.chainInfo?.chainId
      
      // Override chainId for Solana if needed
      if (isValidSolanaAddress && data.chainInfo) {
        console.log('[Scanner] Detected Solana address, setting chainId to 1399811149')
        ;(data.chainInfo as any).chainId = 1399811149
      }
      
      if (hasValidAddress && data.chainInfo) {
        console.log('[Scanner] Analyzing token:', data.address, 'on chain:', data.chainInfo.chainId, '(Solana:', isValidSolanaAddress, ')')
        
        // Prepare metadata for AI meme detection and Twitter metrics
        const secData = data.securityData as any
        const tokenSymbol = data.priceData?.symbol || secData?.token_symbol || searchQuery.toUpperCase()
        const tokenName = data.priceData?.name || secData?.token_name || searchQuery
        
        console.log('[Scanner] Token metadata:', { symbol: tokenSymbol, name: tokenName })
        
        // Ensure we send a canonical chainId value to the analyze API. Some
        // downstream services expect numeric/GoPlus-compatible chain IDs; if
        // the user explicitly selected Solana, force the numeric chainId used
        // elsewhere (1399811149). Otherwise prefer the scanned data.chainInfo
        // value and fall back to chainToUse mapping.
        const computeChainIdToSend = (): string => {
          // If a chain override is present, prioritize it.
          if (chainOverride) {
            const overrideLower = chainOverride.toLowerCase();
            if (overrideLower.includes('sol')) return String(1399811149);
            if (overrideLower.includes('bsc')) return '56';
            if (overrideLower.includes('polygon')) return '137';
            if (overrideLower.includes('avalanche')) return '43114';
            if (overrideLower.includes('ethereum')) return '1';
          }

          // If the computed chainToUse is set, use that
          const sel = String(chainToUse || '').toLowerCase()
          if (sel.includes('sol')) return String(1399811149)
          if (sel.includes('bsc')) return '56'
          if (sel.includes('polygon') || sel.includes('matic')) return '137'
          if (sel.includes('avalanche') || sel.includes('avax')) return '43114'
          if (sel.includes('arbitrum')) return '42161'
          if (sel.includes('optimism')) return '10'
          if (sel.includes('base')) return '8453'

          // If scanner returned a chainInfo with a numeric-looking chainId, use it
          const returned = data.chainInfo?.chainId
          if (returned && String(returned).match(/^\d+$/)) return String(returned)

          // Last resort default to Ethereum
          return '1'
        }

        const chainIdToSend = computeChainIdToSend()

        // Use the full multi-API analyze endpoint
        // Debug: log the chain information we will send to the analyze API
        console.log('[Scanner] Sending analyze request with chainId:', chainIdToSend)
        console.log('[Scanner] Sending analyze metadata.chain:', {
          computed: (() => {
            const name = String(data.chainInfo?.chainName || '').toLowerCase()
            if (name.includes('solana')) return 'SOLANA'
            if (name.includes('ethereum')) return 'ETHEREUM'
            if (name.includes('bsc') || name.includes('binance')) return 'BSC'
            if (name.includes('polygon')) return 'POLYGON'
            if (name.includes('avalanche') || name.includes('avax')) return 'AVALANCHE'
            if (name.includes('arbitrum')) return 'ARBITRUM'
            if (name.includes('optimism')) return 'OPTIMISM'
            if (name.includes('base')) return 'BASE'
            const sel2 = String(chainToUse || '').toLowerCase()
            if (sel2.includes('sol')) return 'SOLANA'
            return 'ETHEREUM'
          })(),
          selectedChain
        })

        const res = await fetch('/api/analyze-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tokenAddress: data.address,
            chainId: String(chainIdToSend),
            plan: 'PREMIUM', // Use PREMIUM plan for full behavioral data
            userId: user?.uid, // Pass user ID for rate limiting
            bypassCache: true, // Always bypass cache for user-initiated scans
            forceFresh: true, // Force fresh data fetch
            metadata: {
              tokenSymbol,
              tokenName,
              chain: (() => {
                const name = String(data.chainInfo?.chainName || '').toLowerCase()
                if (name.includes('solana')) return 'SOLANA'
                if (name.includes('ethereum')) return 'ETHEREUM'
                if (name.includes('bsc') || name.includes('binance')) return 'BSC'
                if (name.includes('polygon')) return 'POLYGON'
                if (name.includes('avalanche') || name.includes('avax')) return 'AVALANCHE'
                if (name.includes('arbitrum')) return 'ARBITRUM'
                if (name.includes('optimism')) return 'OPTIMISM'
                if (name.includes('base')) return 'BASE'
                // Fallback to chainToUse
                const sel2 = String(chainToUse || '').toLowerCase()
                if (sel2.includes('sol')) return 'SOLANA'
                if (sel2.includes('bsc')) return 'BSC'
                if (sel2.includes('polygon') || sel2.includes('matic')) return 'POLYGON'
                if (sel2.includes('avalanche') || sel2.includes('avax')) return 'AVALANCHE'
                if (sel2.includes('arbitrum')) return 'ARBITRUM'
                if (sel2.includes('optimism')) return 'OPTIMISM'
                if (sel2.includes('base')) return 'BASE'
                return 'ETHEREUM'
              })(),
              manualClassification: manualTokenType // Send user's manual override if set
            }
          })
        })
        
        console.log('[Scanner] API response status:', res.status)
        
        if (res.ok) {
          const result = await res.json()
          console.log('Full risk analysis received:', result)
          console.log('[AI Insights]:', result.ai_insights)
          console.log('[Twitter Metrics]:', result.twitter_metrics)
          
          // Extract data from enhanced result
          const riskScore = result.overall_risk_score || 15
          const criticalFlags = result.critical_flags || []
          const redFlags = result.warning_flags || []
          const positiveSignals = result.positive_signals || []
          const breakdown = result.breakdown || {}
          
          // Debug logging
          console.log('[Dashboard] Risk Analysis:', {
            symbol: data.priceData?.symbol,
            overallRisk: riskScore,
            breakdown,
            isMeme: result.is_meme_token,
            classification: result.ai_insights?.classification,
            logo: data.priceData?.logo
          })
          
          setSelectedToken({
            name: data.priceData?.name || 'Unknown',
            symbol: data.priceData?.symbol || searchQuery.toUpperCase(),
            address: data.address,
            chain: data.chainInfo?.chainName || 'Unknown',
            chainId: data.chainInfo?.chainId || 1,
            marketCap: formatMarketCap(data.priceData?.marketCap),
            price: data.priceData?.price || 0,
            age: result.data_freshness ? `${result.data_freshness} days` : 'N/A',
            overallRisk: riskScore,
            confidence: result.confidence_score || 90,
            lastUpdated: 'just now',
            factors: {
              supplyDilution: breakdown.supplyDilution || 0,
              holderConcentration: breakdown.holderConcentration || 0,
              liquidityDepth: breakdown.liquidityDepth || 0,
              vestingUnlock: breakdown.vestingUnlock || 0,
              contractControl: breakdown.contractControl || 0,
              taxFee: breakdown.taxFee || 0,
              distribution: breakdown.distribution || 0,
              burnDeflation: breakdown.burnDeflation || 0,
              adoption: breakdown.adoption || 0,
              auditTransparency: breakdown.auditTransparency || 0
            },
            redFlags,
            positiveSignals,
            criticalFlags,
            rawData: data,
            enhancedData: result, // Store full result for debugging
            ai_insights: result.ai_insights, // Add AI insights
            twitter_metrics: result.twitter_metrics // Add Twitter metrics
          })
          
          setTimeout(() => {
            document.getElementById('scan-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        } else {
          const errorData = await res.json().catch(() => ({}))
          const errorMessage = errorData.error || errorData.message || 'Unable to analyze token'
          setScanError(`API ERROR: ${res.status} - ${errorMessage}`)
          console.error('API Error:', errorData)
        }
      } else {
        // Symbol search (BTC, ETH, etc.) - no contract address available
        console.log('[Scanner] Symbol search - no contract address available')
        const tokenName = data.priceData?.name || searchQuery.toUpperCase()
        const tokenSymbol = data.priceData?.symbol || searchQuery.toUpperCase()
        const isWellKnown = ['BTC', 'ETH', 'BNB', 'SOL', 'USDT', 'USDC', 'ADA', 'XRP', 'DOT', 'DOGE', 'MATIC', 'AVAX'].includes(searchQuery.toUpperCase())
        
        setSelectedToken({
          name: tokenName,
          symbol: tokenSymbol,
          address: 'N/A (Native Asset)',
          chain: data.chainInfo?.chainName || 'Multi-Chain',
          marketCap: formatMarketCap(data.priceData?.marketCap),
          price: data.priceData?.price || 0,
          age: isWellKnown ? 'Established (5+ years)' : 'Unknown',
          overallRisk: isWellKnown ? 5 : 15, // Well-known assets are very low risk
          confidence: 90,
          lastUpdated: 'just now',
          factors: {
            supplyDilution: isWellKnown ? 5 : 15,
            holderConcentration: isWellKnown ? 10 : 25,
            liquidityDepth: isWellKnown ? 5 : 15,
            marketActivity: isWellKnown ? 5 : 10,
            burnMechanics: 0, // N/A for most native assets
            tokenAge: isWellKnown ? 3 : 10
          },
          redFlags: isWellKnown ? [] : ['! Use contract address for detailed smart contract analysis'],
          positiveSignals: isWellKnown ? [
            `✓ ${tokenSymbol} is a well-established cryptocurrency`,
            '✓ High liquidity and market presence',
            '✓ Large community and developer support'
          ] : [
            '✓ Price data available',
            '✓ Market cap tracked'
          ],
          criticalFlags: [],
          rawData: data,
          isSymbolSearch: true // Flag to show this is a symbol, not a smart contract
        })
        
        // Log symbol search information
        if (isWellKnown) {
          console.log(`[Scanner] ${tokenSymbol} market data loaded - well-established cryptocurrency`)
        } else {
          console.log('[Scanner] Symbol search - use contract address (0x...) for full smart contract analysis')
        }
        
        setTimeout(() => {
          document.getElementById('scan-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    } catch (err: any) {
      setScanError(err.message || 'SCAN FAILED. PLEASE TRY AGAIN.')
    } finally {
      setScanning(false)
    }
  }
  
  const formatMarketCap = (cap?: number): string => {
    if (!cap) return 'N/A'
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`
    if (cap >= 1e3) return `$${(cap / 1e3).toFixed(2)}K`
    return `$${cap.toFixed(2)}`
  }
  
  const getTokenAge = (analyzedAt: Date | any): string => {
    if (!analyzedAt) return 'N/A'
    const date = analyzedAt instanceof Date ? analyzedAt : new Date(analyzedAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays > 365) return `${Math.floor(diffDays / 365)}Y OLD`
    if (diffDays > 30) return `${Math.floor(diffDays / 30)}MO OLD`
    if (diffDays > 0) return `${diffDays}D OLD`
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours > 0) return `${diffHours}H OLD`
    
    const diffMins = Math.floor(diffMs / (1000 * 60))
    return `${diffMins}M OLD`
  }
  
  const handleAddToWatchlist = async () => {
    if (!user || !selectedToken) return
    
    // Don't allow adding symbols without valid contract addresses to watchlist
    if (!selectedToken.address || selectedToken.address === 'N/A (Native Asset)' || selectedToken.address === 'N/A') {
      setScanError('Cannot add symbols to watchlist. Please search for a contract address.')
      return
    }
    
    setWatchlistLoading(true)
    try {
      const watchlistToken: FirestoreWatchlistToken = {
        address: selectedToken.address,
        name: selectedToken.name,
        symbol: selectedToken.symbol,
        chainId: selectedToken.chain,
        latestAnalysis: {
          riskScore: selectedToken.overallRisk,
          riskLevel: selectedToken.overallRisk < 30 ? 'LOW' : 
                     selectedToken.overallRisk < 60 ? 'MEDIUM' : 
                     selectedToken.overallRisk < 80 ? 'HIGH' : 'CRITICAL',
          analyzedAt: new Date(),
          breakdown: {
            supplyDilution: selectedToken.factors.supplyRisk || 0,
            holderConcentration: selectedToken.factors.whaleConcentration || 0,
            liquidityDepth: selectedToken.factors.liquidityDepth || 0,
            vestingUnlock: 0,
            contractControl: selectedToken.factors.contractSecurity || 0,
            taxFee: 0,
            distribution: 0,
            burnDeflation: selectedToken.factors.burnMechanics || 0,
            adoption: selectedToken.factors.marketActivity || 0,
            auditTransparency: selectedToken.factors.tokenAge || 0
          }
        },
        marketData: {
          price: selectedToken.price,
          priceChange24h: 0,
          marketCap: parseFloat(selectedToken.marketCap.replace(/[$,KMB]/g, '')) || 0,
          volume24h: 0,
          liquidity: 0
        },
        alertsEnabled: true,
        alertThreshold: 20,
        notes: '',
        tags: [],
        addedAt: new Date(),
        lastUpdatedAt: new Date()
      }

      await addToWatchlist(user.uid, watchlistToken)
      setIsInWatchlistState(true)
      
      // Reload watchlist
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to add to watchlist:', error)
      setScanError('FAILED TO ADD TO WATCHLIST')
    } finally {
      setWatchlistLoading(false)
    }
  }
  
  const handleRemoveFromWatchlist = async () => {
    if (!user || !selectedToken) return
    
    setWatchlistLoading(true)
    try {
      await removeFromWatchlist(user.uid, selectedToken.address)
      setIsInWatchlistState(false)
      
      // Reload watchlist
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to remove from watchlist:', error)
    } finally {
      setWatchlistLoading(false)
    }
  }
  
  const checkIfInWatchlist = async () => {
    if (!user || !selectedToken) return
    
    // Skip watchlist check for symbols without valid addresses
    if (!selectedToken.address || 
        selectedToken.address === 'N/A (Native Asset)' || 
        selectedToken.address === 'N/A' || 
        !selectedToken.address.startsWith('0x')) {
      setIsInWatchlistState(false)
      return
    }
    
    try {
      const inWatchlist = await isInWatchlist(user.uid, selectedToken.address)
      setIsInWatchlistState(inWatchlist)
    } catch (error) {
      console.error('Failed to check watchlist:', error)
    }
  }
  
  const loadHistoricalData = async (address: string, selectedTimeframe: string = timeframe) => {
    console.log('📊 [loadHistoricalData] Called with:', { address, selectedTimeframe })
    
    // Skip loading charts for invalid addresses
    if (!address || address === 'N/A (Native Asset)' || address === 'N/A') {
      console.log('⚠️ [loadHistoricalData] Skipping - invalid address:', address)
      setLoadingHistory(false)
      setHistoricalData({
        risk: [],
        price: [],
        holders: [],
        volume: [],
        transactions: [],
        whales: []
      })
      return
    }
    
    // Validate address format (EVM: 0x..., Solana: base58, etc.)
    const isValidAddress = address.startsWith('0x') || address.length > 32 // Solana addresses are 32-44 chars
    if (!isValidAddress) {
      console.log('⚠️ [loadHistoricalData] Invalid address format:', address)
      setLoadingHistory(false)
      return
    }
    
    console.log('[Charts] Loading historical data for:', address, 'timeframe:', selectedTimeframe)
    setLoadingHistory(true)
    try {
      const types = ['risk', 'price', 'holders', 'volume', 'transactions', 'whales']
      
      // Fetch all historical data in parallel
      const results = await Promise.allSettled(
        types.map(type => {
          const url = `/api/token/history?address=${address}&type=${type}&timeframe=${selectedTimeframe}`
          console.log('[Charts] Fetching:', url)
          return fetch(url)
            .then(res => {
              console.log(`[Charts] ${type} response:`, res.status)
              return res.json()
            })
            .then(data => {
              console.log(`[Charts] ${type} data:`, data.success ? `${data.data?.length || 0} points` : 'failed')
              return { type, data: data.success ? data.data : [] }
            })
            .catch(err => {
              console.error(`[Charts] ${type} error:`, err)
              return { type, data: [] }
            })
        })
      )
      
      const newData: any = {
        risk: [],
        price: [],
        holders: [],
        volume: [],
        transactions: [],
        whales: []
      }
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const { type, data } = result.value
          newData[type] = data
        }
      })
      
      console.log('[Charts] Final historical data:', {
        risk: newData.risk.length,
        price: newData.price.length,
        holders: newData.holders.length,
        volume: newData.volume.length,
        transactions: newData.transactions.length,
        whales: newData.whales.length
      })
      
      setHistoricalData(newData)
    } catch (error) {
      console.error('[Charts] Failed to load historical data:', error)
    } finally {
      setLoadingHistory(false)
    }
  }
  
  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe)
    if (selectedToken) {
      loadHistoricalData(selectedToken.address, newTimeframe)
    }
  }
  
  const loadInsightData = async (address: string) => {
    console.log('💡 [loadInsightData] Called with:', { address })
    
    // Skip loading insights for symbols without valid contract addresses
    if (!address || address === 'N/A (Native Asset)' || address === 'N/A') {
      console.log('⚠️ [Insights] Skipping insights for invalid address:', address)
      setLoadingInsights(false)
      setInsightData({
        sentiment: null,
        security: null,
        holders: null
      })
      return
    }
    
    // Check if it's a valid address (EVM or Solana)
    const isEVMAddress = address.startsWith('0x') && address.length === 42
    const isSolanaAddress = address.length >= 32 && address.length <= 44 && !address.startsWith('0x')
    
    if (!isEVMAddress && !isSolanaAddress) {
      console.log('[Insights] Invalid address format, skipping insights')
      setLoadingInsights(false)
      setInsightData({
        sentiment: null,
        security: null,
        holders: null
      })
      return
    }
    
    console.log('[Insights] Loading insights for address:', address, isEVMAddress ? '(EVM)' : '(Solana)')
    
    setLoadingInsights(true)
    try {
      const types = ['sentiment', 'security', 'holders']
      
      console.log('[Insights] Fetching insights for types:', types)
      
      // Fetch all insight types in parallel
      const results = await Promise.allSettled(
        types.map(type =>
          fetch(`/api/token/insights?address=${address}&type=${type}`)
            .then(res => {
              console.log(`[Insights] ${type} response status:`, res.status)
              return res.json()
            })
            .then(data => {
              console.log(`[Insights] ${type} data:`, data)
              return { type, data: data.success ? data.data : null }
            })
        )
      )
      
      const newData: any = {
        sentiment: null,
        security: null,
        holders: null
      }
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const { type, data } = result.value
          newData[type] = data
        }
      })
      
      setInsightData(newData)
    } catch (error) {
      console.error('Failed to load insight data:', error)
    } finally {
      setLoadingInsights(false)
    }
  }
  
  // Load historical data and insights when a token is scanned or selected (PREMIUM only)
  useEffect(() => {
    console.log('🔍 DATA LOAD TRIGGER:', {
      isPremium,
      hasAddress: !!selectedToken?.address,
      address: selectedToken?.address,
      willLoad: isPremium && !!selectedToken?.address
    })
    
    if (isPremium && selectedToken?.address) {
      console.log('✅ Loading historical data and insights...')
      loadHistoricalData(selectedToken.address, timeframe)
      loadInsightData(selectedToken.address)
    } else {
      console.log('❌ Not loading data:', {
        reason: !isPremium ? 'Not premium' : 'No address'
      })
    }
  }, [selectedToken?.address, isPremium])
  
  if (authLoading || loading) {
    return <Loader fullScreen text="Loading dashboard" />
  }
  
  return (
    <div className="min-h-screen bg-black">
      {/* Scan Loader */}
      {scanning && <Loader fullScreen size="lg" text="Analyzing token" />}
      
      {/* Global Navbar */}
      <Navbar />

      {/* Background */}
      <div className="fixed inset-0 stars-bg pointer-events-none opacity-30"></div>
      <div className="fixed inset-0 grid-pattern pointer-events-none opacity-20"></div>

      {/* Main Content */}
      <main className="relative px-4 lg:px-8 py-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 opacity-60">
            <div className="w-8 h-px bg-white"></div>
            {isPremium ? <Crown className="w-4 h-4 text-yellow-400" /> : <Shield className="w-4 h-4 text-white" />}
            <span className="text-white text-[10px] font-mono tracking-wider">
              {isPremium ? 'PREMIUM TIER' : 'FREE TIER'}
            </span>
            <div className="flex-1 h-px bg-white"></div>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold text-white font-mono tracking-wider mb-2">
                {isPremium ? 'PREMIUM DASHBOARD' : 'DASHBOARD'}
              </h1>
              <div className="space-y-1">
                <p className="text-white/60 font-mono text-xs">
                  {user?.email?.toUpperCase()}
                </p>
                {!isPremium && (
                  <p className="text-yellow-400 font-mono text-xs">
                    {portfolioStats?.totalScans || 0}/20 SCANS TODAY
                  </p>
                )}
              </div>
            </div>
            {!isPremium && (
              <Link href="/pricing">
                <button className="px-6 py-3 bg-black border-2 border-white text-white font-mono text-sm hover:bg-white hover:text-black transition-all flex items-center gap-2 uppercase tracking-wider">
                  <Crown className="w-4 h-4" />
                  UPGRADE TO PREMIUM
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Grid - MOVED TO TOP */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={<Target />} label="TOTAL TOKENS" value={portfolioStats?.totalTokens || 0} />
          <StatCard icon={<Shield />} label="AVG RISK SCORE" value={portfolioStats?.averageRiskScore || 0} />
          <StatCard icon={<AlertCircle />} label="CRITICAL ALERTS" value={portfolioStats?.criticalTokens || 0} />
          <StatCard icon={<Activity />} label="TOTAL SCANS" value={portfolioStats?.totalScans || 0} />
          <StatCard icon={<Sparkles />} label="BEHAVIORAL INSIGHTS" value={portfolioStats?.behavioralInsights || 0} />
        </div>



        {/* Alerts Section - Enhanced */}
        {alerts.length > 0 && (
          <div className="relative border border-yellow-500/30 bg-black/40 backdrop-blur-xl p-6 mb-8 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/[0.05] to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-yellow-400 font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
                <div className="p-1.5 border border-yellow-500/30 bg-yellow-500/10">
                  <Bell className="w-4 h-4 animate-pulse" />
                </div>
                ACTIVE ALERTS ({alerts.length})
              </h2>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`group relative border backdrop-blur-md p-4 hover:scale-[1.01] transition-all duration-300 overflow-hidden ${
                    alert.severity === 'critical' ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50 hover:bg-red-500/10' :
                    alert.severity === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50 hover:bg-yellow-500/10' :
                    'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50 hover:bg-blue-500/10'
                  }`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${
                            alert.severity === 'critical' ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' :
                            alert.severity === 'warning' ? 'bg-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50' :
                            'bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50'
                          }`}></div>
                          <p className={`font-mono text-xs font-bold ${
                            alert.severity === 'critical' ? 'text-red-400' :
                            alert.severity === 'warning' ? 'text-yellow-400' :
                            'text-blue-400'
                          }`}>
                            {alert.message}
                          </p>
                        </div>
                        <p className="text-white/40 font-mono text-[10px] ml-4">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!alert.read && (
                        <span className="px-2 py-1 bg-white/20 border border-white/30 text-white font-mono text-[10px] tracking-wider animate-pulse">NEW</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wallet Analysis Section - Enhanced */}
        {user && (
          <div className="relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 mb-8 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-mono text-xs tracking-wider flex items-center gap-2">
                  <div className="p-1.5 border border-white/30 bg-black/40">
                    <User className="w-4 h-4" />
                  </div>
                  CONNECTED WALLET ANALYSIS
                </h2>
              <button
                onClick={async () => {
                  if (!user) return
                  setLoadingWallet(true)
                  try {
                    // Fetch wallet holdings from Moralis or similar API
                    const response = await fetch(`/api/wallet/analyze`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        walletAddress: user.email // In production, use actual connected wallet
                      })
                    })
                    const data = await response.json()
                    setWalletData(data)
                  } catch (error) {
                    console.error('Failed to load wallet data:', error)
                  } finally {
                    setLoadingWallet(false)
                  }
                }}
                disabled={loadingWallet}
                className="px-4 py-2 bg-transparent border-2 border-white/30 text-white font-mono text-[10px] hover:bg-white hover:text-black hover:border-white transition-all disabled:opacity-50 tracking-wider"
              >
                {loadingWallet ? (
                  <>
                    <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                    ANALYZING...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 inline mr-1" />
                    REFRESH WALLET
                  </>
                )}
              </button>
            </div>

            {walletData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="group relative border border-white/10 bg-black/40 backdrop-blur-md p-5 hover:border-white/30 hover:bg-black/50 transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <div className="relative">
                      <p className="text-white/60 font-mono text-[10px] mb-2 tracking-wider group-hover:text-white/80 transition-colors">TOTAL HOLDINGS</p>
                      <p className="text-white font-mono text-2xl font-bold drop-shadow-lg">${walletData.totalValue?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                  <div className="group relative border border-white/10 bg-black/40 backdrop-blur-md p-5 hover:border-white/30 hover:bg-black/50 transition-all duration-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <div className="relative">
                      <p className="text-white/60 font-mono text-[10px] mb-2 tracking-wider group-hover:text-white/80 transition-colors">TOKENS</p>
                      <p className="text-white font-mono text-2xl font-bold drop-shadow-lg">{walletData.tokenCount || 0}</p>
                    </div>
                  </div>
                  <div className="group relative border border-white/10 bg-black/40 backdrop-blur-md p-5 hover:border-white/30 hover:bg-black/50 transition-all duration-300 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                      (walletData.avgRiskScore || 0) < 30 ? 'from-green-500/[0.02]' :
                      (walletData.avgRiskScore || 0) < 60 ? 'from-yellow-500/[0.02]' :
                      'from-red-500/[0.02]'
                    } to-transparent`}></div>
                    <div className="relative">
                      <p className="text-white/60 font-mono text-[10px] mb-2 tracking-wider group-hover:text-white/80 transition-colors">AVG RISK SCORE</p>
                      <p className={`font-mono text-2xl font-bold drop-shadow-lg ${
                        (walletData.avgRiskScore || 0) < 30 ? 'text-green-400' :
                        (walletData.avgRiskScore || 0) < 60 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {walletData.avgRiskScore || 0}/100
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wallet Tokens List */}
                {walletData.tokens && walletData.tokens.length > 0 && (
                  <div className="border border-white/10 p-4">
                    <h3 className="text-white font-mono text-[10px] mb-3">YOUR TOKENS</h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {walletData.tokens.map((token: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-all">
                          <div className="flex-1">
                            <p className="text-white font-mono text-sm">{token.symbol}</p>
                            <p className="text-white/60 font-mono text-[10px]">{token.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-mono text-sm">{token.balance}</p>
                            <p className="text-white/60 font-mono text-[10px]">${token.value?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div className={`ml-4 px-2 py-1 border font-mono text-[10px] ${
                            token.riskScore < 30 ? 'border-green-500/30 bg-green-500/10 text-green-500' :
                            token.riskScore < 60 ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500' :
                            'border-red-500/30 bg-red-500/10 text-red-500'
                          }`}>
                            RISK: {token.riskScore || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-white/10 p-8 text-center">
                <User className="w-8 h-8 text-white/40 mx-auto mb-3" />
                <p className="text-white/60 font-mono text-xs mb-4">
                  Connect your wallet to analyze your token holdings and get personalized risk insights
                </p>
                <p className="text-white/40 font-mono text-[10px]">
                  Currently using: {user.email}
                </p>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Token Scanner - Click to Open Modal */}
        <div id="scanner">
        <button
          onClick={() => setShowSearchModal(true)}
          className="w-full relative border-2 border-white/20 bg-black/40 backdrop-blur-xl p-8 mb-8 shadow-2xl hover:border-white/40 hover:bg-black/50 transition-all duration-300 group"
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-cyan-500/[0.01] to-transparent"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="p-4 border-2 border-white/30 bg-black/40 group-hover:border-white/50 group-hover:scale-110 transition-all duration-300">
              <Search className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-white font-mono text-lg tracking-wider mb-2 group-hover:text-white/90 transition-colors">
                CLICK TO SCAN TOKEN
              </h2>
              <p className="text-white/60 font-mono text-xs tracking-wider">
                Search by name, symbol, or contract address
              </p>
            </div>
          </div>
        </button>
        </div>

        {/* Search Modal */}
        {showSearchModal && (
          <>
            {/* Full-Screen Glassmorphic Backdrop */}
            <div 
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] animate-in fade-in duration-300"
              onClick={() => setShowSearchModal(false)}
            >
              {/* Animated gradient orbs */}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>
            
            {/* Full-Screen Modal with DexSearchPremium */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-0 md:p-6">
              <div className="relative w-full h-full md:h-[95vh] md:max-w-7xl bg-black/40 backdrop-blur-2xl border-0 md:border border-white/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Glassmorphic overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-purple-500/[0.02] pointer-events-none" />
                
                {/* Content Area - Full Height */}
                <div className="relative z-10 overflow-y-auto h-full md:max-h-[98vh]">
                  <DexSearchPremium
                    onTokenSelect={handleSelectSuggestion}
                    onCMCTokenSelect={handleTokenSelectFromSearch}
                    selectedChain={selectedChain}
                    onChainChange={(chain) => setSelectedChain(chain as any)}
                    manualTokenType={manualTokenType}
                    onTokenTypeChange={(type) => setManualTokenType(type as any)}
                    scanning={scanning}
                    error={scanError}
                    onClose={() => setShowSearchModal(false)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Scan Results - Compact Layout */}
        {selectedToken && (
          <div id="scan-results" className="space-y-4 mb-8">
            
            {/* Compact Header Row with Logo */}
            <div className="border border-white/10 bg-black/40 backdrop-blur-xl p-5 transition-all duration-300 hover:border-white/20">
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Token Info with Logo */}
                <div className="flex items-center gap-4">
                  {/* Token Logo */}
                  <div className="w-14 h-14 rounded-full border-2 border-white/20 bg-black/40 p-1 flex items-center justify-center overflow-hidden">
                    {selectedToken.rawData?.priceData?.logo ? (
                      <img 
                        src={selectedToken.rawData.priceData.logo} 
                        alt={selectedToken.symbol}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const parent = e.currentTarget.parentElement
                          if (parent) {
                            e.currentTarget.style.display = 'none'
                            const fallback = document.createElement('span')
                            fallback.className = 'text-white/60 font-mono text-xl font-bold'
                            fallback.textContent = selectedToken.symbol.charAt(0)
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                    ) : (
                      <span className="text-white/60 font-mono text-xl font-bold">{selectedToken.symbol.charAt(0)}</span>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white font-mono">{selectedToken.symbol}</h2>
                      <span className="px-2 py-0.5 bg-white/10 border border-white/20 text-white/60 font-mono text-[9px]">
                        {selectedToken.chain}
                      </span>
                    </div>
                    <p className="text-white/60 font-mono text-xs mt-0.5">{selectedToken.name}</p>
                  </div>
                </div>

                {/* Risk Score - Compact with smooth animations */}
                <div className="flex items-center gap-6">
                  {selectedToken.price > 0 && (
                    <div className="text-right transition-all duration-300">
                      <div className="text-white/50 font-mono text-[9px]">PRICE</div>
                      <div className="text-white font-mono text-lg font-bold transition-all duration-300">
                        ${selectedToken.price >= 1 
                          ? selectedToken.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : selectedToken.price >= 0.01
                          ? selectedToken.price.toFixed(4)
                          : selectedToken.price.toFixed(8)
                        }
                      </div>
                    </div>
                  )}
                  
                  {selectedToken.marketCap && selectedToken.marketCap !== 'N/A' && (
                    <div className="text-right transition-all duration-300">
                      <div className="text-white/50 font-mono text-[9px]">MARKET CAP</div>
                      <div className="text-white font-mono text-sm font-bold transition-all duration-300">{selectedToken.marketCap}</div>
                    </div>
                  )}

                  <div className="border-l border-white/20 pl-6 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className={`text-5xl font-bold font-mono transition-all duration-500 ${
                        selectedToken.overallRisk < 30 ? 'text-green-400' :
                        selectedToken.overallRisk < 60 ? 'text-yellow-400' :
                        selectedToken.overallRisk < 80 ? 'text-orange-400' : 'text-red-400'
                      }`}>
                        {selectedToken.overallRisk}
                      </div>
                      <div>
                        <div className="text-white/50 font-mono text-[9px]">RISK SCORE</div>
                        <div className={`font-mono text-xs font-bold transition-all duration-300 ${
                          selectedToken.overallRisk < 30 ? 'text-green-400' :
                          selectedToken.overallRisk < 60 ? 'text-yellow-400' :
                          selectedToken.overallRisk < 80 ? 'text-orange-400' : 'text-red-400'
                        }`}>
                          {selectedToken.overallRisk < 30 ? 'LOW RISK' :
                           selectedToken.overallRisk < 60 ? 'MEDIUM' :
                           selectedToken.overallRisk < 80 ? 'HIGH' : 'CRITICAL'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 mb-6"></div>

            {/* AI Explanation Panel - Prominent Display */}
            {selectedToken.ai_summary && (
              <AIExplanationPanel 
                aiSummary={selectedToken.ai_summary}
                riskScore={selectedToken.overallRisk}
                riskLevel={selectedToken.overallRisk < 30 ? 'LOW' : selectedToken.overallRisk < 60 ? 'MEDIUM' : selectedToken.overallRisk < 80 ? 'HIGH' : 'CRITICAL'}
              />
            )}

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {/* Watchlist Button - Only show for valid contract addresses */}
              {selectedToken.address && 
               selectedToken.address !== 'N/A (Native Asset)' && 
               selectedToken.address !== 'N/A' && 
               selectedToken.address.startsWith('0x') ? (
                <>
                  {isInWatchlistState ? (
                    <button
                      onClick={handleRemoveFromWatchlist}
                      disabled={watchlistLoading}
                      className="flex items-center gap-2 px-5 py-3 bg-black border-2 border-white text-white font-mono text-xs tracking-wider hover:bg-white hover:text-black transition-all disabled:opacity-50 uppercase"
                    >
                      {watchlistLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          UPDATING...
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4 fill-current" />
                          IN WATCHLIST
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToWatchlist}
                      disabled={watchlistLoading}
                      className="flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/30 text-white font-mono text-xs tracking-wider hover:bg-white hover:text-black hover:border-white transition-all disabled:opacity-50 backdrop-blur-md"
                    >
                      {watchlistLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          ADDING...
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4" />
                          ADD TO WATCHLIST
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 text-white/40 font-mono text-xs tracking-wider cursor-not-allowed">
                  <Star className="w-4 h-4" />
                  WATCHLIST UNAVAILABLE (NATIVE ASSET)
                </div>
              )}

              {/* View on Explorer Button */}
              {selectedToken.address && 
               selectedToken.address !== 'N/A (Native Asset)' && 
               selectedToken.address !== 'N/A' && 
               selectedToken.address.startsWith('0x') && (
                <a
                  href={`https://etherscan.io/token/${selectedToken.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/30 text-white font-mono text-xs tracking-wider hover:bg-cyan-500 hover:border-cyan-500 hover:text-white transition-all backdrop-blur-md"
                >
                  <Eye className="w-4 h-4" />
                  VIEW ON EXPLORER
                  <ArrowRight className="w-3 h-3" />
                </a>
              )}

              {/* Refresh Analysis Button */}
              <button
                onClick={() => handleScan()}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/30 text-white font-mono text-xs tracking-wider hover:bg-white/20 hover:border-white/50 transition-all backdrop-blur-md"
              >
                <RefreshCw className="w-4 h-4" />
                REFRESH ANALYSIS
              </button>

              {/* Close Button */}
              <button
                onClick={() => {
                  console.log('Close button clicked')
                  setSelectedToken(null)
                }}
                className="flex items-center gap-2 px-5 py-3 bg-red-500/10 border-2 border-red-500/50 text-red-400 font-mono text-xs tracking-wider hover:bg-red-500 hover:border-red-500 hover:text-white transition-all ml-auto cursor-pointer"
                type="button"
              >
                <X className="w-4 h-4" />
                CLOSE ANALYSIS
              </button>
            </div>

            {/* Chain-Specific Security Info - Only for non-Solana chains */}
            {selectedToken.chain && !selectedToken.chain.toLowerCase().includes('solana') && (
              <div className="border border-white/10 bg-white/5 p-4 mb-6">
                <h3 className="text-white font-mono text-xs tracking-wider mb-3 flex items-center gap-2">
                  ⬡ {selectedToken.chain.toUpperCase()} CHAIN ANALYSIS
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-white/60">Contract Verified:</span>
                    <span className={`ml-2 font-bold ${selectedToken.securityData?.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                      {selectedToken.securityData?.isVerified ? 'YES ✓' : 'NO !'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/60">Ownership:</span>
                    <span className={`ml-2 font-bold ${selectedToken.securityData?.ownershipRenounced ? 'text-green-400' : 'text-yellow-400'}`}>
                      {selectedToken.securityData?.ownershipRenounced ? 'RENOUNCED ✓' : 'ACTIVE !'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/60">Proxy Contract:</span>
                    <span className={`ml-2 font-bold ${selectedToken.securityData?.isProxy ? 'text-yellow-400' : 'text-green-400'}`}>
                      {selectedToken.securityData?.isProxy ? 'YES !' : 'NO ✓'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/60">Data Source:</span>
                    <span className="ml-2 text-cyan-400">GoPlus + Moralis</span>
                  </div>
                </div>
              </div>
            )}

            {/* Helius Solana Data Panel - Collapsible - Only for Solana tokens */}
            {selectedToken.chain && selectedToken.chain.toLowerCase().includes('solana') && selectedToken.address && selectedToken.address.length >= 32 && (
              <div className="mb-6">
                <details className="group border border-white/10 bg-black/20 backdrop-blur-sm">
                  <summary className="cursor-pointer p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <span className="text-white font-mono text-xs tracking-wider">ADVANCED SOLANA DATA (HELIUS API)</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white/60 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="border-t border-white/10 p-4">
                    <SolanaHeliusPanel 
                      tokenAddress={selectedToken.address}
                      onDataLoaded={(heliusData) => {
                        console.log('[Dashboard] Helius data loaded:', heliusData)
                      }}
                    />
                  </div>
                </details>
              </div>
            )}

            {/* Risk Factors - Improved Grid */}
            <div className="border border-white/10 bg-black/40 backdrop-blur-xl p-5 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-mono text-xs tracking-wider">RISK FACTORS (10-POINT ANALYSIS)</h3>
                {selectedToken.chain?.toLowerCase().includes('solana') && (
                  <span className="text-cyan-400 font-mono text-[8px] px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30">
                    SOLANA-ADAPTED
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Object.entries(selectedToken.factors).map(([key, value]: [string, any]) => {
                // Determine if this is a Solana token
                const isSolana = selectedToken.chain?.toLowerCase().includes('solana') || 
                                 selectedToken.chainId === 1399811149 ||
                                 selectedToken.chainId === '1399811149'
                
                // Adaptive factor names and descriptions based on chain
                let displayName = key.replace(/([A-Z])/g, ' $1').toUpperCase()
                let description = ''
                
                if (isSolana) {
                  // Solana-specific naming and descriptions
                  if (key === 'contractControl') {
                    displayName = 'PROGRAM SECURITY'
                    description = 'Freeze authority, mint authority, and update authority status'
                  }
                  if (key === 'vestingUnlock') {
                    displayName = 'TOKEN UNLOCK SCHEDULE'
                    description = 'Upcoming token releases from vesting contracts'
                  }
                  if (key === 'liquidityDepth') {
                    displayName = 'DEX LIQUIDITY'
                    description = 'Available liquidity on Raydium, Orca, and other DEXs'
                  }
                  if (key === 'auditTransparency') {
                    displayName = 'VERIFICATION STATUS'
                    description = 'Program verification and metadata validation'
                  }
                  if (key === 'holderConcentration') {
                    description = 'Top wallet concentration and distribution'
                  }
                  if (key === 'supplyDilution') {
                    description = 'Circulating vs total supply ratio'
                  }
                } else {
                  // EVM-specific descriptions
                  if (key === 'contractControl') {
                    description = 'Owner privileges, proxy patterns, and admin functions'
                  }
                  if (key === 'vestingUnlock') {
                    description = 'Upcoming token releases from vesting contracts'
                  }
                  if (key === 'liquidityDepth') {
                    description = 'DEX liquidity and lock status'
                  }
                  if (key === 'holderConcentration') {
                    description = 'Top holder percentage and whale concentration'
                  }
                }
                
                // Special rendering for Program Security and Tax/Fee
                const showDetailedStatus = (key === 'contractControl' && isSolana) || key === 'taxFee'
                
                if (showDetailedStatus) {
                  const securityData = selectedToken.enhancedData?.security_data || selectedToken.rawData?.securityData || {}
                  
                  if (key === 'contractControl' && isSolana) {
                    const freezeAuthority = securityData.freeze_authority
                    const mintAuthority = securityData.mint_authority
                    const updateAuthority = securityData.update_authority
                    
                    const hasFreezeAuth = freezeAuthority && freezeAuthority !== 'null' && freezeAuthority !== null
                    const hasMintAuth = mintAuthority && mintAuthority !== 'null' && mintAuthority !== null
                    const hasUpdateAuth = updateAuthority && updateAuthority !== 'null' && updateAuthority !== null
                    
                    return (
                      <div key={key} className="border border-white/10 bg-black/20 p-4 hover:border-white/30 transition-all duration-300 hover:scale-105 group relative">
                        <div className="text-white/50 font-mono text-[9px] mb-2 truncate">{displayName}</div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white/40 font-mono text-[8px]">Freeze</span>
                            <span className={`font-mono text-[9px] font-bold transition-colors duration-300 ${hasFreezeAuth ? 'text-red-400' : 'text-green-400'}`}>
                              {hasFreezeAuth ? '⚠️' : '✅'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/40 font-mono text-[8px]">Mint</span>
                            <span className={`font-mono text-[9px] font-bold transition-colors duration-300 ${hasMintAuth ? 'text-red-400' : 'text-green-400'}`}>
                              {hasMintAuth ? '⚠️' : '✅'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/40 font-mono text-[8px]">Update</span>
                            <span className={`font-mono text-[9px] font-bold transition-colors duration-300 ${hasUpdateAuth ? 'text-yellow-400' : 'text-green-400'}`}>
                              {hasUpdateAuth ? '⚠️' : '✅'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  } else if (key === 'taxFee') {
                    const buyTax = securityData.buy_tax || 0
                    const sellTax = securityData.sell_tax || 0
                    
                    return (
                      <div key={key} className="border border-white/10 bg-black/20 p-4 hover:border-white/30 transition-all duration-300 hover:scale-105 group relative">
                        <div className="text-white/50 font-mono text-[9px] mb-2 truncate">TAX / FEE</div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white/40 font-mono text-[8px]">Buy</span>
                            <span className={`font-mono text-[9px] font-bold transition-colors duration-300 ${buyTax > 5 ? 'text-red-400' : buyTax > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                              {buyTax > 0 ? `${buyTax}%` : '0%'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/40 font-mono text-[8px]">Sell</span>
                            <span className={`font-mono text-[9px] font-bold transition-colors duration-300 ${sellTax > 5 ? 'text-red-400' : sellTax > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                              {sellTax > 0 ? `${sellTax}%` : '0%'}
                            </span>
                          </div>
                          <div className="text-center pt-1">
                            <span className={`font-mono text-[8px] ${(buyTax === 0 && sellTax === 0) ? 'text-green-400' : 'text-yellow-400'}`}>
                              {(buyTax === 0 && sellTax === 0) ? '✅ No Tax' : '⚠️ Has Tax'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                }
                
                // Regular card rendering - bigger size
                return (
                  <div key={key} className="border border-white/10 bg-black/20 p-4 hover:border-white/30 transition-all duration-300 hover:scale-105 group relative">
                    <div className="text-white/50 font-mono text-[9px] mb-2 truncate">{displayName}</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`font-mono text-2xl font-bold transition-colors duration-300 ${
                        value < 30 ? 'text-green-400' : 
                        value < 60 ? 'text-yellow-400' : 
                        value < 80 ? 'text-orange-400' : 'text-red-400'
                      }`}>{value}</span>
                      <span className="text-white/40 font-mono text-[10px]">/100</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2.5">
                      <div 
                        className={`h-full transition-all duration-500 ease-out ${
                          value < 30 ? 'bg-green-500' : 
                          value < 60 ? 'bg-yellow-500' : 
                          value < 80 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    {description && (
                      <div className="absolute left-0 top-full mt-2 w-56 p-3 bg-black/95 border border-white/20 text-white/80 font-mono text-[9px] leading-relaxed opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 backdrop-blur-sm shadow-xl">
                        {description}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* AI Analysis Accordion (replaces old AI Meme Detection) */}
            {selectedToken.ai_summary && (
              <AIAnalysisAccordion
                aiSummary={selectedToken.ai_summary}
                tokenName={selectedToken.name || 'Token'}
                riskLevel={selectedToken.risk_level || 'MEDIUM'}
              />
            )}

            {/* Fallback to old AI Insights if no AI Summary */}
            {!selectedToken.ai_summary && selectedToken.ai_insights && (
              <div className="border border-gray-700/50 bg-gray-900/30 p-4 mb-4 rounded-lg">
                <h3 className="text-gray-300 font-mono text-xs tracking-wider mb-3 flex items-center gap-2">
                  <span className="text-lg">⊕</span>
                  AI CLASSIFICATION
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-mono text-[10px]">TYPE</span>
                    <span className={`font-mono text-xs font-bold ${
                      selectedToken.ai_insights.classification === 'MEME_TOKEN' ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      {selectedToken.ai_insights.classification === 'MEME_TOKEN' ? '◐ MEME TOKEN' : '◧ UTILITY TOKEN'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-mono text-[10px]">CONFIDENCE</span>
                    <span className="text-gray-200 font-mono text-xs">{selectedToken.ai_insights.confidence}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Twitter/X Social Metrics */}
            {selectedToken.twitter_metrics && (
              <div className="border border-blue-500/50 bg-blue-500/10 p-4 mb-4">
                <h3 className="text-blue-400 font-mono text-xs tracking-wider mb-3 flex items-center gap-2">
                  <span className="text-lg">𝕏</span>
                  TWITTER / X METRICS
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-white/60 font-mono text-[10px] mb-1">FOLLOWERS</div>
                    <div className="text-white font-mono text-sm">{selectedToken.twitter_metrics.followers?.toLocaleString() || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-white/60 font-mono text-[10px] mb-1">ENGAGEMENT</div>
                    <div className="text-white font-mono text-sm">{selectedToken.twitter_metrics.engagement || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-white/60 font-mono text-[10px] mb-1">TWEETS (7D)</div>
                    <div className="text-white font-mono text-sm">{selectedToken.twitter_metrics.tweets_7d || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-white/60 font-mono text-[10px] mb-1">ADOPTION SCORE</div>
                    <div className={`font-mono text-sm font-bold ${
                      (selectedToken.twitter_metrics.adoption_score || 0) > 70 ? 'text-green-400' :
                      (selectedToken.twitter_metrics.adoption_score || 0) > 40 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {selectedToken.twitter_metrics.adoption_score || 'N/A'}/100
                    </div>
                  </div>
                </div>
                {selectedToken.twitter_metrics.handle && (
                  <div className="mt-2 pt-2 border-t border-blue-500/30">
                    <a 
                      href={`https://twitter.com/${selectedToken.twitter_metrics.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-mono text-[10px] underline"
                    >
                      @{selectedToken.twitter_metrics.handle}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Flags */}
            {selectedToken.criticalFlags?.length > 0 && (
              <div className="border border-red-500/50 bg-red-500/10 p-4 mb-4">
                <h3 className="text-red-500 font-mono text-xs tracking-wider mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  CRITICAL FLAGS
                </h3>
                <ul className="space-y-1">
                  {selectedToken.criticalFlags.map((flag: string, i: number) => (
                    <li key={i} className="text-red-400 font-mono text-xs">{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedToken.redFlags?.length > 0 && (
              <div className="border border-yellow-500/50 bg-yellow-500/10 p-4 mb-4">
                <h3 className="text-yellow-500 font-mono text-xs tracking-wider mb-2">RED FLAGS</h3>
                <ul className="space-y-1">
                  {selectedToken.redFlags.map((flag: string, i: number) => (
                    <li key={i} className="text-yellow-400 font-mono text-xs">{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedToken.positiveSignals?.length > 0 && (
              <div className="border border-green-500/50 bg-green-500/10 p-4">
                <h3 className="text-green-500 font-mono text-xs tracking-wider mb-2">POSITIVE SIGNALS</h3>
                <ul className="space-y-1">
                  {selectedToken.positiveSignals.map((signal: string, i: number) => (
                    <li key={i} className="text-green-400 font-mono text-xs">{signal}</li>
                  ))}
                </ul>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Watchlist - Enhanced Glassmorphism */}
        <div id="watchlist" className="relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 mb-8 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-purple-500/[0.01] to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-white font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
              <div className="p-1.5 border border-white/30 bg-black/40">
                <Eye className="w-4 h-4" />
              </div>
              WATCHLIST ({watchlist.length})
            </h2>
          
          {watchlist.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-mono text-xs">NO TOKENS IN WATCHLIST</p>
              <p className="font-mono text-[10px] mt-2 text-white/30">SCAN TOKENS AND ADD THEM TO YOUR WATCHLIST</p>
            </div>
          ) : (
            <div className="space-y-3">
              {watchlist.map((token) => (
                <div
                  key={token.address}
                  className="group relative w-full border border-white/10 bg-black/30 backdrop-blur-md hover:border-white/30 hover:bg-black/40 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                  <button
                    onClick={() => {
                      setSearchQuery(token.address)
                      handleScan()
                    }}
                    className="relative w-full p-4 text-left z-10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-mono font-bold">{token.symbol}</h3>
                          <span className={`px-2 py-0.5 text-[8px] font-mono border ${
                            token.riskLevel === 'LOW' ? 'border-green-500/30 bg-green-500/10 text-green-500' :
                            token.riskLevel === 'MEDIUM' ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500' :
                            token.riskLevel === 'HIGH' ? 'border-orange-500/30 bg-orange-500/10 text-orange-500' : 
                            'border-red-500/30 bg-red-500/10 text-red-500'
                          }`}>
                            {token.riskLevel}
                          </span>
                        </div>
                        <p className="text-white/60 font-mono text-xs mt-0.5">{token.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className={`font-mono text-xs ${
                            token.riskLevel === 'LOW' ? 'text-green-500' :
                            token.riskLevel === 'MEDIUM' ? 'text-yellow-500' :
                            token.riskLevel === 'HIGH' ? 'text-orange-500' : 'text-red-500'
                          }`}>
                            RISK: {token.riskScore}/100
                          </p>
                          <span className="text-white/20">•</span>
                          <p className="text-white/40 font-mono text-[10px]">{token.chain}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-mono text-sm">${token.price.toFixed(2)}</p>
                        <p className={`font-mono text-xs ${token.change24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                        </p>
                        <p className="text-white/40 font-mono text-[9px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          CLICK TO RESCAN
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Delete Button */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (!user) return
                      
                      // Confirm deletion
                      if (!confirm(`Remove ${token.symbol} from watchlist?`)) return
                      
                      setWatchlistLoading(true)
                      try {
                        await removeFromWatchlist(user.uid, token.address)
                        await loadDashboardData()
                      } catch (error) {
                        console.error('Failed to remove from watchlist:', error)
                      } finally {
                        setWatchlistLoading(false)
                      }
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/80 border border-white/10 hover:border-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Remove from watchlist"
                  >
                    <X className="w-3 h-3 text-white/60 hover:text-red-500 transition-colors" />
                  </button>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>

        {/* Historical Analytics - Collapsible */}
        {selectedToken && (
        <details className="group border border-white/10 bg-black/40 backdrop-blur-xl mb-8 transition-all duration-300">
          <summary className="cursor-pointer p-5 hover:bg-white/5 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-white" />
              <h2 className="text-white font-mono text-xs tracking-wider">
                HISTORICAL ANALYTICS - {selectedToken.symbol}
              </h2>
            </div>
            <ChevronDown className="w-4 h-4 text-white/60 group-open:rotate-180 transition-transform duration-300" />
          </summary>
          <div className="border-t border-white/10 p-6">

          {/* Timeframe Selector */}
          <div className="flex gap-2 mb-6">
            {['7D', '30D', '90D', '1Y'].map((period) => (
              <button
                key={period}
                onClick={() => handleTimeframeChange(period)}
                disabled={!selectedToken || loadingHistory}
                className={`px-4 py-2 bg-transparent border font-mono text-xs tracking-wider transition-all disabled:opacity-30 ${
                  timeframe === period
                    ? 'border-white bg-white text-black'
                    : 'border-white/20 text-white hover:bg-white hover:text-black'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Charts Grid - 6 comprehensive charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Score Trend */}
            <div className="border border-white/10 p-4">
              <h3 className="text-white/80 font-mono text-[10px] tracking-wider mb-3 flex items-center gap-2">
                <Shield className="w-3 h-3" />
                RISK SCORE TIMELINE
              </h3>
              {loadingHistory ? (
                <div className="h-[220px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                </div>
              ) : historicalData.risk.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={historicalData.risk}>
                    <defs>
                      <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="date" stroke="#ffffff60" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis stroke="#ffffff60" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: 10 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#ffffff" fillOpacity={1} fill="url(#riskGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-white/40 font-mono text-xs">
                    {selectedToken ? 'No historical risk data available' : 'Scan a token to view history'}
                  </p>
                </div>
              )}
            </div>

            {/* Price History */}
            <div className="border border-white/10 p-4">
              <h3 className="text-white/80 font-mono text-[10px] tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                PRICE HISTORY (USD)
              </h3>
              {loadingHistory ? (
                <div className="h-[220px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                </div>
              ) : historicalData.price.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={historicalData.price}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="date" stroke="#ffffff60" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis stroke="#ffffff60" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: 10 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#priceGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-white/40 font-mono text-xs">
                    {selectedToken ? 'No price history available' : 'Scan a token to view history'}
                  </p>
                </div>
              )}
            </div>

            {/* Holder Growth */}
            <div className="border border-white/10 p-4">
              <h3 className="text-white/80 font-mono text-[10px] tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-3 h-3" />
                HOLDER COUNT TREND
              </h3>
              {loadingHistory ? (
                <div className="h-[220px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                </div>
              ) : historicalData.holders.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={historicalData.holders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="date" stroke="#ffffff60" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis stroke="#ffffff60" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: 10 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={2} dot={{ fill: '#ffffff' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-white/40 font-mono text-xs">
                    {selectedToken ? 'No holder data available' : 'Scan a token to view history'}
                  </p>
                </div>
              )}
            </div>

            {/* Volume & Liquidity */}
            <div className="border border-white/10 p-4">
              <h3 className="text-white/80 font-mono text-[10px] tracking-wider mb-3 flex items-center gap-2">
                <Droplet className="w-3 h-3" />
                VOLUME HISTORY
              </h3>
              {loadingHistory ? (
                <div className="h-[220px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                </div>
              ) : historicalData.volume.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={historicalData.volume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="date" stroke="#ffffff60" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis stroke="#ffffff60" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: 10 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-white/40 font-mono text-xs">
                    {selectedToken ? 'No volume data available' : 'Scan a token to view history'}
                  </p>
                </div>
              )}
            </div>

            {/* Transaction Patterns */}
            <div className="border border-white/10 p-4">
              <h3 className="text-white/80 font-mono text-[10px] tracking-wider mb-3 flex items-center gap-2">
                <Activity className="w-3 h-3" />
                TRANSACTION COUNT
              </h3>
              {loadingHistory ? (
                <div className="h-[220px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                </div>
              ) : historicalData.transactions.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={historicalData.transactions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="date" stroke="#ffffff60" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis stroke="#ffffff60" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: 10 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" fill="#10b981" opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-white/40 font-mono text-xs">
                    {selectedToken ? 'No transaction data available' : 'Scan a token to view history'}
                  </p>
                </div>
              )}
            </div>

            {/* Whale Activity */}
            <div className="border border-white/10 p-4">
              <h3 className="text-white/80 font-mono text-[10px] tracking-wider mb-3 flex items-center gap-2">
                <Crown className="w-3 h-3" />
                WHALE ACTIVITY INDEX
              </h3>
              {loadingHistory ? (
                <div className="h-[220px] flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                </div>
              ) : historicalData.whales.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={historicalData.whales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="date" stroke="#ffffff60" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis stroke="#ffffff60" style={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: 10 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={2} dot={{ fill: '#fbbf24' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-white/40 font-mono text-xs">
                    {selectedToken ? 'No whale activity data available' : 'Scan a token to view history'}
                  </p>
                </div>
              )}
            </div>
          </div>
          </div>
        </details>
        )}

        {/* Advanced Insights Section - Glassmorphism */}
        {selectedToken && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Market Sentiment */}
          <div className="relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
            <div className="relative">
              <h3 className="text-white font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                MARKET SENTIMENT
              </h3>
            {loadingInsights ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
              </div>
            ) : insightData.sentiment || selectedToken ? (
              (() => {
                // Calculate sentiment from current token data if historical data not available
                const sentiment = insightData.sentiment || (() => {
                  if (!selectedToken) return null
                  const risk = selectedToken.riskScore || 50
                  // Low risk = bullish, high risk = bearish
                  const bullish = Math.max(0, Math.min(100, 100 - risk * 1.2))
                  const bearish = Math.max(0, Math.min(100, risk * 1.2))
                  const neutral = Math.max(0, 100 - bullish - bearish)
                  return {
                    bullish: Math.round(bullish),
                    neutral: Math.round(neutral),
                    bearish: Math.round(bearish),
                    overall: risk < 30 ? 'BULLISH' : risk > 60 ? 'BEARISH' : 'NEUTRAL'
                  }
                })()
                
                if (!sentiment) return null
                
                return (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-white/60 font-mono text-xs">BULLISH</span>
                        <span className="text-green-500 font-mono text-xs">{sentiment.bullish}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded">
                        <div className="h-full bg-green-500 rounded" style={{ width: `${sentiment.bullish}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-white/60 font-mono text-xs">NEUTRAL</span>
                        <span className="text-yellow-500 font-mono text-xs">{sentiment.neutral}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded">
                        <div className="h-full bg-yellow-500 rounded" style={{ width: `${sentiment.neutral}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-white/60 font-mono text-xs">BEARISH</span>
                        <span className="text-red-500 font-mono text-xs">{sentiment.bearish}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded">
                        <div className="h-full bg-red-500 rounded" style={{ width: `${sentiment.bearish}%` }}></div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex justify-between">
                        <span className="text-white/60 font-mono text-xs">OVERALL</span>
                        <span className={`font-mono text-xs font-bold ${
                          sentiment.overall === 'BULLISH' ? 'text-green-500' :
                          sentiment.overall === 'BEARISH' ? 'text-red-500' : 'text-yellow-500'
                        }`}>
                          {sentiment.overall}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })()
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-white/40 font-mono text-xs text-center px-4">
                  Scan a token to view sentiment
                </p>
              </div>
            )}
            </div>
          </div>

          {/* Security Metrics */}
          <div className="relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
            <div className="relative">
              <h3 className="text-white font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4" />
                SECURITY METRICS
              </h3>
            {loadingInsights ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
              </div>
            ) : insightData.security || (selectedToken && selectedToken.factors) ? (
              <div className="space-y-3">
                {/* Use historical data if available, otherwise use current scan data */}
                {(() => {
                  const security = insightData.security || {
                    contractSecurity: {
                      score: selectedToken?.factors?.contractControl ? Math.max(0, 100 - selectedToken.factors.contractControl) : 0,
                      grade: selectedToken?.factors?.contractControl < 20 ? 'A' : selectedToken?.factors?.contractControl < 40 ? 'B' : selectedToken?.factors?.contractControl < 60 ? 'C' : 'D'
                    },
                    liquidityLock: {
                      locked: selectedToken?.factors?.liquidityDepth < 30,
                      percentage: selectedToken?.factors?.liquidityDepth ? Math.max(0, 100 - selectedToken.factors.liquidityDepth) : 0
                    },
                    auditStatus: {
                      audited: selectedToken?.factors?.tokenAge < 20,
                      score: selectedToken?.factors?.tokenAge ? Math.max(0, 100 - selectedToken.factors.tokenAge) : 0
                    },
                    ownership: {
                      status: selectedToken?.factors?.whaleConcentration < 20 ? 'DECENTRALIZED' : selectedToken?.factors?.whaleConcentration < 50 ? 'CENTRALIZED' : 'CENTRALIZED',
                      score: selectedToken?.factors?.whaleConcentration ? Math.max(0, 100 - selectedToken.factors.whaleConcentration) : 50
                    }
                  }
                  
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 font-mono text-xs">CONTRACT SECURITY</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-white/10 rounded">
                            <div className="h-full bg-green-500 rounded" style={{ width: `${security.contractSecurity.score}%` }}></div>
                          </div>
                          <span className="text-green-500 font-mono text-xs">{security.contractSecurity.grade}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 font-mono text-xs">LIQUIDITY DEPTH</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-white/10 rounded">
                            <div className="h-full bg-green-500 rounded" style={{ width: `${security.liquidityLock.percentage}%` }}></div>
                          </div>
                          <span className={`font-mono text-xs ${security.liquidityLock.locked ? 'text-green-500' : 'text-yellow-500'}`}>
                            {security.liquidityLock.locked ? '✓ GOOD' : '⚠ LOW'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 font-mono text-xs">TOKEN MATURITY</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-white/10 rounded">
                            <div className="h-full bg-green-500 rounded" style={{ width: `${security.auditStatus.score}%` }}></div>
                          </div>
                          <span className={`font-mono text-xs ${security.auditStatus.audited ? 'text-green-500' : 'text-yellow-500'}`}>
                            {security.auditStatus.audited ? '✓ MATURE' : '⚠ NEW'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 font-mono text-xs">OWNERSHIP</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-white/10 rounded">
                            <div className="h-full bg-green-500 rounded" style={{ width: `${security.ownership.score}%` }}></div>
                          </div>
                          <span className={`font-mono text-xs ${
                            security.ownership.status === 'RENOUNCED' ? 'text-green-500' :
                            security.ownership.status === 'DECENTRALIZED' ? 'text-blue-500' : 'text-yellow-500'
                          }`}>
                            {security.ownership.status}
                          </span>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-white/40 font-mono text-xs text-center px-4">
                  {selectedToken ? 'No security metrics yet. Data builds up from historical scans.' : 'Scan a token to view security'}
                </p>
              </div>
            )}
            </div>
          </div>

          {/* Top Holders Distribution */}
          <div className="relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
            <div className="relative">
              <h3 className="text-white font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                TOP HOLDERS SHARE
              </h3>
            {loadingInsights ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
              </div>
            ) : insightData.holders || selectedToken ? (
              (() => {
                // Calculate holder distribution from current token data if historical data not available
                const holders = insightData.holders || (() => {
                  if (!selectedToken) return null
                  const top10 = selectedToken.top10HoldersPct || 0
                  // Estimate top50 and top100 based on top10
                  const top50 = Math.min(100, top10 * 1.8)
                  const top100 = Math.min(100, top10 * 2.2)
                  return {
                    top10Percentage: Math.round(top10),
                    top50Percentage: Math.round(top50),
                    top100Percentage: Math.round(top100),
                    distribution: top10 < 20 ? 'DECENTRALIZED' : top10 < 50 ? 'MODERATE' : 'CENTRALIZED'
                  }
                })()
                
                if (!holders) return null
                
                return (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-white/60 font-mono text-xs">TOP 10</span>
                        <span className="text-white font-mono text-xs">{holders.top10Percentage || holders.top10 || 0}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded">
                        <div className="h-full bg-blue-500 rounded" style={{ width: `${holders.top10Percentage || holders.top10 || 0}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-white/60 font-mono text-xs">TOP 50</span>
                        <span className="text-white font-mono text-xs">{holders.top50Percentage || holders.top50 || 0}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded">
                        <div className="h-full bg-purple-500 rounded" style={{ width: `${holders.top50Percentage || holders.top50 || 0}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-white/60 font-mono text-xs">TOP 100</span>
                        <span className="text-white font-mono text-xs">{holders.top100Percentage || holders.top100 || 0}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded">
                        <div className="h-full bg-pink-500 rounded" style={{ width: `${holders.top100Percentage || holders.top100 || 0}%` }}></div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex justify-between">
                        <span className="text-white/60 font-mono text-xs">DISTRIBUTION</span>
                        <span className={`font-mono text-xs font-bold ${
                          holders.distribution === 'DECENTRALIZED' ? 'text-green-500' :
                          holders.distribution === 'MODERATE' ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {holders.distribution || 'UNKNOWN'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })()
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-white/40 font-mono text-xs text-center px-4">
                  {selectedToken ? 'No holder distribution data yet. Insights require historical scan data.' : 'Scan a token to view holders'}
                </p>
              </div>
            )}
            </div>
          </div>
        </div>
        )}

        {/* Recent Activity Feed - Glassmorphism */}
        <div className="relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
          <div className="relative">
            <h3 className="text-white font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              RECENT ACTIVITY
            </h3>
            {watchlist.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {watchlist.slice(0, 5).map((token, index) => (
                  <div key={token.address} className="flex items-center justify-between p-3 border border-white/10 bg-black/20 hover:bg-black/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg border border-white/20 bg-black/40 flex items-center justify-center">
                        <span className="text-white/80 font-mono text-xs">{token.symbol?.charAt(0) || '?'}</span>
                      </div>
                      <div>
                        <div className="text-white font-mono text-xs font-bold">{token.symbol}</div>
                        <div className="text-white/50 font-mono text-[10px]">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-xs font-bold ${
                        token.riskLevel === 'LOW' ? 'text-green-400' :
                        token.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                        token.riskLevel === 'HIGH' ? 'text-orange-400' : 'text-red-400'
                      }`}>
                        {token.riskScore}/100
                      </div>
                      <div className="text-white/40 font-mono text-[10px]">
                        {new Date(token.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-white/40 font-mono text-xs">No recent activity. Start scanning tokens!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="group relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 hover:border-white/30 hover:bg-black/50 transition-all duration-300 shadow-2xl hover:shadow-white/5 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-white/[0.01] to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 border border-white/20 bg-black/40 group-hover:border-white/40 group-hover:bg-white/10 transition-all duration-300">
            <div className="text-white group-hover:scale-110 transition-transform duration-300">{icon}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
            <span className="text-white/40 font-mono text-[10px] tracking-wider group-hover:text-white/60 transition-colors">LIVE</span>
          </div>
        </div>
        <p className="text-white/60 font-mono text-[10px] tracking-wider mb-2 group-hover:text-white/80 transition-colors">{label}</p>
        <p className="text-3xl font-bold text-white font-mono group-hover:text-white drop-shadow-lg">{value}</p>
        
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    </div>
  )
}
