import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
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

    // Check if user is admin
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get()
    const userData = userDoc.data()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    // Build query
    let query = adminDb.collection('activity_logs')
      .orderBy('timestamp', 'desc')

    if (userId) {
      query = query.where('userId', '==', userId) as any
    }

    if (action) {
      query = query.where('action', '==', action) as any
    }

    query = query.limit(limit) as any

    // Execute query
    const snapshot = await query.get()

    const logs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null
    }))

    return NextResponse.json({ logs, total: logs.length })
  } catch (error) {
    console.error('[Admin] Activity logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}
