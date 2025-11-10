import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    const decodedToken = await adminAuth.verifyIdToken(token)
    
    // Check if user is admin
    const adminUserDoc = await adminDb.collection('users').doc(decodedToken.uid).get()
    const adminUserData = adminUserDoc.data()
    
    if (!adminUserData || (adminUserData.role !== 'ADMIN' && adminUserData.plan !== 'ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get user data from Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.data()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get watchlist count
    const watchlistSnapshot = await adminDb.collection('watchlist').doc(userId).collection('tokens').get()
    const watchlistCount = watchlistSnapshot.size

    // Get alerts count
    const alertsSnapshot = await adminDb.collection('alerts').doc(userId).collection('notifications').get()
    const activeAlertsCount = alertsSnapshot.docs.filter((doc: any) => !doc.data().dismissed).length

    // Get recent scans
    const recentScansSnapshot = await adminDb
      .collection('analysisHistory')
      .doc(userId)
      .collection('scans')
      .orderBy('scannedAt', 'desc')
      .limit(10)
      .get()
    
    const recentScans = recentScansSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))

    // Get Firebase Auth data
    let authData = null
    try {
      const userRecord = await adminAuth.getUser(userId)
      authData = {
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        providerData: userRecord.providerData.map((p: any) => ({
          providerId: p.providerId,
          uid: p.uid
        })),
        metadata: {
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime,
          lastRefreshTime: userRecord.metadata.lastRefreshTime
        }
      }
    } catch (error) {
      console.error('Failed to fetch auth data:', error)
    }

    return NextResponse.json({
      success: true,
      user: {
        ...userData,
        watchlistCount,
        activeAlertsCount,
        recentScans,
        authData
      }
    })
  } catch (error) {
    console.error('Get user details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}
