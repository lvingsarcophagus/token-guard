'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { MorphingSquare } from '@/components/ui/morphing-square'
import TokenSearchComponent from '@/components/token-search-cmc'
import { 
  Shield, 
  Zap,
  TrendingUp,
  Clock,
  Target,
  BarChart3,
  Crown,
  AlertCircle,
  CheckCircle,
  Plus,
  Sparkles,
  ArrowRight,
  Activity,
  LogOut,
  User,
  Search,
  Menu,
  X,
  AlertTriangle,
  Lock,
  Unlock,
  Droplet,
  Flame,
  ChevronDown,
  ChevronUp,
  XCircle,
  TrendingDown,
  Users,
  BadgeCheck,
  Loader2
} from 'lucide-react'
import { TokenScanService, CompleteTokenData } from '@/lib/token-scan-service'
import type { RiskResult } from '@/lib/types/token-data'
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts'
import { 
  getDashboardStats, 
  addToWatchlist, 
  removeFromWatchlist, 
  isInWatchlist,
  getWatchlist 
} from '@/lib/services/firestore-service'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import type { DashboardStats, WatchlistToken } from '@/lib/firestore-schema'

export default function FreeDashboard() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showRawData, setShowRawData] = useState(false)

  // Scan integration states
  const [searchQuery, setSearchQuery] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [scannedToken, setScannedToken] = useState<CompleteTokenData | null>(null)
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null)
  const [showTokenSearch, setShowTokenSearch] = useState(false)

  // Watchlist states
  const [watchlist, setWatchlist] = useState<WatchlistToken[]>([])
  const [isInWatchlistState, setIsInWatchlistState] = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [justScanned, setJustScanned] = useState(false) // Track fresh scans
  const [showPreviousScans, setShowPreviousScans] = useState(false) // Track if user wants to see previous scans

  // Mock token data for demonstration - replace with actual recent scan data
  const [selectedToken, setSelectedToken] = useState<any>(null)

  useEffect(() => {
    console.log('[Free Dashboard] Auth state:', { user: !!user, userProfile: userProfile?.plan, loading })
    if (!loading && !user) {
      console.log('[Free Dashboard] No user, redirecting to login')
      router.push('/login')
    } else if (!loading && userProfile?.plan === 'PREMIUM') {
      console.log('[Free Dashboard] Premium user, redirecting to premium dashboard')
      router.push('/premium/dashboard')
    }
  }, [user, userProfile, loading, router])

  useEffect(() => {
    console.log('[Free Dashboard] Load data check:', { user: !!user, plan: userProfile?.plan })
    if (user && (userProfile?.plan === 'FREE' || !userProfile?.plan)) {
      // Load dashboard for FREE users or users without plan set (assume FREE)
      console.log('[Free Dashboard] Loading dashboard data...')
      loadDashboardData()
    }
  }, [user, userProfile])

  async function loadDashboardData() {
    if (!user) return
    
    console.log('[Free Dashboard] Starting data load for user:', user.uid)
    setLoadingData(true)
    try {
      const [dashStats, userWatchlist] = await Promise.all([
        getDashboardStats(user.uid, 'FREE'),
        getWatchlist(user.uid)
      ])
      console.log('[Free Dashboard] Stats loaded:', dashStats)
      console.log('[Free Dashboard] Watchlist loaded:', userWatchlist.length, 'tokens')
      setStats(dashStats)
      setWatchlist(userWatchlist)
    } catch (error) {
      console.error('[Free Dashboard] Failed to load dashboard data:', error)
      // Set empty stats to allow dashboard to render
      setStats({
        tokensAnalyzed: 0,
        watchlistCount: 0,
        activeAlerts: 0,
        avgRiskScore: 0,
        recentScans: [],
        recentAlerts: []
      })
      setWatchlist([])
    } finally {
      console.log('[Free Dashboard] Data load complete, setting loadingData = false')
      setLoadingData(false)
    }
  }

  console.log('[Free Dashboard] Render:', { loading, loadingData, user: !!user, stats: !!stats })

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Handle token selection from CMC search
  const handleTokenSelectFromSearch = async (address: string, chain: string, symbol: string, name: string) => {
    console.log(`[Dashboard] Token selected from search: ${name} (${symbol}) on ${chain}`)
    console.log(`[Dashboard] Address: ${address}`)
    
    // Set the search query to the address
    setSearchQuery(address)
    
    // Automatically trigger scan
    setTimeout(() => {
      handleScan()
    }, 100)
  }

  const handleScan = async () => {
    if (!searchQuery.trim()) {
      setScanError('PLEASE ENTER A TOKEN ADDRESS OR SYMBOL')
      return
    }

    // Check scan limit for free users
    if (userProfile?.plan === 'FREE' && (stats?.tokensAnalyzed || 0) >= 10) {
      setScanError('DAILY LIMIT REACHED. UPGRADE TO PREMIUM FOR UNLIMITED SCANS.')
      return
    }

    setScanning(true)
    setScanError('')
    setScannedToken(null)
    setRiskResult(null)
    setJustScanned(true) // Mark that we're doing a fresh scan

    try {
      const query = searchQuery.trim()
      const data = await TokenScanService.scanToken(query)
      
      if (!data.priceData && !data.securityData) {
        setScanError('TOKEN NOT FOUND. PLEASE CHECK THE ADDRESS OR SYMBOL.')
        setScanning(false)
        return
      }

      setScannedToken(data)

      // Get risk analysis for addresses (supports both EVM and Solana)
      const isEVMAddress = query.startsWith('0x') && query.length === 42
      const isSolanaAddress = query.length >= 32 && query.length <= 44 && !query.startsWith('0x')
      const isAddress = isEVMAddress || isSolanaAddress
      
      if (isAddress) {
        try {
          // Determine chainId - if Solana address or data indicates Solana, use Solana chainId
          let chainId = data.chain || 1
          if (isSolanaAddress || data.chainInfo?.chainName?.toLowerCase().includes('solana')) {
            chainId = 1399811149 // Solana
          }
          
          console.log(`[Dashboard] Analyzing token on chain ${chainId} (Solana: ${isSolanaAddress})`)
          
          const res = await fetch('/api/analyze-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokenAddress: query,
              chainId: chainId,
              userId: user?.uid || 'anonymous',
              plan: userProfile?.plan || 'FREE',
            }),
          })

          if (res.ok) {
            const result = await res.json()
            console.log('[Dashboard] API Response:', result)
            console.log('[Dashboard] Risk Score:', result.overall_risk_score)
            console.log('[Dashboard] Breakdown:', result.breakdown)
            setRiskResult(result)
            
            // Get proper token name and symbol from scanned data or use query as fallback
            const tokenName = data.priceData?.name || query.substring(0, 8) + '...'
            const tokenSymbol = data.priceData?.symbol || 'TOKEN'
            
            // Convert to selectedToken format for detailed view
            const newToken = {
              name: tokenName,
              symbol: tokenSymbol,
              address: query,
              chain: data.chainInfo?.chainName || 'ETHEREUM',
              marketCap: formatMarketCap(data.priceData?.marketCap),
              price: data.priceData?.price || 0,
              age: '2h', // TODO: Calculate from data
              overallRisk: result.overall_risk_score,
              confidence: result.confidence_score || 94,
              dataTier: result.data_tier || 'TIER_2_STANDARD',
              dataFreshness: result.data_freshness || 1.0,
              lastUpdated: 'just now',
              factors: {
                contractSecurity: result.breakdown?.contractControl || 0,
                supplyRisk: result.breakdown?.supplyDilution || 0,
                whaleConcentration: result.breakdown?.holderConcentration || 0,
                liquidityDepth: result.breakdown?.liquidityDepth || 0,
                marketActivity: result.breakdown?.adoption || 0,
                burnMechanics: result.breakdown?.burnDeflation || 0,
                tokenAge: result.breakdown?.auditTransparency || 0
              },
              redFlags: result.warning_flags || extractRedFlags(result),
              positiveSignals: result.positive_signals || extractPositiveSignals(result),
              criticalFlags: result.critical_flags || extractCriticalFlags(result),
              rawData: result
            }
            
            console.log('[Dashboard] ✅ Setting NEW selectedToken with risk:', newToken.overallRisk)
            setSelectedToken(newToken)
            setShowPreviousScans(false) // Reset flag to prevent auto-loading

            // Reload dashboard stats (but delay to prevent overwriting fresh scan)
            setTimeout(() => {
              loadDashboardData()
            }, 2000) // Wait 2 seconds before reloading stats

            // Scroll to results
            setTimeout(() => {
              const resultsElement = document.getElementById('scan-results')
              if (resultsElement) {
                resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }, 100)
          } else {
            console.error('[Dashboard] API request failed:', res.status, res.statusText)
            setScanError(`API ERROR: ${res.status} - Unable to analyze token. Try again.`)
          }
        } catch (err) {
          console.error('Risk analysis failed:', err)
        }
      } else {
        // For symbols (like BTC, ETH), create a basic display with price info
        const tokenName = data.priceData?.name || query.toUpperCase()
        const tokenSymbol = data.priceData?.symbol || query.toUpperCase()
        
        // Set reasonable defaults for well-known symbols
        const isWellKnown = ['BTC', 'ETH', 'BNB', 'SOL', 'USDT', 'USDC'].includes(query.toUpperCase())
        
        setSelectedToken({
          name: tokenName,
          symbol: tokenSymbol,
          address: query,
          chain: data.chainInfo?.chainName || 'MULTIPLE',
          marketCap: formatMarketCap(data.priceData?.marketCap),
          price: data.priceData?.price || 0,
          age: 'Established',
          overallRisk: isWellKnown ? 10 : 15, // Very low risk for established tokens
          confidence: 85, // Good confidence for price data
          lastUpdated: 'just now',
          factors: {
            contractSecurity: isWellKnown ? 5 : 10,  // Very secure for major tokens
            supplyRisk: isWellKnown ? 8 : 15,        // Low supply risk
            whaleConcentration: isWellKnown ? 12 : 20, // Some whale concentration
            liquidityDepth: isWellKnown ? 5 : 10,    // Excellent liquidity
            marketActivity: isWellKnown ? 5 : 12,    // Very active
            burnMechanics: isWellKnown ? 15 : 20,    // Varies by token
            tokenAge: isWellKnown ? 3 : 8            // Well established
          },
          redFlags: ['⚠️ Symbol-based search - Use token contract address for full security analysis'],
          positiveSignals: [
            '✓ Price data available', 
            '✓ Market cap tracked',
            isWellKnown ? '✓ Well-established cryptocurrency' : '✓ Recognized token'
          ],
          criticalFlags: [],
          rawData: null
        })

        // Scroll to results
        setTimeout(() => {
          const resultsElement = document.getElementById('scan-results')
          if (resultsElement) {
            resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
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
    
    if (diffDays > 365) return `${Math.floor(diffDays / 365)}y old`
    if (diffDays > 30) return `${Math.floor(diffDays / 30)}mo old`
    if (diffDays > 0) return `${diffDays}d old`
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours > 0) return `${diffHours}h old`
    
    const diffMins = Math.floor(diffMs / (1000 * 60))
    return `${diffMins}m old`
  }

  const getTimeAgo = (date: Date | any): string => {
    if (!date) return 'just now'
    const d = date instanceof Date ? date : new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  // Watchlist handlers
  const handleAddToWatchlist = async () => {
    if (!user || !selectedToken) return
    
    setWatchlistLoading(true)
    try {
      const watchlistToken: WatchlistToken = {
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
            supplyDilution: selectedToken.factors.supplyRisk,
            holderConcentration: selectedToken.factors.whaleConcentration,
            liquidityDepth: selectedToken.factors.liquidityDepth,
            vestingUnlock: 0,
            contractControl: selectedToken.factors.contractSecurity,
            taxFee: 0,
            distribution: 0,
            burnDeflation: selectedToken.factors.burnMechanics,
            adoption: selectedToken.factors.marketActivity,
            auditTransparency: selectedToken.factors.tokenAge
          }
        },
        marketData: {
          price: selectedToken.price,
          priceChange24h: 0,
          marketCap: parseFloat(selectedToken.marketCap.replace(/[$,KMB]/g, '')) || 0,
          volume24h: 0,
          liquidity: 0
        },
        alertsEnabled: false,
        alertThreshold: 20,
        notes: '',
        tags: [],
        addedAt: new Date(),
        lastUpdatedAt: new Date()
      }

      await addToWatchlist(user.uid, watchlistToken)
      setIsInWatchlistState(true)
      
      // Reload watchlist
      const updatedWatchlist = await getWatchlist(user.uid)
      setWatchlist(updatedWatchlist)
      
      // Update stats
      loadDashboardData()
    } catch (error) {
      console.error('Failed to add to watchlist:', error)
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
      const updatedWatchlist = await getWatchlist(user.uid)
      setWatchlist(updatedWatchlist)
      
      // Update stats
      loadDashboardData()
    } catch (error) {
      console.error('Failed to remove from watchlist:', error)
    } finally {
      setWatchlistLoading(false)
    }
  }

  // Check if current token is in watchlist
  useEffect(() => {
    const checkWatchlistStatus = async () => {
      if (!user || !selectedToken) return
      
      const inWatchlist = await isInWatchlist(user.uid, selectedToken.address)
      setIsInWatchlistState(inWatchlist)
    }
    
    checkWatchlistStatus()
  }, [user, selectedToken])

  const extractRedFlags = (results: any): string[] => {
    const flags: string[] = []
    
    if (results.holder_analysis?.top_10_percentage > 80) {
      flags.push(`Top 10 hold ${results.holder_analysis.top_10_percentage}% → possible dump`)
    }
    if (!results.liquidity_info?.is_locked) {
      flags.push('Liquidity unlocked → rug risk')
    }
    if (results.security_info?.is_honeypot) {
      flags.push('Honeypot mechanism detected')
    }
    
    return flags
  }

  const extractPositiveSignals = (results: any): string[] => {
    const signals: string[] = []
    
    if (results.liquidity_info?.is_locked) {
      signals.push('LP locked 100%')
    }
    if (results.contract_info?.is_open_source) {
      signals.push('Contract verified')
    }
    if (results.security_info?.is_mintable === false) {
      signals.push('Cannot mint new tokens')
    }
    
    return signals
  }

  const extractCriticalFlags = (results: any): string[] => {
    const critical: string[] = []
    
    if (results.security_info?.is_honeypot) {
      critical.push('HONEYPOT DETECTED - Cannot sell tokens')
    }
    if (results.overall_risk_score > 80) {
      critical.push('EXTREMELY HIGH RISK - Do not invest')
    }
    
    return critical
  }

  // Generate weekly usage data from recent scans
  const getWeeklyUsageData = () => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    const today = new Date().getDay() // 0 = Sunday, 6 = Saturday
    
    // Initialize all days with 0 scans
    const weekData = days.map((day, index) => ({
      day,
      scans: 0,
      index
    }))

    // Count scans per day from recentScans
    if (stats?.recentScans) {
      stats.recentScans.forEach(scan => {
        const scanDate = new Date(scan.analyzedAt)
        const daysDiff = Math.floor((Date.now() - scanDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff < 7) {
          const scanDayIndex = scanDate.getDay()
          const dataPoint = weekData.find(d => d.index === scanDayIndex)
          if (dataPoint) {
            dataPoint.scans++
          }
        }
      })
    }

    // Reorder to start from Monday and end at Sunday
    return [
      weekData[1], // MON
      weekData[2], // TUE
      weekData[3], // WED
      weekData[4], // THU
      weekData[5], // FRI
      weekData[6], // SAT
      weekData[0], // SUN
    ]
  }


  // Get most recent scan for detailed view (only if we haven't just scanned AND user wants to see it)
  useEffect(() => {
    console.log('[Dashboard] useEffect check:', { 
      hasStats: !!stats?.recentScans?.length, 
      hasSelectedToken: !!selectedToken,
      justScanned,
      showPreviousScans,
      scanning
    })
    
    // Only auto-load if user explicitly wants to see previous scans AND not currently scanning
    if (stats?.recentScans && stats.recentScans.length > 0 && !selectedToken && !justScanned && showPreviousScans && !scanning) {
      const latest = stats.recentScans[0]
      console.log('[Dashboard] Loading latest scan from Firebase:', latest)
      console.log('[Dashboard] Latest scan risk score:', latest.results.overall_risk_score)
      
      // Extract factor scores from breakdown if available
      const breakdown = latest.results.breakdown || {}
      const resultsAny = latest.results as any
      console.log('[Dashboard] Breakdown:', breakdown)
      
      setSelectedToken({
        name: latest.tokenName || latest.tokenSymbol,
        symbol: latest.tokenSymbol,
        address: latest.tokenAddress,
        chain: latest.chainId || 'ETHEREUM',
        marketCap: formatMarketCap(latest.marketSnapshot?.marketCap),
        price: latest.marketSnapshot?.price || 0,
        age: getTokenAge(latest.analyzedAt),
        overallRisk: latest.results.overall_risk_score,
        confidence: latest.results.confidence_score || 85,
        dataTier: resultsAny.data_tier,
        dataFreshness: resultsAny.data_freshness,
        lastUpdated: getTimeAgo(latest.analyzedAt),
        factors: {
          contractSecurity: breakdown.contractControl || 0,
          supplyRisk: breakdown.supplyDilution || 0,
          whaleConcentration: breakdown.holderConcentration || 0,
          liquidityDepth: breakdown.liquidityDepth || 0,
          marketActivity: breakdown.adoption || 0,
          burnMechanics: breakdown.burnDeflation || 0,
          tokenAge: breakdown.auditTransparency || 0
        },
        redFlags: resultsAny.warning_flags || [],
        positiveSignals: resultsAny.positive_signals || [],
        criticalFlags: latest.results.critical_flags || [],
        rawData: latest.results
      })
    }
  }, [stats, selectedToken, justScanned, showPreviousScans])

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'bg-green-500'
    if (score <= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getRiskLabel = (score: number) => {
    if (score <= 30) return 'LOW RISK'
    if (score <= 60) return 'MEDIUM RISK'
    return 'HIGH RISK'
  }

  const getRiskBarWidth = (score: number) => {
    return `${(score / 100) * 100}%`
  }

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <MorphingSquare 
          message="LOADING DASHBOARD..."
          messagePlacement="bottom"
        />
      </div>
    )
  }

  const usagePercent = ((stats?.tokensAnalyzed || 0) / 10) * 100
  const remainingScans = 10 - (stats?.tokensAnalyzed || 0)

  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <nav className="border-b border-white/20 bg-black/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <img 
                src="/Logo.png" 
                alt="Tokenomics Lab" 
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain transition-all duration-300 group-hover:scale-110 group-hover:brightness-110 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
              />
              <span className="text-white font-mono font-bold tracking-wider text-base sm:text-lg hidden sm:block group-hover:text-white/90 transition-colors">
                TOKENOMICS LAB
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/scan"
                className="flex items-center gap-2 px-4 py-2 bg-transparent border border-white/30 text-white font-mono text-xs tracking-wider hover:bg-white hover:text-black transition-all duration-200"
              >
                <Search className="w-4 h-4" />
                SCAN TOKEN
              </Link>
              
              <Link 
                href="/pricing"
                className="flex items-center gap-2 px-4 py-2 bg-transparent border border-white/30 text-white font-mono text-xs tracking-wider hover:bg-white hover:text-black transition-all duration-200"
              >
                <Crown className="w-4 h-4" />
                UPGRADE
              </Link>

              <Link 
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 bg-transparent border border-white/30 text-white font-mono text-xs tracking-wider hover:bg-white hover:text-black transition-all duration-200"
              >
                <User className="w-4 h-4" />
                PROFILE
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-transparent border border-white/30 text-white font-mono text-xs tracking-wider hover:bg-white hover:text-black transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                LOGOUT
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/20 py-4 space-y-2">
              <Link
                href="/scan"
                className="w-full flex items-center gap-2 px-4 py-2 bg-transparent border border-white/30 text-white font-mono text-xs tracking-wider hover:bg-white hover:text-black transition-all duration-200"
              >
                <Search className="w-4 h-4" />
                SCAN TOKEN
              </Link>
              
              <Link 
                href="/pricing"
                className="w-full flex items-center gap-2 px-4 py-2 bg-transparent border border-white/30 text-white font-mono text-xs tracking-wider hover:bg-white hover:text-black transition-all duration-200"
              >
                <Crown className="w-4 h-4" />
                UPGRADE
              </Link>

              <Link 
                href="/profile"
                className="w-full flex items-center gap-2 px-4 py-2 bg-transparent border border-white/30 text-white font-mono text-xs tracking-wider hover:bg-white hover:text-black transition-all duration-200"
              >
                <User className="w-4 h-4" />
                PROFILE
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 bg-transparent border border-white/30 text-white font-mono text-xs tracking-wider hover:bg-white hover:text-black transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                LOGOUT
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Background */}
      <div className="fixed inset-0 stars-bg pointer-events-none opacity-30"></div>
      <div className="fixed inset-0 grid-pattern pointer-events-none opacity-20"></div>

      {/* Main Content */}
      <main className="relative px-4 lg:px-8 py-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 opacity-60">
            <div className="w-8 h-px bg-white"></div>
            <span className="text-white text-[10px] font-mono tracking-wider">FREE TIER</span>
            <div className="flex-1 h-px bg-white"></div>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold text-white font-mono tracking-wider mb-2">
                SECURITY DASHBOARD
              </h1>
              <p className="text-white/60 font-mono text-xs">
                {user?.email?.toUpperCase()}
              </p>
            </div>

            {/* Upgrade CTA */}
            <Link href="/pricing">
              <button className="relative px-6 py-3 bg-white text-black font-mono text-xs border border-white hover:bg-black hover:text-white transition-all duration-200 group">
                <Crown className="inline w-4 h-4 mr-2" />
                UPGRADE TO PREMIUM
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Grid - At the very top */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Tokens Analyzed */}
          <div className="border border-white/20 bg-black/60 p-6 hover:border-white/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
              <span className="text-white/40 font-mono text-[10px]">TODAY</span>
            </div>
            <p className="text-3xl font-bold text-white font-mono mb-1">
              {stats?.tokensAnalyzed || 0}/10
            </p>
            <p className="text-white/60 font-mono text-xs tracking-wider">SCANS USED</p>
          </div>

          {/* Watchlist */}
          <div className="border border-white/20 bg-black/60 p-6 hover:border-white/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-6 h-6 text-white" />
              <span className="text-white/40 font-mono text-[10px]">MAX 5</span>
            </div>
            <p className="text-3xl font-bold text-white font-mono mb-1">
              {stats?.watchlistCount || 0}/5
            </p>
            <p className="text-white/60 font-mono text-xs tracking-wider">WATCHLIST</p>
          </div>

          {/* Active Alerts */}
          <div className="border border-white/20 bg-black/60 p-6 hover:border-white/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="w-6 h-6 text-white" />
              <span className="text-white/40 font-mono text-[10px]">BASIC</span>
            </div>
            <p className="text-3xl font-bold text-white font-mono mb-1">
              {stats?.activeAlerts || 0}
            </p>
            <p className="text-white/60 font-mono text-xs tracking-wider">ALERTS</p>
          </div>

          {/* Avg Risk Score */}
          <div className="border border-white/20 bg-black/60 p-6 hover:border-white/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-6 h-6 text-white" />
              <span className="text-white/40 font-mono text-[10px]">AVG</span>
            </div>
            <p className="text-3xl font-bold text-white font-mono mb-1">
              {stats?.avgRiskScore || 0}
            </p>
            <p className="text-white/60 font-mono text-xs tracking-wider">RISK SCORE</p>
          </div>
        </div>

        {/* Integrated Token Scanner - Glassmorphism */}
        <div className="mb-8">
          <div className="relative border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-white" />
                  <h2 className="text-white font-mono text-lg tracking-wider">QUICK SCAN</h2>
                </div>
              <button
                onClick={() => setShowTokenSearch(!showTokenSearch)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/30 transition-colors"
              >
                {showTokenSearch ? 'MANUAL INPUT' : 'SEARCH BY NAME'}
              </button>
            </div>
            
            {showTokenSearch ? (
              /* Token Search by Name/Symbol */
              <div className="space-y-4">
                <TokenSearchComponent onTokenSelect={handleTokenSelectFromSearch} />
                <div className="text-xs font-mono text-white/60">
                  💡 Search for tokens by name or symbol (e.g., BONK, Solana)
                </div>
              </div>
            ) : (
              /* Traditional Address/Symbol Input */
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="ENTER TOKEN ADDRESS OR SYMBOL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                    disabled={scanning}
                    className="w-full px-4 py-3 bg-black border border-white/30 text-white font-mono text-sm placeholder:text-white/40 focus:outline-none focus:border-white transition-colors disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={handleScan}
                  disabled={scanning || !searchQuery.trim()}
                  className="px-8 py-3 bg-white text-black font-mono text-sm hover:bg-black hover:text-white border-2 border-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      SCANNING...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      SCAN NOW
                    </>
                  )}
                </button>
              </div>
            )}

            {scanError && (
              <div className="mt-4 p-3 border border-red-500/50 bg-red-500/10">
                <p className="text-red-400 font-mono text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {scanError}
                </p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-xs font-mono">
              <span className="text-white/60">
                {stats?.tokensAnalyzed || 0}/10 SCANS USED TODAY
              </span>
              {userProfile?.plan === 'FREE' && (
                <Link href="/pricing" className="text-white hover:underline">
                  UPGRADE FOR UNLIMITED →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Scanning Progress */}
        {scanning && (
          <div className="mb-8 border border-white/40 bg-black/80 p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-white border-t-transparent animate-spin mb-4"></div>
              <p className="text-white font-mono text-sm tracking-wider mb-2">ANALYZING TOKEN...</p>
              <p className="text-white/60 font-mono text-xs">Gathering security data from multiple sources</p>
            </div>
          </div>
        )}

        {/* Usage Alert */}
        {remainingScans <= 3 && (
          <div className="mb-6 border border-white/30 bg-black/60 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-white mt-0.5" />
              <div>
                <p className="text-white font-mono text-sm mb-1">USAGE LIMIT WARNING</p>
                <p className="text-white/60 font-mono text-xs">
                  {remainingScans} SCANS REMAINING TODAY. UPGRADE FOR UNLIMITED ACCESS.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Token Analysis View - Show FIRST if available */}
        {selectedToken && (
          <div id="scan-results" className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-px bg-white"></div>
              <h2 className="text-white font-mono text-lg tracking-wider">
                {scannedToken ? 'SCAN RESULTS' : 'LATEST SCAN ANALYSIS'}
              </h2>
              {scannedToken && (
                <span className="px-2 py-1 bg-green-500/20 border border-green-500/40 text-green-400 font-mono text-[10px] tracking-wider">
                  NEW
                </span>
              )}
              <div className="flex-1 h-px bg-white"></div>
            </div>

            {/* Token Analysis Card - Clean Design */}
            <div className="border border-white/20 bg-black/60 p-6 mb-8">
              {/* Top Section: Token Info + Stats + Risk Score */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Token Info */}
                <div className="lg:col-span-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-white font-mono tracking-wider">
                        {selectedToken.symbol}
                      </h2>
                      <p className="text-white/70 font-mono text-sm mt-1">
                        {selectedToken.name || selectedToken.symbol}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-white/10 border border-white/20 text-white/60 font-mono text-[10px] tracking-wider">
                          {selectedToken.chain}
                        </span>
                        <span className="px-2 py-1 bg-white/10 border border-white/30 text-white/80 font-mono text-[10px] tracking-wider">
                          {selectedToken.confidence || 93}% CONFIDENCE
                        </span>
                      </div>
                      <p className="text-white/40 font-mono text-[10px] mt-2 break-all">
                        {selectedToken.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Token Stats */}
                <div className="lg:col-span-1 border-l border-r border-white/10 px-6">
                  <div className="space-y-3">
                    <div>
                      <div className="text-white/60 font-mono text-[10px] tracking-wider mb-1">CURRENT PRICE</div>
                      <div className="text-2xl font-bold text-white font-mono">
                        {selectedToken.price !== undefined && selectedToken.price !== null && selectedToken.price > 0
                          ? `$${selectedToken.price < 1 ? selectedToken.price.toFixed(6) : selectedToken.price.toLocaleString()}`
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/60 font-mono text-[10px] tracking-wider mb-1">MARKET CAP</div>
                      <div className="text-lg font-bold text-white/90 font-mono">{selectedToken.marketCap}</div>
                    </div>
                    <div>
                      <div className="text-white/60 font-mono text-[10px] tracking-wider mb-1">TOKEN AGE</div>
                      <div className="text-sm font-bold text-white/80 font-mono">{selectedToken.age}</div>
                    </div>
                  </div>
                </div>

                {/* Risk Score */}
                <div className="lg:col-span-1 flex flex-col items-center justify-center">
                  <div className={`text-6xl font-bold font-mono ${
                    (selectedToken.overallRisk || 0) <= 30 ? 'text-green-500' :
                    (selectedToken.overallRisk || 0) <= 60 ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {selectedToken.overallRisk || 0}
                  </div>
                  <div className="text-white/60 font-mono text-xs mt-2 tracking-wider">RISK SCORE</div>
                  <div className={`mt-3 px-4 py-2 rounded border font-mono text-xs tracking-wider ${
                    (selectedToken.overallRisk || 0) <= 30 
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : (selectedToken.overallRisk || 0) <= 60 
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {getRiskLabel(selectedToken.overallRisk || 0)}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 mb-6"></div>

              {/* Action Buttons */}
              <button
                onClick={isInWatchlistState ? handleRemoveFromWatchlist : handleAddToWatchlist}
                disabled={watchlistLoading}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/30 text-white font-mono text-xs tracking-wider hover:bg-white hover:text-black hover:border-white transition-all disabled:opacity-50 backdrop-blur-md"
              >
                {watchlistLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    LOADING...
                  </>
                ) : isInWatchlistState ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    IN WATCHLIST
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    ADD TO WATCHLIST
                  </>
                )}
              </button>

              {selectedToken.address && selectedToken.chain && (
                <a
                  href={`https://${selectedToken.chain === 'Ethereum' ? 'etherscan.io' : 'bscscan.com'}/token/${selectedToken.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/30 text-white font-mono text-xs tracking-wider hover:bg-white/20 hover:border-white/50 hover:text-white transition-all backdrop-blur-md"
                >
                  <Search className="w-4 h-4" />
                  VIEW ON EXPLORER
                  <ArrowRight className="w-3 h-3" />
                </a>
              )}

              <button
                onClick={() => {
                  setSelectedToken(null)
                  setScannedToken(null)
                  setJustScanned(false)
                }}
                className="flex items-center gap-2 px-5 py-3 bg-transparent border border-red-500/30 text-red-400 font-mono text-xs tracking-wider hover:bg-red-500 hover:border-red-500 hover:text-white transition-all ml-auto"
              >
                <X className="w-4 h-4" />
                CLOSE
              </button>
            </div>

            {/* Risk Factors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

              {/* Risk Factors - Clean Grid */}
              <div className="border border-white/10 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60 font-mono text-[10px] tracking-wider">CONTRACT SECURITY</span>
                  <span className="text-white font-mono text-sm font-bold">{selectedToken.factors.contractSecurity}</span>
                </div>
                <div className="h-1 bg-white/20 rounded overflow-hidden">
                  <div className={`h-full ${getRiskColor(selectedToken.factors.contractSecurity)}`} style={{ width: `${selectedToken.factors.contractSecurity}%` }}></div>
                </div>
              </div>

              <div className="border border-white/10 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60 font-mono text-[10px] tracking-wider">SUPPLY RISK</span>
                  <span className="text-white font-mono text-sm font-bold">{selectedToken.factors.supplyRisk}</span>
                </div>
                <div className="h-1 bg-white/20 rounded overflow-hidden">
                  <div className={`h-full ${getRiskColor(selectedToken.factors.supplyRisk)}`} style={{ width: `${selectedToken.factors.supplyRisk}%` }}></div>
                </div>
              </div>

              <div className="border border-white/10 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60 font-mono text-[10px] tracking-wider">WHALE CONCENTRATION</span>
                  <span className="text-white font-mono text-sm font-bold">{Math.round(selectedToken.factors.whaleConcentration)}</span>
                </div>
                <div className="h-1 bg-white/20 rounded overflow-hidden">
                  <div className={`h-full ${getRiskColor(selectedToken.factors.whaleConcentration)}`} style={{ width: `${selectedToken.factors.whaleConcentration}%` }}></div>
                </div>
              </div>

              <div className="border border-white/10 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60 font-mono text-[10px] tracking-wider">LIQUIDITY DEPTH</span>
                  <span className="text-white font-mono text-sm font-bold">{Math.round(selectedToken.factors.liquidityDepth)}</span>
                </div>
                <div className="h-1 bg-white/20 rounded overflow-hidden">
                  <div className={`h-full ${getRiskColor(selectedToken.factors.liquidityDepth)}`} style={{ width: `${selectedToken.factors.liquidityDepth}%` }}></div>
                </div>
              </div>

              <div className="border border-white/10 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60 font-mono text-[10px] tracking-wider">MARKET ACTIVITY</span>
                  <span className="text-white font-mono text-sm font-bold">{Math.round(selectedToken.factors.marketActivity)}</span>
                </div>
                <div className="h-1 bg-white/20 rounded overflow-hidden">
                  <div className={`h-full ${getRiskColor(selectedToken.factors.marketActivity)}`} style={{ width: `${selectedToken.factors.marketActivity}%` }}></div>
                </div>
              </div>

              <div className="border border-white/10 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60 font-mono text-[10px] tracking-wider">BURN MECHANICS</span>
                  <span className="text-white font-mono text-sm font-bold">{selectedToken.factors.burnMechanics}</span>
                </div>
                <div className="h-1 bg-white/20 rounded overflow-hidden">
                  <div className={`h-full ${getRiskColor(selectedToken.factors.burnMechanics)}`} style={{ width: `${selectedToken.factors.burnMechanics}%` }}></div>
                </div>
              </div>

              <div className="border border-white/10 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60 font-mono text-[10px] tracking-wider">TOKEN AGE</span>
                  <span className="text-white font-mono text-sm font-bold">{selectedToken.factors.tokenAge}</span>
                </div>
                <div className="h-1 bg-white/20 rounded overflow-hidden">
                  <div className={`h-full ${getRiskColor(selectedToken.factors.tokenAge)}`} style={{ width: `${selectedToken.factors.tokenAge}%` }}></div>
                </div>
              </div>
            </div>

            {/* Red Flags */}
            {selectedToken.redFlags.length > 0 && (
              <div className="border border-red-500/30 bg-red-500/5 p-6 mb-6">
                <h3 className="text-red-400 font-mono text-lg font-bold tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  RED FLAGS
                </h3>
                <div className="space-y-3">
                  {selectedToken.redFlags.map((flag: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 text-white/90 font-mono text-sm">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Positive Signals */}
            {selectedToken.positiveSignals.length > 0 && (
              <div className="border border-green-500/30 bg-green-500/5 p-6 mb-6">
                <h3 className="text-green-400 font-mono text-lg font-bold tracking-wider mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  POSITIVE SIGNALS
                </h3>
                <div className="space-y-3">
                  {selectedToken.positiveSignals.map((signal: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 text-white/90 font-mono text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON Data */}
            <div className="border border-white/20 bg-black/60">
              <button
                onClick={() => setShowRawData(!showRawData)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <span className="text-white font-mono text-sm tracking-wider">RAW JSON DATA</span>
                {showRawData ? (
                  <ChevronUp className="w-4 h-4 text-white" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white" />
                )}
              </button>
              {showRawData && (
                <div className="p-4 border-t border-white/20 bg-black/80">
                  <pre className="text-white/80 font-mono text-[10px] overflow-x-auto">
                    {JSON.stringify(selectedToken.rawData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Weekly Usage Chart */}
          <div className="border border-white/20 bg-black/60 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-mono text-sm tracking-wider">WEEKLY USAGE</h3>
              <TrendingUp className="w-4 h-4 text-white/40" />
            </div>
            
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={getWeeklyUsageData()}>
                <defs>
                  <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis 
                  dataKey="day" 
                  stroke="#ffffff60"
                  style={{ fontSize: '10px', fontFamily: 'monospace' }}
                />
                <YAxis 
                  stroke="#ffffff60"
                  style={{ fontSize: '10px', fontFamily: 'monospace' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#000', 
                    border: '1px solid #ffffff40',
                    fontFamily: 'monospace',
                    fontSize: '10px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="scans" 
                  stroke="#ffffff" 
                  strokeWidth={2}
                  fill="url(#scanGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Analysis Chart */}
          <div className="border border-white/20 bg-black/60 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-white font-mono text-sm tracking-wider">RECENT SCANS</h3>
                {stats?.recentScans && stats.recentScans.length > 0 && !selectedToken && (
                  <button
                    onClick={() => setShowPreviousScans(true)}
                    className="px-3 py-1 border border-white/30 text-white hover:bg-white hover:text-black transition-all font-mono text-[10px] uppercase tracking-wider"
                  >
                    VIEW LATEST
                  </button>
                )}
              </div>
              <Clock className="w-4 h-4 text-white/40" />
            </div>
            
            {stats?.recentScans && stats.recentScans.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.recentScans.slice(0, 5).map(scan => ({
                  name: scan.tokenSymbol,
                  risk: scan.results.overall_risk_score
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#ffffff60"
                    style={{ fontSize: '10px', fontFamily: 'monospace' }}
                  />
                  <YAxis 
                    stroke="#ffffff60"
                    style={{ fontSize: '10px', fontFamily: 'monospace' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#000', 
                      border: '1px solid #ffffff40',
                      fontFamily: 'monospace',
                      fontSize: '10px'
                    }}
                  />
                  <Bar dataKey="risk" fill="#ffffff" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-white/40 font-mono text-xs">NO SCANS YET</p>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Watchlist Section */}
        {watchlist.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-white"></div>
              <h2 className="text-white font-mono text-lg tracking-wider">YOUR WATCHLIST</h2>
              <div className="flex-1 h-px bg-white"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {watchlist.map((token) => (
                <div 
                  key={token.address}
                  className="border border-white/30 bg-black/60 p-6 hover:border-white/50 transition-all cursor-pointer"
                  onClick={() => {
                    // Load this watchlist token into the scanner view
                    setSelectedToken({
                      name: token.name,
                      symbol: token.symbol,
                      address: token.address,
                      chain: token.chainId,
                      marketCap: formatMarketCap(token.marketData.marketCap),
                      price: token.marketData.price,
                      age: 'N/A',
                      overallRisk: token.latestAnalysis.riskScore,
                      confidence: 85,
                      lastUpdated: new Date(token.latestAnalysis.analyzedAt).toLocaleDateString(),
                      factors: {
                        contractSecurity: token.latestAnalysis.breakdown.contractControl,
                        supplyRisk: token.latestAnalysis.breakdown.supplyDilution,
                        whaleConcentration: token.latestAnalysis.breakdown.holderConcentration,
                        liquidityDepth: token.latestAnalysis.breakdown.liquidityDepth,
                        marketActivity: token.latestAnalysis.breakdown.adoption,
                        burnMechanics: token.latestAnalysis.breakdown.burnDeflation,
                        tokenAge: token.latestAnalysis.breakdown.auditTransparency
                      },
                      redFlags: [],
                      positiveSignals: [],
                      criticalFlags: [],
                      rawData: null
                    })
                    
                    // Scroll to results
                    setTimeout(() => {
                      const resultsElement = document.getElementById('scan-results')
                      if (resultsElement) {
                        resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }, 100)
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-mono text-lg font-bold">{token.symbol}</h3>
                        <span className={`
                          px-2 py-0.5 text-[10px] font-mono tracking-wider
                          ${token.latestAnalysis.riskLevel === 'LOW' ? 'bg-green-500/20 text-green-400 border border-green-500/40' :
                            token.latestAnalysis.riskLevel === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                            token.latestAnalysis.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                            'bg-red-500/20 text-red-400 border border-red-500/40'}
                        `}>
                          {token.latestAnalysis.riskLevel}
                        </span>
                      </div>
                      <p className="text-white/60 font-mono text-xs">{token.name}</p>
                      <p className="text-white/40 font-mono text-[10px] mt-1">
                        {token.address.substring(0, 8)}...{token.address.substring(token.address.length - 6)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (user) {
                          removeFromWatchlist(user.uid, token.address)
                            .then(() => {
                              const updatedList = watchlist.filter(t => t.address !== token.address)
                              setWatchlist(updatedList)
                              loadDashboardData()
                            })
                        }
                      }}
                      className="p-2 hover:bg-red-500/20 border border-white/20 hover:border-red-500/40 transition-all"
                    >
                      <XCircle className="w-4 h-4 text-white/60 hover:text-red-400" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-white/40 font-mono text-[10px] mb-1">RISK SCORE</p>
                      <p className="text-white font-mono text-xl font-bold">{token.latestAnalysis.riskScore}</p>
                    </div>
                    <div>
                      <p className="text-white/40 font-mono text-[10px] mb-1">PRICE</p>
                      <p className="text-white font-mono text-sm">
                        {token.marketData.price > 0 
                          ? `$${token.marketData.price < 1 ? token.marketData.price.toFixed(6) : token.marketData.price.toFixed(2)}`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40 font-mono text-[10px] mb-1">MARKET CAP</p>
                      <p className="text-white font-mono text-sm">{formatMarketCap(token.marketData.marketCap)}</p>
                    </div>
                  </div>

                  <div className="w-full h-px bg-white/20 mb-3"></div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                    <span>LAST ANALYZED: {new Date(token.lastUpdatedAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {token.chainId}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Progress Bar */}
        <div className="border border-white/20 bg-black/60 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-mono text-sm tracking-wider mb-1">DAILY LIMIT</h3>
              <p className="text-white/60 font-mono text-xs">
                {stats?.tokensAnalyzed || 0} OF 10 SCANS USED
              </p>
            </div>
            <span className="text-white font-mono text-lg">{usagePercent.toFixed(0)}%</span>
          </div>
          
          <div className="h-2 bg-black border border-white/20">
            <div 
              className={`h-full transition-all duration-300 ${
                usagePercent >= 90 ? 'bg-red-500' : 
                usagePercent >= 70 ? 'bg-yellow-500' : 
                'bg-white'
              }`}
              style={{ width: `${usagePercent}%` }}
            ></div>
          </div>
        </div>

        {/* Upgrade Banner */}
        <div className="border-2 border-white/40 bg-black/80 p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Crown className="w-6 h-6 text-white" />
                <h3 className="text-xl font-bold text-white font-mono tracking-wider">
                  UNLOCK PREMIUM FEATURES
                </h3>
              </div>
              <ul className="space-y-2 mb-4 lg:mb-0">
                {[
                  'UNLIMITED TOKEN SCANS',
                  'ADVANCED RISK ANALYTICS',
                  'REAL-TIME ALERTS',
                  'PORTFOLIO TRACKING',
                  'PRIORITY SUPPORT'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/80 font-mono text-xs">
                    <CheckCircle className="w-3 h-3" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <Link href="/pricing">
              <button className="px-8 py-4 bg-white text-black font-mono text-sm hover:bg-black hover:text-white border-2 border-white transition-all duration-200">
                UPGRADE NOW
                <ArrowRight className="inline w-4 h-4 ml-2" />
              </button>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/scan">
            <div className="border border-white/20 bg-black/60 p-6 hover:border-white hover:bg-white/5 transition-all cursor-pointer group">
              <Zap className="w-8 h-8 text-white mb-3 group-hover:animate-pulse" />
              <h4 className="text-white font-mono text-sm mb-2 tracking-wider">SCAN TOKEN</h4>
              <p className="text-white/60 font-mono text-xs">
                ANALYZE NEW TOKEN SECURITY
              </p>
            </div>
          </Link>

          <Link href="/watchlist">
            <div className="border border-white/20 bg-black/60 p-6 hover:border-white hover:bg-white/5 transition-all cursor-pointer group">
              <Target className="w-8 h-8 text-white mb-3" />
              <h4 className="text-white font-mono text-sm mb-2 tracking-wider">WATCHLIST</h4>
              <p className="text-white/60 font-mono text-xs">
                MONITOR SAVED TOKENS
              </p>
            </div>
          </Link>

          <Link href="/pricing">
            <div className="border border-white/20 bg-black/60 p-6 hover:border-white hover:bg-white/5 transition-all cursor-pointer group">
              <Crown className="w-8 h-8 text-white mb-3" />
              <h4 className="text-white font-mono text-sm mb-2 tracking-wider">UPGRADE</h4>
              <p className="text-white/60 font-mono text-xs">
                UNLOCK ALL FEATURES
              </p>
            </div>
          </Link>
        </div>

      </main>
    </div>
  )
}
