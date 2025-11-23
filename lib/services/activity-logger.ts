/**
 * Activity Logger Service
 * Logs user activities to Firestore for admin monitoring
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface ActivityLog {
  userId: string
  userEmail: string
  action: string
  details: string
  metadata?: Record<string, any>
  timestamp: any
  ipAddress?: string
  userAgent?: string
}

export type ActivityAction =
  | 'user_login'
  | 'user_logout'
  | 'user_signup'
  | 'token_scan'
  | 'watchlist_add'
  | 'watchlist_remove'
  | 'tier_upgrade'
  | 'tier_downgrade'
  | 'profile_update'
  | 'settings_change'
  | 'export_data'
  | 'delete_account'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'password_change'
  | 'api_call'

/**
 * Log a user activity
 */
export async function logActivity(
  userId: string,
  userEmail: string,
  action: ActivityAction,
  details: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const activityLog: ActivityLog = {
      userId,
      userEmail,
      action,
      details,
      metadata: metadata || {},
      timestamp: serverTimestamp(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
    }

    await addDoc(collection(db, 'activity_logs'), activityLog)
    console.log('[ActivityLogger] Logged:', action, 'for user:', userEmail)
  } catch (error) {
    console.error('[ActivityLogger] Failed to log activity:', error)
    // Don't throw - logging failures shouldn't break the app
  }
}

/**
 * Log token scan activity
 */
export async function logTokenScan(
  userId: string,
  userEmail: string,
  tokenAddress: string,
  chain: string,
  riskScore: number
): Promise<void> {
  await logActivity(
    userId,
    userEmail,
    'token_scan',
    `Scanned token ${tokenAddress.slice(0, 8)}... on ${chain}`,
    { tokenAddress, chain, riskScore }
  )
}

/**
 * Log user authentication
 */
export async function logAuth(
  userId: string,
  userEmail: string,
  action: 'user_login' | 'user_logout' | 'user_signup'
): Promise<void> {
  const details = action === 'user_login' 
    ? 'User logged in'
    : action === 'user_logout'
    ? 'User logged out'
    : 'New user signed up'
  
  await logActivity(userId, userEmail, action, details)
}

/**
 * Log tier changes
 */
export async function logTierChange(
  userId: string,
  userEmail: string,
  fromTier: string,
  toTier: string
): Promise<void> {
  const action = toTier === 'PREMIUM' ? 'tier_upgrade' : 'tier_downgrade'
  await logActivity(
    userId,
    userEmail,
    action,
    `Tier changed from ${fromTier} to ${toTier}`,
    { fromTier, toTier }
  )
}

/**
 * Log watchlist actions
 */
export async function logWatchlist(
  userId: string,
  userEmail: string,
  action: 'watchlist_add' | 'watchlist_remove',
  tokenAddress: string,
  tokenSymbol?: string
): Promise<void> {
  const details = action === 'watchlist_add'
    ? `Added ${tokenSymbol || tokenAddress.slice(0, 8)} to watchlist`
    : `Removed ${tokenSymbol || tokenAddress.slice(0, 8)} from watchlist`
  
  await logActivity(userId, userEmail, action, details, { tokenAddress, tokenSymbol })
}
