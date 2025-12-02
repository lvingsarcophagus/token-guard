/**
 * Cron Job: Check Smart Alerts
 * Runs hourly to scan watchlist tokens for Premium users
 * Triggers: Risk increases, critical flags, liquidity drops, holder concentration changes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Smart Alerts] Starting hourly check...')

    const db = getAdminDb()

    // Check if Smart Alerts are enabled
    const settingsDoc = await db.collection('admin_settings').doc('smart_alerts').get()
    const settings = settingsDoc.data()
    
    if (!settings?.enabled) {
      console.log('[Smart Alerts] System disabled by admin')
      return NextResponse.json({ 
        success: true, 
        message: 'Smart Alerts disabled',
        checked: 0 
      })
    }

    // Get all Premium users
    const usersSnapshot = await db.collection('users')
      .where('tier', '==', 'PREMIUM')
      .get()

    let totalChecked = 0
    let alertsTriggered = 0

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id
      const userEmail = userDoc.data().email

      // Get user's watchlist
      const watchlistSnapshot = await db.collection('watchlist')
        .doc(userId)
        .collection('tokens')
        .where('alertEnabled', '==', true)
        .get()

      for (const tokenDoc of watchlistSnapshot.docs) {
        const tokenData = tokenDoc.data()
        const tokenAddress = tokenData.address
        const lastRiskScore = tokenData.lastRiskScore || 0
        const lastLiquidity = tokenData.lastLiquidity || 0
        const lastHolderConcentration = tokenData.lastHolderConcentration || 0
        const lastCriticalFlags = tokenData.lastCriticalFlags || []

        try {
          // Scan token (call analyze-token endpoint)
          const scanResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analyze-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokenAddress,
              chainId: tokenData.chainId,
              plan: 'PREMIUM'
            })
          })

          if (!scanResponse.ok) {
            console.error(`[Smart Alerts] Failed to scan ${tokenAddress}`)
            continue
          }

          const scanResult = await scanResponse.json()
          const newRiskScore = scanResult.results.overall_risk_score
          const newLiquidity = scanResult.data.liquidityUSD || 0
          const newHolderConcentration = scanResult.data.top10HoldersPct || 0
          const newCriticalFlags = scanResult.results.critical_flags || []

          totalChecked++

          // Check alert conditions
          const alerts: string[] = []

          // 1. Risk score increased significantly (>15 points)
          if (newRiskScore - lastRiskScore > 15) {
            alerts.push(`Risk score increased from ${lastRiskScore} to ${newRiskScore} (+${newRiskScore - lastRiskScore} points)`)
          }

          // 2. New critical flags detected
          const newFlags = newCriticalFlags.filter((flag: string) => !lastCriticalFlags.includes(flag))
          if (newFlags.length > 0) {
            alerts.push(`New critical flags: ${newFlags.join(', ')}`)
          }

          // 3. Liquidity dropped >30%
          if (lastLiquidity > 0 && newLiquidity < lastLiquidity * 0.7) {
            const dropPercent = ((lastLiquidity - newLiquidity) / lastLiquidity * 100).toFixed(1)
            alerts.push(`Liquidity dropped ${dropPercent}% (from $${lastLiquidity.toFixed(0)} to $${newLiquidity.toFixed(0)})`)
          }

          // 4. Holder concentration increased >10%
          if (newHolderConcentration - lastHolderConcentration > 0.1) {
            const increasePercent = ((newHolderConcentration - lastHolderConcentration) * 100).toFixed(1)
            alerts.push(`Top 10 holder concentration increased by ${increasePercent}%`)
          }

          // If any alerts triggered, create notification
          if (alerts.length > 0) {
            await db.collection('alerts')
              .doc(userId)
              .collection('notifications')
              .add({
                tokenAddress,
                tokenSymbol: tokenData.symbol,
                tokenName: tokenData.name,
                type: 'RISK_CHANGE',
                alerts,
                oldRiskScore: lastRiskScore,
                newRiskScore,
                message: `⚠️ Alert for ${tokenData.symbol}: ${alerts.join(' | ')}`,
                read: false,
                createdAt: FieldValue.serverTimestamp()
              })

            alertsTriggered++
            console.log(`[Smart Alerts] Alert triggered for ${tokenData.symbol} (user: ${userEmail})`)
          }

          // Update watchlist with latest data
          await db.collection('watchlist')
            .doc(userId)
            .collection('tokens')
            .doc(tokenDoc.id)
            .update({
              lastRiskScore: newRiskScore,
              lastLiquidity: newLiquidity,
              lastHolderConcentration: newHolderConcentration,
              lastCriticalFlags: newCriticalFlags,
              lastChecked: FieldValue.serverTimestamp()
            })

        } catch (error) {
          console.error(`[Smart Alerts] Error checking ${tokenAddress}:`, error)
        }
      }
    }

    console.log(`[Smart Alerts] Completed: ${totalChecked} tokens checked, ${alertsTriggered} alerts triggered`)

    return NextResponse.json({
      success: true,
      checked: totalChecked,
      alertsTriggered,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('[Smart Alerts] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check alerts' },
      { status: 500 }
    )
  }
}
