/**
 * Admin API: Smart Alerts Settings
 * Enable/disable the Smart Alerts system
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function GET(request: NextRequest) {
  try {
    // Verify admin auth
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const auth = getAdminAuth()
    const decodedToken = await auth.verifyIdToken(token)

    // Check if user is admin
    const db = getAdminDb()
    const userDoc = await db.collection('users').doc(decodedToken.uid).get()
    const userData = userDoc.data()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get Smart Alerts settings
    const settingsDoc = await db.collection('admin_settings').doc('smart_alerts').get()
    const settings = settingsDoc.data() || {
      enabled: false,
      scanIntervalHours: 1,
      lastRun: null,
      totalScans: 0,
      totalAlerts: 0
    }

    return NextResponse.json({
      success: true,
      settings
    })

  } catch (error: any) {
    console.error('[Admin Smart Alerts] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to get settings', message: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin auth
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const auth = getAdminAuth()
    const decodedToken = await auth.verifyIdToken(token)

    // Check if user is admin
    const db = getAdminDb()
    const userDoc = await db.collection('users').doc(decodedToken.uid).get()
    const userData = userDoc.data()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { enabled, scanIntervalHours } = body

    // Update settings
    await db.collection('admin_settings').doc('smart_alerts').set({
      enabled: enabled ?? false,
      scanIntervalHours: scanIntervalHours || 1,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: decodedToken.uid
    }, { merge: true })

    console.log(`[Admin Smart Alerts] Updated: enabled=${enabled}, interval=${scanIntervalHours}h`)

    return NextResponse.json({
      success: true,
      message: `Smart Alerts ${enabled ? 'enabled' : 'disabled'}`
    })

  } catch (error: any) {
    console.error('[Admin Smart Alerts] POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings', message: error?.message },
      { status: 500 }
    )
  }
}
