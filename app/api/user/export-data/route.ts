import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'
import { auth } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    // Try to get token from Authorization header first
    let token = request.headers.get('Authorization')?.split('Bearer ')[1]
    
    // If no token in header, try to get from client-side auth
    if (!token) {
      // For client-side requests, we need to get the token differently
      const body = await request.json().catch(() => ({}))
      token = body.token
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    
    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(token)
    } catch (verifyError) {
      console.error('[Export] Token verification failed:', verifyError)
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
    
    const userId = decodedToken.uid

    console.log(`[Export] Exporting data for user: ${userId}`)

    // Get user profile
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const userData = userDoc.exists ? userDoc.data() : null

    // Get watchlist
    const watchlistSnapshot = await adminDb.collection('watchlist').doc(userId).collection('tokens').get()
    const watchlist = watchlistSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Get analysis history
    const historySnapshot = await adminDb.collection('analysis_history').doc(userId).collection('scans').get()
    const analysisHistory = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Get alerts
    const alertsSnapshot = await adminDb.collection('alerts').doc(userId).collection('notifications').get()
    const alerts = alertsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Get portfolio (if exists)
    const portfolioDoc = await adminDb.collection('portfolio').doc(userId).get()
    const portfolio = portfolioDoc.exists ? portfolioDoc.data() : null

    // Compile all data
    const exportData = {
      profile: userData,
      watchlist,
      analysisHistory,
      alerts,
      portfolio,
      exportedAt: new Date().toISOString(),
      userId
    }

    console.log(`[Export] Data exported successfully for user: ${userId}`)

    return NextResponse.json(exportData)
  } catch (error: any) {
    console.error('[Export] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to export data',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}
