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

    // Fetch all users
    const usersSnapshot = await adminDb.collection('users').get()
    
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        uid: doc.id,
        email: data.email || '',
        name: data.name || data.displayName || null,
        role: data.role || 'user',
        tier: data.tier || data.plan || 'FREE',
        plan: data.plan || data.tier || 'FREE',
        lastLogin: data.lastLoginAt || data.lastLogin || null,
        createdAt: data.createdAt || null,
        company: data.company || null,
        country: data.country || null
      }
    })

    // Calculate stats
    const stats = {
      totalUsers: users.length,
      premiumUsers: users.filter(u => u.tier === 'PREMIUM' || u.tier === 'pro' || u.plan === 'PREMIUM').length,
      cachedTokens: 0, // TODO: Implement if needed
      queries24h: 0 // TODO: Implement if needed
    }

    return NextResponse.json({ users, stats })
  } catch (error) {
    console.error('[Admin] Users fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

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

    // Check if user is admin
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get()
    const userData = userDoc.data()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, userId, updates } = body

    if (action === 'update' && userId && updates) {
      // Update user
      await adminDb.collection('users').doc(userId).update({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      
      return NextResponse.json({ success: true, message: 'User updated successfully' })
    }

    if (action === 'delete' && userId) {
      // Delete user
      await adminDb.collection('users').doc(userId).delete()
      await adminAuth.deleteUser(userId)
      
      return NextResponse.json({ success: true, message: 'User deleted successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Admin] User operation error:', error)
    return NextResponse.json(
      { error: 'Failed to perform operation' },
      { status: 500 }
    )
  }
}
