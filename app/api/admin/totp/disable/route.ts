import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Check if user is admin
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Delete TOTP secret
    await adminDb.collection('totp_secrets').doc(userId).delete()

    // Update user document
    await adminDb.collection('users').doc(userId).update({
      '2faEnabled': false,
      'totpEnabled': false,
      'updatedAt': new Date().toISOString()
    })

    console.log(`[Admin] 2FA disabled for user ${userId}`)

    return NextResponse.json({ 
      success: true,
      message: '2FA has been disabled successfully'
    })
  } catch (error) {
    console.error('[Admin] Disable 2FA error:', error)
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    )
  }
}
