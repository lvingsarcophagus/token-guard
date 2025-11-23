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

    if (!isDev && token) {
      const decodedToken = await adminAuth.verifyIdToken(token)
      const customClaims = decodedToken as any
      
      if (!customClaims.admin && customClaims.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    // Get analytics data from Firestore
    const now = Date.now()
    const last24h = now - (24 * 60 * 60 * 1000)
    const last7days = now - (7 * 24 * 60 * 60 * 1000)
    const last30days = now - (30 * 24 * 60 * 60 * 1000)

    // Query rate limits for last 24h activity
    const rateLimitsSnapshot = await adminDb
      .collection('rateLimits')
      .where('lastRequest', '>', new Date(last24h))
      .get()

    const queriesLast24h = rateLimitsSnapshot.docs.reduce((sum: number, doc: any) => {
      const data = doc.data()
      return sum + (data.requestCount || 0)
    }, 0)

    const activeUsers24h = rateLimitsSnapshot.size

    // Get all users for growth chart
    const usersSnapshot = await adminDb.collection('users').get()
    const allUsers = usersSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }))

    // Calculate user growth over last 30 days
    const userGrowthData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - (i * 24 * 60 * 60 * 1000))
      const dateStr = date.toISOString().split('T')[0]
      const count = allUsers.filter((u: any) => {
        const createdAt = u.createdAt?.toDate?.() || new Date(u.createdAt)
        return createdAt <= date
      }).length
      userGrowthData.push({ date: dateStr, users: count })
    }

    // Calculate scan activity over last 7 days
    const scanActivityData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - (i * 24 * 60 * 60 * 1000))
      const dateStr = date.toISOString().split('T')[0]
      // Simulate scan data (replace with actual scan history query)
      scanActivityData.push({ 
        date: dateStr, 
        scans: Math.floor(Math.random() * 50) 
      })
    }

    // Tier distribution
    const tierDistribution = {
      free: allUsers.filter((u: any) => u.tier === 'free' || !u.tier).length,
      premium: allUsers.filter((u: any) => u.tier === 'pro' || u.tier === 'premium').length,
      admin: allUsers.filter((u: any) => u.role === 'admin' || u.isAdmin).length
    }

    // Chain usage (simulated - replace with actual data)
    const chainUsage = [
      { chain: 'Solana', count: 65, percentage: 65 },
      { chain: 'Ethereum', count: 25, percentage: 25 },
      { chain: 'BSC', count: 10, percentage: 10 }
    ]

    return NextResponse.json({
      success: true,
      queriesLast24h,
      activeUsers24h,
      userGrowthData,
      scanActivityData,
      tierDistribution,
      chainUsage,
      totalUsers: allUsers.length,
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch analytics',
      details: error.message 
    }, { status: 500 })
  }
}
