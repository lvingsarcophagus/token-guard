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
import { 
  Shield, TrendingUp, TrendingDown, Activity, Users, Droplet,
  Zap, Crown, AlertCircle, CheckCircle, Sparkles, BarChart3,
  Clock, Target, Plus, Search, Bell, Settings, LogOut, Menu, X,
  User, Flame, BadgeCheck, Loader2, AlertTriangle, Eye, RefreshCw,
  ChevronDown, ChevronUp, ArrowRight, Star, Bookmark
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
  const [showRawData, setShowRawData] = useState(false)
  const [isInWatchlistState, setIsInWatchlistState] = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  
  // Token suggestions state
  const [tokenSuggestions, setTokenSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showTokenSearch, setShowTokenSearch] = useState(false)
  
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
  
  // Check authentication (allow both FREE and PREMIUM)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])
  
  // Determine if user has premium features
  const isPremium = userProfile?.plan === 'PREMIUM'
  
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
      const response = await fetch(`/api/search-token?query=${encodeURIComponent(query)}`)
      
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
    
    // Set the correct chain based on token data
    if (token.chainName) {
      const chainLower = token.chainName.toLowerCase()
      if (chainLower.includes('ethereum')) setSelectedChain('ethereum')
      else if (chainLower.includes('bsc') || chainLower.includes('binance')) setSelectedChain('bsc')
      else if (chainLower.includes('polygon')) setSelectedChain('polygon')
      else if (chainLower.includes('avalanche')) setSelectedChain('avalanche')
      else if (chainLower.includes('solana')) setSelectedChain('solana')
      
      console.log(`[Dashboard] Selected chain: ${chainLower} -> ${selectedChain}`)
    }
    
    // Automatically trigger scan
    setTimeout(() => {
      handleScan()
    }, 100)
  }

  // Handle token selection from CMC search
  const handleTokenSelectFromSearch = async (address: string, chain: string, symbol: string, name: string) => {
    console.log(`[Premium Dashboard] Token selected from search: ${name} (${symbol}) on ${chain}`)
    console.log(`[Premium Dashboard] Address: ${address}`)
    
    // Set the search query to the address
    setSearchQuery(address)
    
    // Set the chain based on CMC data
    const chainLower = chain.toLowerCase()
    if (chainLower.includes('ethereum')) setSelectedChain('ethereum')
    else if (chainLower.includes('bsc') || chainLower.includes('binance')) setSelectedChain('bsc')
    else if (chainLower.includes('polygon')) setSelectedChain('polygon')
    else if (chainLower.includes('avalanche')) setSelectedChain('avalanche')
    else if (chainLower.includes('solana')) setSelectedChain('solana')
    
    // Automatically trigger scan
    setTimeout(() => {
      handleScan()
    }, 100)
  }

  const handleScan = async () => {
    if (!searchQuery.trim()) return
    
    if (!user) {
      setScanError('USER NOT AUTHENTICATED. PLEASE LOGIN AGAIN.')
      return
    }
    
    // Check scan limit for FREE users (10 scans per day)
    if (!isPremium && portfolioStats && portfolioStats.totalScans >= 10) {
      setScanError('DAILY LIMIT REACHED (10/10). UPGRADE TO PREMIUM FOR UNLIMITED SCANS.')
      return
    }
    
    console.log(`[Scanner] ========== NEW SCAN ==========`)
    console.log(`[Scanner] Query: ${searchQuery}`)
    console.log(`[Scanner] Chain: ${selectedChain}`)
    console.log(`[Scanner] Manual Classification: ${manualTokenType || 'AUTO DETECT'}`)
    
    setScanning(true)
    setScanError('')
    setSelectedToken(null)
    setScannedToken(null)
    setRiskResult(null)
    setShowSuggestions(false)
    
    try {
      console.log('[Scanner] Starting scan for:', searchQuery)
      
      // Check if input is an address (supports both EVM and Solana)
      let addressToScan = searchQuery
      const isEVMAddress = searchQuery.startsWith('0x') && searchQuery.length === 42
      const isSolanaAddress = searchQuery.length >= 32 && searchQuery.length <= 44 && !searchQuery.startsWith('0x')
      const isAddress = isEVMAddress || isSolanaAddress
      
      if (!isAddress) {
        console.log('[Scanner] Not an address, searching for token:', searchQuery)
        try {
          // Use faster CoinMarketCap search
          const searchRes = await fetch(`/api/search-token?query=${encodeURIComponent(searchQuery)}`)
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
      
      const data = await TokenScanService.scanToken(addressToScan)
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
        
        // Use the full multi-API analyze endpoint
        const res = await fetch('/api/analyze-token', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tokenAddress: data.address,
            chainId: String(data.chainInfo.chainId),
            plan: 'PREMIUM', // Use PREMIUM plan for full behavioral data
            userId: user?.uid, // Pass user ID for rate limiting
            metadata: {
              tokenSymbol,
              tokenName,
              chain: data.chainInfo.chainName === 'Ethereum' ? 'ETHEREUM' : 
                     data.chainInfo.chainName === 'BSC' ? 'BSC' : 
                     data.chainInfo.chainName === 'Polygon' ? 'POLYGON' : 'ETHEREUM',
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
          
          setSelectedToken({
            name: data.priceData?.name || 'Unknown',
            symbol: data.priceData?.symbol || searchQuery.toUpperCase(),
            address: data.address,
            chain: data.chainInfo?.chainName || 'Unknown',
            marketCap: formatMarketCap(data.priceData?.marketCap),
            price: data.priceData?.price || 0,
            age: result.data_freshness ? `${result.data_freshness} days` : 'N/A',
            overallRisk: riskScore,
            confidence: result.confidence_score || 90,
            lastUpdated: 'just now',
            factors: {
              contractSecurity: breakdown.contractControl || 0,
              supplyRisk: breakdown.supplyDilution || 0,
              whaleConcentration: breakdown.holderConcentration || 0,
              liquidityDepth: breakdown.liquidityDepth || 0,
              marketActivity: breakdown.adoption || 0,
              burnMechanics: breakdown.burnDeflation || 0,
              tokenAge: breakdown.auditTransparency || 0
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
        console.log('[Scanner] Symbol search - showing market data only')
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
            contractSecurity: 0, // N/A for native assets
            supplyRisk: isWellKnown ? 5 : 15,
            whaleConcentration: isWellKnown ? 10 : 25,
            liquidityDepth: isWellKnown ? 5 : 15,
            marketActivity: isWellKnown ? 5 : 10,
            burnMechanics: 0, // N/A for most native assets
            tokenAge: isWellKnown ? 3 : 10
          },
          redFlags: isWellKnown ? [] : ['⚠️ Use contract address for detailed smart contract analysis'],
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
    // Skip loading charts for symbols without valid contract addresses
    if (!address || address === 'N/A (Native Asset)' || address === 'N/A' || !address.startsWith('0x')) {
      console.log('[Charts] Skipping historical data for symbol search:', address)
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
    // Skip loading insights for symbols without valid contract addresses
    if (!address || address === 'N/A (Native Asset)' || address === 'N/A' || !address.startsWith('0x')) {
      console.log('[Insights] Skipping insights for symbol search')
      setLoadingInsights(false)
      setInsightData({
        sentiment: null,
        security: null,
        holders: null
      })
      return
    }
    
    setLoadingInsights(true)
    try {
      const types = ['sentiment', 'security', 'holders']
      
      // Fetch all insight types in parallel
      const results = await Promise.allSettled(
        types.map(type =>
          fetch(`/api/token/insights?address=${address}&type=${type}`)
            .then(res => res.json())
            .then(data => ({ type, data: data.success ? data.data : null }))
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
    if (isPremium && selectedToken?.address) {
      loadHistoricalData(selectedToken.address, timeframe)
      loadInsightData(selectedToken.address)
    }
  }, [selectedToken?.address, isPremium])
  
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <MorphingSquare 
          message="LOADING PREMIUM DASHBOARD..."
          messagePlacement="bottom"
        />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-black">
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
                    {portfolioStats?.totalScans || 0}/10 SCANS TODAY
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



        {/* Alerts Section - NEW ADDITION AT TOP */}
        {alerts.length > 0 && (
          <div className="border border-yellow-500/50 bg-yellow-500/10 p-6 mb-8">
            <h2 className="text-yellow-500 font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              ACTIVE ALERTS ({alerts.length})
            </h2>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className={`border p-3 ${
                  alert.severity === 'critical' ? 'border-red-500/50 bg-red-500/10' :
                  alert.severity === 'warning' ? 'border-yellow-500/50 bg-yellow-500/10' :
                  'border-blue-500/50 bg-blue-500/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-mono text-xs ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'warning' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`}>
                        {alert.message}
                      </p>
                      <p className="text-white/40 font-mono text-[10px] mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!alert.read && (
                      <span className="px-2 py-1 bg-white/20 text-white font-mono text-[10px]">NEW</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wallet Analysis Section */}
        {user && (
          <div className="border border-white/20 bg-black/60 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-mono text-xs tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" />
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
                className="px-4 py-2 bg-transparent border border-white/30 text-white font-mono text-[10px] hover:bg-white hover:text-black transition-all disabled:opacity-50"
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
                  <div className="border border-white/10 p-4">
                    <p className="text-white/60 font-mono text-[10px] mb-2">TOTAL HOLDINGS</p>
                    <p className="text-white font-mono text-2xl">${walletData.totalValue?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="border border-white/10 p-4">
                    <p className="text-white/60 font-mono text-[10px] mb-2">TOKENS</p>
                    <p className="text-white font-mono text-2xl">{walletData.tokenCount || 0}</p>
                  </div>
                  <div className="border border-white/10 p-4">
                    <p className="text-white/60 font-mono text-[10px] mb-2">AVG RISK SCORE</p>
                    <p className={`font-mono text-2xl ${
                      (walletData.avgRiskScore || 0) < 30 ? 'text-green-500' :
                      (walletData.avgRiskScore || 0) < 60 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {walletData.avgRiskScore || 0}/100
                    </p>
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
        )}

        {/* Token Scanner - Glassmorphism */}
        <div className="relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-white font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
              <Search className="w-4 h-4" />
              SCAN TOKEN
            </h2>

          {/* Chain Selector Dropdown */}
          <div className="mb-4">
            <label className="text-white/60 font-mono text-[10px] tracking-wider mb-2 block">
              SELECT BLOCKCHAIN
            </label>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value as any)}
              className="w-full px-4 py-3 bg-black border border-white/20 text-white font-mono text-sm tracking-wider focus:border-white/40 focus:outline-none transition-all appearance-none cursor-pointer hover:border-white/30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white' opacity='0.6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25rem',
                paddingRight: '2.5rem'
              }}
            >
              <option value="ethereum">⟠ ETHEREUM</option>
              <option value="bsc">🔶 BSC (BNB CHAIN)</option>
              <option value="polygon">🟣 POLYGON</option>
              <option value="avalanche">🔺 AVALANCHE</option>
              <option value="solana">🌟 SOLANA</option>
            </select>
          </div>

          {/* Token Classification Dropdown */}
          <div className="mb-4">
            <label className="text-white/60 font-mono text-[10px] tracking-wider mb-2 block">
              TOKEN CLASSIFICATION (OPTIONAL)
            </label>
            <select
              value={manualTokenType || 'auto'}
              onChange={(e) => setManualTokenType(e.target.value === 'auto' ? null : e.target.value as 'MEME_TOKEN' | 'UTILITY_TOKEN')}
              className={`w-full px-4 py-3 bg-black border text-white font-mono text-sm tracking-wider focus:border-white/40 focus:outline-none transition-all appearance-none cursor-pointer hover:border-white/30 ${
                manualTokenType === 'MEME_TOKEN' ? 'border-yellow-500/50' : 'border-white/20'
              }`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white' opacity='0.6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25rem',
                paddingRight: '2.5rem'
              }}
            >
              <option value="auto">🤖 AUTO DETECT (AI Classification)</option>
              <option value="MEME_TOKEN">🎭 MEME TOKEN (Speculative, +15 risk)</option>
              <option value="UTILITY_TOKEN">🏢 UTILITY TOKEN (Functional)</option>
            </select>
            <p className={`font-mono text-[9px] mt-2 ${
              manualTokenType === 'MEME_TOKEN' ? 'text-yellow-400' : 'text-white/40'
            }`}>
              {manualTokenType === 'MEME_TOKEN' ? (
                <span>⚠️ MEME TOKEN SELECTED - Adding +15 risk points to next scan</span>
              ) : (
                <span>Override AI classification. Meme tokens get +15 risk points added.</span>
              )}
            </p>
          </div>
          
          {/* Toggle Button and Reset */}
          <div className="flex justify-between items-center mb-3">
            {manualTokenType && (
              <button
                onClick={() => setManualTokenType(null)}
                className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-mono text-[10px] border border-yellow-500/30 transition-colors tracking-wider"
              >
                ↺ RESET CLASSIFICATION
              </button>
            )}
            <div className={manualTokenType ? '' : 'ml-auto'}>
              <button
                onClick={() => setShowTokenSearch(!showTokenSearch)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] border border-white/30 transition-colors tracking-wider"
              >
                {showTokenSearch ? '📝 MANUAL INPUT' : '🔍 SEARCH BY NAME'}
              </button>
            </div>
          </div>

          <div className="relative z-50 token-search-container">
            {showTokenSearch ? (
              /* Token Search by Name/Symbol */
              <div className="space-y-3">
                <TokenSearchComponent onTokenSelect={handleTokenSelectFromSearch} />
                <div className="text-[10px] font-mono text-white/40 tracking-wider">
                  💡 SEARCH FOR TOKENS BY NAME OR SYMBOL (E.G., BONK, DOGWIFHAT)
                </div>
              </div>
            ) : (
              /* Traditional Address/Symbol Input */
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchTokenSuggestions(e.target.value)
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                  onFocus={() => {
                    if (tokenSuggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  placeholder="ENTER CONTRACT ADDRESS OR SYMBOL..."
                  className="flex-1 bg-black border border-white/30 text-white px-4 py-3 font-mono text-xs tracking-wider focus:outline-none focus:border-white placeholder:text-white/40"
                  disabled={scanning}
                />
                <button
                  onClick={handleScan}
                  disabled={scanning || !searchQuery.trim()}
                  className="px-6 py-3 bg-white text-black font-mono text-xs tracking-wider hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                      SCANNING...
                    </>
                  ) : (
                    'SCAN'
                  )}
                </button>
              </div>
            )}

            {/* Token Suggestions Dropdown */}
            {showSuggestions && tokenSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-black border border-white/30 z-[100] max-h-[400px] overflow-y-auto shadow-2xl">
                {loadingSuggestions && (
                  <div className="p-4 text-center">
                    <Loader2 className="w-4 h-4 inline animate-spin text-white/60" />
                  </div>
                )}
                {tokenSuggestions.map((token, index) => (
                  <button
                    key={`${token.address}-${token.chainId}-${index}`}
                    onClick={() => handleSelectSuggestion(token)}
                    className="w-full p-3 text-left hover:bg-white/10 transition-all border-b border-white/10 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-mono text-sm font-bold">
                            {token.symbol}
                          </span>
                          <span className="text-white/60 font-mono text-xs">
                            {token.name}
                          </span>
                        </div>
                        <div className="text-white/40 font-mono text-[10px] truncate">
                          {token.address}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="px-2 py-1 bg-white/10 text-white font-mono text-[9px] tracking-wider whitespace-nowrap">
                          {token.chainName || `CHAIN ${token.chainId}`}
                        </span>
                        {token.marketCap && (
                          <span className="text-white/60 font-mono text-[10px]">
                            ${(token.marketCap / 1000000).toFixed(2)}M
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {scanError && (
            <div className="mt-4 border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-red-500 font-mono text-xs">{scanError}</p>
            </div>
          )}
          </div>
        </div>

        {/* Scan Results - Glassmorphism */}
        {selectedToken && (
          <div id="scan-results" className="relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 mb-8 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
            <div className="relative z-10">
            {/* Token Header with Price & Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Left: Token Info */}
              <div className="lg:col-span-1">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white font-mono tracking-wider">{selectedToken.symbol}</h2>
                    <p className="text-white/70 font-mono text-sm mt-1">{selectedToken.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-white/10 border border-white/20 text-white/60 font-mono text-[10px] tracking-wider">
                        {selectedToken.chain}
                      </span>
                      {selectedToken.confidence && (
                        <span className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] tracking-wider">
                          {selectedToken.confidence}% CONFIDENCE
                        </span>
                      )}
                    </div>
                    {selectedToken.address && selectedToken.address !== 'N/A (Native Asset)' && selectedToken.address !== 'N/A' && (
                      <p className="text-white/40 font-mono text-[10px] mt-2 break-all">
                        {selectedToken.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Center: Price & Market Data */}
              <div className="lg:col-span-1 border-l border-r border-white/10 px-6">
                <div className="space-y-3">
                  {selectedToken.price > 0 && (
                    <div>
                      <div className="text-white/60 font-mono text-[10px] tracking-wider mb-1">CURRENT PRICE</div>
                      <div className="text-2xl font-bold text-white font-mono">
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
                    <div>
                      <div className="text-white/60 font-mono text-[10px] tracking-wider mb-1">MARKET CAP</div>
                      <div className="text-lg font-bold text-white/90 font-mono">{selectedToken.marketCap}</div>
                    </div>
                  )}

                  {selectedToken.age && selectedToken.age !== 'N/A' && (
                    <div>
                      <div className="text-white/60 font-mono text-[10px] tracking-wider mb-1">TOKEN AGE</div>
                      <div className="text-sm font-bold text-white/80 font-mono">{selectedToken.age}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Risk Score */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center">
                <div className={`text-6xl font-bold font-mono ${
                  selectedToken.overallRisk < 30 ? 'text-green-500' :
                  selectedToken.overallRisk < 60 ? 'text-yellow-500' :
                  selectedToken.overallRisk < 80 ? 'text-orange-500' : 'text-red-500'
                }`}>
                  {selectedToken.overallRisk}
                </div>
                <div className="text-white/60 font-mono text-xs mt-2 tracking-wider">RISK SCORE</div>
                <div className={`mt-3 px-4 py-2 rounded border font-mono text-xs tracking-wider ${
                  selectedToken.overallRisk < 30 ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                  selectedToken.overallRisk < 60 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                  selectedToken.overallRisk < 80 ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 
                  'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {selectedToken.overallRisk < 30 ? 'LOW RISK' :
                   selectedToken.overallRisk < 60 ? 'MEDIUM RISK' :
                   selectedToken.overallRisk < 80 ? 'HIGH RISK' : 'CRITICAL RISK'}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 mb-6"></div>

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
                onClick={() => setSelectedToken(null)}
                className="flex items-center gap-2 px-5 py-3 bg-transparent border border-red-500/30 text-red-400 font-mono text-xs tracking-wider hover:bg-red-500 hover:border-red-500 hover:text-white transition-all ml-auto"
              >
                <X className="w-4 h-4" />
                CLOSE
              </button>
            </div>

            {/* Chain-Specific Security Info */}
            {selectedToken.chain && (
              <div className="border border-white/10 bg-white/5 p-4 mb-6">
                <h3 className="text-white font-mono text-xs tracking-wider mb-3 flex items-center gap-2">
                  🔗 {selectedToken.chain.toUpperCase()} CHAIN ANALYSIS
                </h3>
                {selectedToken.chain.toLowerCase() === 'solana' ? (
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-white/60">Freeze Authority:</span>
                      <span className={`ml-2 font-bold ${selectedToken.securityData?.freezeAuthority ? 'text-red-400' : 'text-green-400'}`}>
                        {selectedToken.securityData?.freezeAuthority ? 'ACTIVE ⚠️' : 'REVOKED ✓'}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/60">Mint Authority:</span>
                      <span className={`ml-2 font-bold ${selectedToken.securityData?.mintAuthority ? 'text-red-400' : 'text-green-400'}`}>
                        {selectedToken.securityData?.mintAuthority ? 'ACTIVE ⚠️' : 'REVOKED ✓'}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/60">SPL Token:</span>
                      <span className="ml-2 text-white">YES</span>
                    </div>
                    <div>
                      <span className="text-white/60">Data Source:</span>
                      <span className="ml-2 text-cyan-400">Helius + Moralis</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-white/60">Contract Verified:</span>
                      <span className={`ml-2 font-bold ${selectedToken.securityData?.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                        {selectedToken.securityData?.isVerified ? 'YES ✓' : 'NO ⚠️'}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/60">Ownership:</span>
                      <span className={`ml-2 font-bold ${selectedToken.securityData?.ownershipRenounced ? 'text-green-400' : 'text-yellow-400'}`}>
                        {selectedToken.securityData?.ownershipRenounced ? 'RENOUNCED ✓' : 'ACTIVE ⚠️'}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/60">Proxy Contract:</span>
                      <span className={`ml-2 font-bold ${selectedToken.securityData?.isProxy ? 'text-yellow-400' : 'text-green-400'}`}>
                        {selectedToken.securityData?.isProxy ? 'YES ⚠️' : 'NO ✓'}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/60">Data Source:</span>
                      <span className="ml-2 text-cyan-400">GoPlus + Moralis</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Risk Breakdown - All 10 Factors */}
            <div className="mb-4">
              <h3 className="text-white font-mono text-xs tracking-wider mb-3">RISK FACTORS (10-POINT ANALYSIS)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(selectedToken.factors).map(([key, value]: [string, any]) => (
                <div key={key} className="border border-white/10 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/60 font-mono text-[10px] tracking-wider">
                      {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                    </span>
                    <span className="text-white font-mono text-sm font-bold">{value}</span>
                  </div>
                  <div className="h-1 bg-white/20 rounded overflow-hidden">
                    <div 
                      className={`h-full ${value < 30 ? 'bg-green-500' : value < 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
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
                  <span className="text-lg">🤖</span>
                  AI CLASSIFICATION
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-mono text-[10px]">TYPE</span>
                    <span className={`font-mono text-xs font-bold ${
                      selectedToken.ai_insights.classification === 'MEME_TOKEN' ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      {selectedToken.ai_insights.classification === 'MEME_TOKEN' ? '🎭 MEME TOKEN' : '🏢 UTILITY TOKEN'}
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

        {/* Watchlist - Glassmorphism */}
        <div className="relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-white font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              WATCHLIST
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
                  className="group relative w-full border border-white/10 hover:border-white/30 transition-all"
                >
                  <button
                    onClick={() => {
                      setSearchQuery(token.address)
                      handleScan()
                    }}
                    className="w-full p-4 text-left"
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

        {/* Historical Analytics - Glassmorphism */}
        {selectedToken && (
        <div className="relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-white font-mono text-xs tracking-wider mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              HISTORICAL ANALYTICS - {selectedToken.symbol}
            </h2>

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
        </div>
        )}

        {/* Advanced Insights Section - Glassmorphism */}
        {selectedToken && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Market Sentiment */}
          <div className="relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <h3 className="text-white font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                MARKET SENTIMENT
              </h3>
            {loadingInsights ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
              </div>
            ) : insightData.sentiment ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-white/60 font-mono text-xs">BULLISH</span>
                    <span className="text-green-500 font-mono text-xs">{insightData.sentiment.bullish}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded">
                    <div className="h-full bg-green-500 rounded" style={{ width: `${insightData.sentiment.bullish}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-white/60 font-mono text-xs">NEUTRAL</span>
                    <span className="text-yellow-500 font-mono text-xs">{insightData.sentiment.neutral}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded">
                    <div className="h-full bg-yellow-500 rounded" style={{ width: `${insightData.sentiment.neutral}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-white/60 font-mono text-xs">BEARISH</span>
                    <span className="text-red-500 font-mono text-xs">{insightData.sentiment.bearish}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded">
                    <div className="h-full bg-red-500 rounded" style={{ width: `${insightData.sentiment.bearish}%` }}></div>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <div className="flex justify-between">
                    <span className="text-white/60 font-mono text-xs">OVERALL</span>
                    <span className={`font-mono text-xs font-bold ${
                      insightData.sentiment.overall === 'BULLISH' ? 'text-green-500' :
                      insightData.sentiment.overall === 'BEARISH' ? 'text-red-500' : 'text-yellow-500'
                    }`}>
                      {insightData.sentiment.overall}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-white/40 font-mono text-xs">
                  {selectedToken ? 'No sentiment data available' : 'Scan a token to view sentiment'}
                </p>
              </div>
            )}
            </div>
          </div>

          {/* Security Metrics */}
          <div className="relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <h3 className="text-white font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4" />
                SECURITY METRICS
              </h3>
            {loadingInsights ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
              </div>
            ) : insightData.security ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 font-mono text-xs">CONTRACT SECURITY</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-white/10 rounded">
                      <div className="h-full bg-green-500 rounded" style={{ width: `${insightData.security.contractSecurity.score}%` }}></div>
                    </div>
                    <span className="text-green-500 font-mono text-xs">{insightData.security.contractSecurity.grade}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 font-mono text-xs">LIQUIDITY LOCK</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-white/10 rounded">
                      <div className="h-full bg-green-500 rounded" style={{ width: `${insightData.security.liquidityLock.percentage}%` }}></div>
                    </div>
                    <span className={`font-mono text-xs ${insightData.security.liquidityLock.locked ? 'text-green-500' : 'text-red-500'}`}>
                      {insightData.security.liquidityLock.locked ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 font-mono text-xs">AUDIT STATUS</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-white/10 rounded">
                      <div className="h-full bg-green-500 rounded" style={{ width: `${insightData.security.auditStatus.score}%` }}></div>
                    </div>
                    <span className={`font-mono text-xs ${insightData.security.auditStatus.audited ? 'text-green-500' : 'text-yellow-500'}`}>
                      {insightData.security.auditStatus.audited ? '✓' : '?'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 font-mono text-xs">OWNERSHIP</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-white/10 rounded">
                      <div className="h-full bg-green-500 rounded" style={{ width: `${insightData.security.ownership.score}%` }}></div>
                    </div>
                    <span className={`font-mono text-xs ${
                      insightData.security.ownership.status === 'RENOUNCED' ? 'text-green-500' :
                      insightData.security.ownership.status === 'DECENTRALIZED' ? 'text-blue-500' : 'text-yellow-500'
                    }`}>
                      {insightData.security.ownership.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-white/40 font-mono text-xs">
                  {selectedToken ? 'No security data available' : 'Scan a token to view security'}
                </p>
              </div>
            )}
            </div>
          </div>

          {/* Top Holders Distribution */}
          <div className="relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <h3 className="text-white font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                TOP HOLDERS SHARE
              </h3>
            {loadingInsights ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
              </div>
            ) : insightData.holders ? (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white/60 font-mono text-xs">TOP 10</span>
                    <span className="text-white font-mono text-xs">{insightData.holders.top10}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded">
                    <div className="h-full bg-blue-500 rounded" style={{ width: `${insightData.holders.top10}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white/60 font-mono text-xs">TOP 50</span>
                    <span className="text-white font-mono text-xs">{insightData.holders.top50}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded">
                    <div className="h-full bg-purple-500 rounded" style={{ width: `${insightData.holders.top50}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white/60 font-mono text-xs">TOP 100</span>
                    <span className="text-white font-mono text-xs">{insightData.holders.top100}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded">
                    <div className="h-full bg-pink-500 rounded" style={{ width: `${insightData.holders.top100}%` }}></div>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <div className="flex justify-between">
                    <span className="text-white/60 font-mono text-xs">DECENTRALIZATION</span>
                    <span className={`font-mono text-xs font-bold ${
                      insightData.holders.decentralization === 'EXCELLENT' ? 'text-green-500' :
                      insightData.holders.decentralization === 'GOOD' ? 'text-blue-500' :
                      insightData.holders.decentralization === 'FAIR' ? 'text-yellow-500' :
                      insightData.holders.decentralization === 'POOR' ? 'text-orange-500' : 'text-red-500'
                    }`}>
                      {insightData.holders.decentralization}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-white/40 font-mono text-xs">
                  {selectedToken ? 'No holder data available' : 'Scan a token to view holders'}
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
          <div className="relative z-10">
            <h3 className="text-white font-mono text-xs tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              RECENT ACTIVITY FEED
            </h3>
            <div className="flex items-center justify-center h-64">
              <p className="text-white/40 font-mono text-xs">Transaction feed coming soon - currently tracking via Analytics section</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 hover:border-white/30 transition-all shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white">{icon}</div>
          <span className="text-white/40 font-mono text-[10px]">LIVE</span>
        </div>
        <p className="text-white/60 font-mono text-[10px] tracking-wider mb-1">{label}</p>
        <p className="text-3xl font-bold text-white font-mono">{value}</p>
      </div>
    </div>
  )
}
