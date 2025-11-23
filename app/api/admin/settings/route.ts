/**
 * Admin Settings API
 * Handles: maintenance mode, TOTP configuration, system settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'

const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// GET: Fetch current settings
export async function GET(request: NextRequest) {
  try {
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()

    // Verify admin access
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token && !isDev) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isDev && token) {
      const decodedToken = await adminAuth.verifyIdToken(token)
      const customClaims = decodedToken as any
      
      if (!customClaims.admin && customClaims.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    // Get settings from Firestore
    const settingsDoc = await adminDb.collection('system_settings').doc('config').get()
    const settings = settingsDoc.exists ? settingsDoc.data() : {}

    return NextResponse.json({
      success: true,
      settings: {
        maintenanceMode: settings?.maintenanceMode || false,
        maintenanceMessage: settings?.maintenanceMessage || 'System is under maintenance. Please check back later.',
        totpEnabled: settings?.totpEnabled || false,
        totpRequired: settings?.totpRequired || false,
        freeTierLimit: settings?.freeTierLimit || 20,
        cacheExpiration: settings?.cacheExpiration || 24,
        ...settings
      }
    })

  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch settings',
      details: error.message 
    }, { status: 500 })
  }
}

// POST: Update settings
export async function POST(request: NextRequest) {
  try {
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()

    // Verify admin access
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token && !isDev) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let adminUser: any
    if (!isDev && token) {
      const decodedToken = await adminAuth.verifyIdToken(token)
      const customClaims = decodedToken as any
      
      if (!customClaims.admin && customClaims.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
      adminUser = await adminAuth.getUser(decodedToken.uid)
    }

    const body = await request.json()
    const { 
      maintenanceMode, 
      maintenanceMessage,
      totpEnabled,
      totpRequired,
      freeTierLimit,
      cacheExpiration
    } = body

    // Update settings in Firestore
    const updateData: any = {
      updatedAt: require('firebase-admin').firestore.FieldValue.serverTimestamp(),
      updatedBy: adminUser?.uid || 'admin'
    }

    if (maintenanceMode !== undefined) updateData.maintenanceMode = maintenanceMode
    if (maintenanceMessage !== undefined) updateData.maintenanceMessage = maintenanceMessage
    if (totpEnabled !== undefined) updateData.totpEnabled = totpEnabled
    if (totpRequired !== undefined) updateData.totpRequired = totpRequired
    if (freeTierLimit !== undefined) updateData.freeTierLimit = freeTierLimit
    if (cacheExpiration !== undefined) updateData.cacheExpiration = cacheExpiration

    await adminDb.collection('system_settings').doc('config').set(updateData, { merge: true })

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updateData
    })

  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ 
      error: 'Failed to update settings',
      details: error.message 
    }, { status: 500 })
  }
}
