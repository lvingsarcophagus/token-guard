/**
 * Tokenomics Cache Service
 * 
 * Caches token data in Firestore to reduce API calls and improve performance
 * Implements TTL (Time To Live) for cache invalidation
 */

import { getAdminDb } from './firebase-admin'
import type { RiskResult } from './types/token-data'

export interface CachedTokenData {
  address: string
  name: string
  symbol: string
  priceData?: {
    price: number
    marketCap: number
    volume24h: number
    priceChange24h: number
    liquidity?: number
    circulatingSupply?: number
    totalSupply?: number
  }
  securityData?: {
    riskScore: number
    riskLevel: string
    issues: string[]
    isHoneypot: boolean
  }
  tokenomics?: {
    holderCount: number
    topHoldersPercentage: number
    burnMechanism: boolean
    maxSupply?: number
  }
  aiSummary?: RiskResult['ai_summary']
  lastUpdated: string
  queryCount: number
  chainId: string
}

const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Get cached token data
 */
export async function getCachedTokenData(
  address: string
): Promise<CachedTokenData | null> {
  try {
    const db = getAdminDb()
    const cacheDoc = await db.collection('tokenCache').doc(address.toLowerCase()).get()

    if (!cacheDoc.exists) {
      return null
    }

    const data = cacheDoc.data() as CachedTokenData
    const lastUpdated = new Date(data.lastUpdated).getTime()
    const now = Date.now()

    // Check if cache is expired
    if (now - lastUpdated > CACHE_TTL_MS) {
      console.log(`Cache expired for ${address}`)
      return null
    }

    console.log(`✅ Cache hit for ${address}`)
    
    // Increment query count
    await db.collection('tokenCache').doc(address.toLowerCase()).update({
      queryCount: (data.queryCount || 0) + 1,
    })

    return data
  } catch (error) {
    console.error('Get cache error:', error)
    return null
  }
}

/**
 * Set cached token data
 */
export async function setCachedTokenData(
  address: string,
  data: Partial<CachedTokenData>
): Promise<void> {
  try {
    const db = getAdminDb()
    const cacheRef = db.collection('tokenCache').doc(address.toLowerCase())

    const existingDoc = await cacheRef.get()
    const existingData = existingDoc.exists ? existingDoc.data() : {}

    const cacheData: CachedTokenData = {
      address: address.toLowerCase(),
      name: data.name || existingData?.name || 'Unknown',
      symbol: data.symbol || existingData?.symbol || 'N/A',
      priceData: data.priceData || existingData?.priceData,
      securityData: data.securityData || existingData?.securityData,
      tokenomics: data.tokenomics || existingData?.tokenomics,
      chainId: data.chainId || existingData?.chainId || '1',
      lastUpdated: new Date().toISOString(),
      queryCount: (existingData?.queryCount || 0) + 1,
    }

    await cacheRef.set(cacheData, { merge: true })
    console.log(`✅ Cached data for ${address}`)
  } catch (error) {
    console.error('Set cache error:', error)
    // Don't throw - caching is optional
  }
}

/**
 * Update cache statistics
 */
export async function updateCacheStats(
  address: string,
  updates: Partial<CachedTokenData>
): Promise<void> {
  try {
    const db = getAdminDb()
    await db.collection('tokenCache').doc(address.toLowerCase()).update({
      ...updates,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Update cache stats error:', error)
  }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    const db = getAdminDb()
    const snapshot = await db.collection('tokenCache').get()
    const now = Date.now()
    let deleted = 0

    const batch = db.batch()

    snapshot.docs.forEach(doc => {
      const data = doc.data()
      const lastUpdated = new Date(data.lastUpdated).getTime()

      if (now - lastUpdated > CACHE_TTL_MS) {
        batch.delete(doc.ref)
        deleted++
      }
    })

    if (deleted > 0) {
      await batch.commit()
      console.log(`✅ Cleared ${deleted} expired cache entries`)
    }

    return deleted
  } catch (error) {
    console.error('Clear expired cache error:', error)
    return 0
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStatistics() {
  try {
    const db = getAdminDb()
    const snapshot = await db.collection('tokenCache').get()

    const totalEntries = snapshot.size
    const totalQueries = snapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().queryCount || 0)
    }, 0)

    const now = Date.now()
    const validEntries = snapshot.docs.filter(doc => {
      const lastUpdated = new Date(doc.data().lastUpdated).getTime()
      return now - lastUpdated <= CACHE_TTL_MS
    }).length

    return {
      totalEntries,
      validEntries,
      expiredEntries: totalEntries - validEntries,
      totalQueries,
      cacheHitRate: totalQueries > 0 ? (validEntries / totalEntries) * 100 : 0,
    }
  } catch (error) {
    console.error('Get cache statistics error:', error)
    return {
      totalEntries: 0,
      validEntries: 0,
      expiredEntries: 0,
      totalQueries: 0,
      cacheHitRate: 0,
    }
  }
}
