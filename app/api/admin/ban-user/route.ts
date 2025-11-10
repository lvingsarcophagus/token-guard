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

    const { userId, banned, reason } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Update user document in Firestore
    await adminDb.collection('users').doc(userId).update({
      banned: banned || false,
      bannedAt: banned ? new Date().toISOString() : null,
      bannedBy: banned ? decodedToken.uid : null,
      banReason: banned ? (reason || 'No reason provided') : null,
      updatedAt: new Date().toISOString()
    })

    // Optionally disable the user in Firebase Auth
    if (banned) {
      await adminAuth.updateUser(userId, {
        disabled: true
      })
    } else {
      await adminAuth.updateUser(userId, {
        disabled: false
      })
    }

    return NextResponse.json({ 
      success: true,
      message: banned ? 'User banned successfully' : 'User unbanned successfully'
    })
  } catch (error) {
    console.error('Ban user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user ban status' },
      { status: 500 }
    )
  }
}
