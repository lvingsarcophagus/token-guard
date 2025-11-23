/**
 * Firestore Database Schema
 * Collections and Document Structure
 */

// ==================== COLLECTIONS ====================

/**
 * users/{userId}
 * User profile and subscription data
 */
export interface UserDocument {
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null
  name?: string
  company?: string
  country?: string
  walletAddress?: string
  role?: 'user' | 'admin'
  plan: 'FREE' | 'PREMIUM'
  
  // Subscription details
  subscription: {
    status: 'active' | 'canceled' | 'expired' | 'trial'
    startDate: Date
    endDate: Date | null
    autoRenew: boolean
  }
  
  // Usage tracking
  usage: {
    tokensAnalyzed: number
    lastResetDate: Date
    dailyLimit: number // 10 for FREE, unlimited (-1) for PREMIUM
  }
  
  // Preferences
  preferences: {
    notifications: boolean
    emailAlerts: boolean
    theme: 'light' | 'dark' | 'system'
  }
  
  // Metadata
  createdAt: Date
  lastLoginAt: Date
}

/**
 * watchlist/{userId}/tokens/{tokenAddress}
 * User's token watchlist
 */
export interface WatchlistToken {
  address: string
  name: string
  symbol: string
  chainId: string
  
  // Latest analysis data
  latestAnalysis: {
    riskScore: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    analyzedAt: Date
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
  }
  
  // Market data
  marketData: {
    price: number
    priceChange24h: number
    marketCap: number
    volume24h: number
    liquidity: number
  }
  
  // User settings
  alertsEnabled: boolean
  alertThreshold: number // Alert if risk score increases by this amount
  notes: string
  tags: string[]
  
  addedAt: Date
  lastUpdatedAt: Date
}

/**
 * alerts/{userId}/notifications/{alertId}
 * Risk alerts for premium users
 */
export interface AlertDocument {
  id: string
  tokenAddress: string
  tokenName: string
  tokenSymbol: string
  
  type: 'risk_increase' | 'honeypot_detected' | 'liquidity_drop' | 'whale_movement' | 'contract_change'
  severity: 'critical' | 'high' | 'medium' | 'low'
  
  message: string
  details: {
    oldValue?: number
    newValue?: number
    threshold?: number
    change?: number
  }
  
  read: boolean
  dismissed: boolean
  
  createdAt: Date
  expiresAt: Date | null
}

/**
 * analysis_history/{userId}/scans/{scanId}
 * Historical token analysis data
 */
export interface AnalysisHistoryDocument {
  id: string
  tokenAddress: string
  tokenName: string
  tokenSymbol: string
  chainId: string
  
  // Analysis results
  results: {
    overall_risk_score: number
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    confidence_score: number
    breakdown: Record<string, number>
    critical_flags?: string[]
    upcoming_risks?: {
      next_30_days: number
      forecast: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
    }
  }
  
  // Market snapshot
  marketSnapshot: {
    price: number
    marketCap: number
    volume24h: number
    liquidity: number
  }
  
  plan: 'FREE' | 'PREMIUM'
  analyzedAt: Date
}

/**
 * portfolio/{userId}
 * Portfolio tracking for premium users
 */
export interface PortfolioDocument {
  userId: string
  
  // Portfolio summary
  summary: {
    totalValue: number
    totalTokens: number
    avgRiskScore: number
    highRiskTokens: number
    profitLoss24h: number
    profitLossPercentage: number
  }
  
  // Historical data points for charts
  history: Array<{
    date: Date
    totalValue: number
    riskScore: number
  }>
  
  lastUpdatedAt: Date
}

/**
 * settings/{userId}
 * User settings and preferences
 */
export interface SettingsDocument {
  userId: string
  
  // Alert settings
  alerts: {
    enabled: boolean
    emailNotifications: boolean
    pushNotifications: boolean
    riskThreshold: number
    frequency: 'realtime' | 'hourly' | 'daily'
  }
  
  // Display settings
  display: {
    chartType: 'line' | 'area' | 'bar'
    defaultTimeframe: '24h' | '7d' | '30d' | '90d'
    showBreakdown: boolean
  }
  
  // API settings (premium only)
  api: {
    enabled: boolean
    key: string | null
    rateLimit: number
    lastResetAt: Date
  }
  
  updatedAt: Date
}

// ==================== HELPER TYPES ====================

export interface DashboardStats {
  // Overview stats
  tokensAnalyzed: number
  watchlistCount: number
  activeAlerts: number
  avgRiskScore: number
  
  // Recent activity
  recentScans: AnalysisHistoryDocument[]
  recentAlerts: AlertDocument[]
  
  // Portfolio (premium only)
  portfolioValue?: number
  profitLoss24h?: number
}

export interface ChartDataPoint {
  date: string
  value: number
  riskScore?: number
}

// ==================== FIRESTORE PATHS ====================

export const COLLECTIONS = {
  USERS: 'users',
  WATCHLIST: (userId: string) => `watchlist/${userId}/tokens`,
  ALERTS: (userId: string) => `alerts/${userId}/notifications`,
  ANALYSIS_HISTORY: (userId: string) => `analysis_history/${userId}/scans`,
  PORTFOLIO: 'portfolio',
  SETTINGS: 'settings',
} as const

// ==================== INDEXES REQUIRED ====================

/**
 * Required Firestore Indexes:
 * 
 * 1. watchlist/{userId}/tokens
 *    - Fields: lastUpdatedAt (desc), addedAt (desc)
 * 
 * 2. alerts/{userId}/notifications
 *    - Fields: read (asc), severity (desc), createdAt (desc)
 * 
 * 3. analysis_history/{userId}/scans
 *    - Fields: analyzedAt (desc)
 * 
 * 4. users
 *    - Fields: plan (asc), createdAt (desc)
 */
