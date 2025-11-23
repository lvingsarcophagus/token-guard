/**
 * Admin TOTP Status API
 * Checks if admin has 2FA enabled
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'

const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

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

    let userId: string
    if (!isDev && token) {
      const decodedToken = await adminAuth.verifyIdToken(token)
      const customClaims = decodedToken as any
      
      if (!customClaims.admin && customClaims.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
      userId = decodedToken.uid
    } else {
      userId = 'dev-admin'
    }

    // Check if admin has TOTP enabled
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    
    const enabled = userData?.totpEnabled === true && !!userData?.totpSecret

    return NextResponse.json({
      success: true,
      enabled
    })

  } catch (error: any) {
    console.error('Error checking TOTP status:', error)
    return NextResponse.json({ 
      error: 'Failed to check TOTP status',
      details: error.message 
    }, { status: 500 })
  }
}
