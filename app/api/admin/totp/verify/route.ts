/**
 * Admin TOTP Verify API
 * Verifies the TOTP code and enables 2FA for admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'
import { verifyTOTPToken } from '@/lib/totp'

const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

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

    const body = await request.json()
    const { secret, token: totpToken } = body

    if (!secret || !totpToken) {
      return NextResponse.json({ error: 'Secret and token required' }, { status: 400 })
    }

    // Verify the TOTP token
    const isValid = verifyTOTPToken(secret, totpToken)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    // Enable TOTP for the admin user
    await adminDb.collection('users').doc(userId).update({
      totpSecret: secret,
      totpEnabled: true,
      totpSecretPending: require('firebase-admin').firestore.FieldValue.delete(),
      totpEnabledAt: require('firebase-admin').firestore.FieldValue.serverTimestamp()
    })

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully'
    })

  } catch (error: any) {
    console.error('Error verifying TOTP:', error)
    return NextResponse.json({ 
      error: 'Failed to verify TOTP',
      details: error.message 
    }, { status: 500 })
  }
}
