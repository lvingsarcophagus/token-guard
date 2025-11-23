/**
 * Admin TOTP Setup API
 * Generates a new TOTP secret and QR code for admin 2FA
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'
import { generateTOTPSecret, generateQRCode } from '@/lib/totp'

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

    // Generate TOTP secret
    const secret = generateTOTPSecret()
    
    // Get user email for QR code
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()
    const email = userData?.email || 'admin@tokenomics-lab.com'
    
    // Generate QR code
    const qrCode = await generateQRCode(secret, email, 'Tokenomics Lab Admin')

    // Store temporary secret (not enabled yet)
    await adminDb.collection('users').doc(userId).update({
      totpSecretPending: secret,
      totpSetupAt: require('firebase-admin').firestore.FieldValue.serverTimestamp()
    })

    return NextResponse.json({
      success: true,
      secret,
      qrCode
    })

  } catch (error: any) {
    console.error('Error setting up TOTP:', error)
    return NextResponse.json({ 
      error: 'Failed to setup TOTP',
      details: error.message 
    }, { status: 500 })
  }
}
