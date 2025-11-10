// Firebase Analytics utility functions
import { analytics } from './firebase'
import { logEvent, setUserId, setUserProperties, type Analytics } from 'firebase/analytics'

/**
 * Track custom events in Firebase Analytics
 */
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (analytics && typeof window !== 'undefined') {
    try {
      logEvent(analytics, eventName, eventParams)
      console.log('[Analytics] Event tracked:', eventName, eventParams)
    } catch (error) {
      console.warn('[Analytics] Failed to track event:', error)
    }
  }
}

/**
 * Set user ID for analytics
 */
export const setAnalyticsUserId = (userId: string) => {
  if (analytics && typeof window !== 'undefined') {
    try {
      setUserId(analytics, userId)
      console.log('[Analytics] User ID set:', userId)
    } catch (error) {
      console.warn('[Analytics] Failed to set user ID:', error)
    }
  }
}

/**
 * Set user properties for analytics
 */
export const setAnalyticsUserProperties = (properties: Record<string, any>) => {
  if (analytics && typeof window !== 'undefined') {
    try {
      setUserProperties(analytics, properties)
      console.log('[Analytics] User properties set:', properties)
    } catch (error) {
      console.warn('[Analytics] Failed to set user properties:', error)
    }
  }
}

// Predefined event trackers
export const analyticsEvents = {
  // User events
  signup: (method: string) => trackEvent('sign_up', { method }),
  login: (method: string) => trackEvent('login', { method }),
  logout: () => trackEvent('logout'),
  
  // Token analysis events
  tokenSearch: (query: string, chainId: string) => trackEvent('token_search', { query, chain_id: chainId }),
  tokenAnalyze: (tokenAddress: string, chainId: string, riskScore: number) => 
    trackEvent('token_analyze', { token_address: tokenAddress, chain_id: chainId, risk_score: riskScore }),
  
  // Watchlist events
  addToWatchlist: (tokenAddress: string, tokenSymbol: string) => 
    trackEvent('add_to_watchlist', { token_address: tokenAddress, token_symbol: tokenSymbol }),
  removeFromWatchlist: (tokenAddress: string) => 
    trackEvent('remove_from_watchlist', { token_address: tokenAddress }),
  
  // Premium events
  viewPricing: () => trackEvent('view_pricing'),
  upgradeToPremium: (plan: string) => trackEvent('upgrade_to_premium', { plan }),
  cancelSubscription: () => trackEvent('cancel_subscription'),
  
  // Chart events
  viewChart: (chartType: string, tokenAddress: string) => 
    trackEvent('view_chart', { chart_type: chartType, token_address: tokenAddress }),
  changeTimeframe: (timeframe: string) => trackEvent('change_timeframe', { timeframe }),
  
  // Error events
  apiError: (apiName: string, errorMessage: string) => 
    trackEvent('api_error', { api_name: apiName, error_message: errorMessage }),
  analysisError: (tokenAddress: string, errorMessage: string) => 
    trackEvent('analysis_error', { token_address: tokenAddress, error_message: errorMessage }),
}

/**
 * Track page views (call this in layout or page components)
 */
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (analytics && typeof window !== 'undefined') {
    trackEvent('page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title
    })
  }
}

/**
 * Initialize user tracking on login
 */
export const initializeUserTracking = (userId: string, userData: {
  email?: string
  plan?: string
  tier?: string
  createdAt?: string
}) => {
  setAnalyticsUserId(userId)
  setAnalyticsUserProperties({
    user_plan: userData.plan || userData.tier || 'FREE',
    user_email: userData.email,
    account_created: userData.createdAt
  })
}

/**
 * Clear user tracking on logout
 */
export const clearUserTracking = () => {
  if (analytics && typeof window !== 'undefined') {
    try {
      setUserId(analytics, '')
      console.log('[Analytics] User tracking cleared')
    } catch (error) {
      console.warn('[Analytics] Failed to clear user tracking:', error)
    }
  }
}
