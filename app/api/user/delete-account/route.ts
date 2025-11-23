import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    
    let decodedToken
    try {
      decodedToken = await adminAuth.verifyIdToken(token)
    } catch (verifyError) {
      console.error('[Delete Account] Token verification failed:', verifyError)
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
    
    const userId = decodedToken.uid

    console.log(`[Delete Account] Deleting user: ${userId}`)

    // Delete user subcollections in batches (Firestore has 500 operation limit per batch)
    const deleteInBatches = async (collectionPath: string) => {
      const snapshot = await adminDb.collection(collectionPath).get()
      if (snapshot.empty) return
      
      const batches = []
      let batch = adminDb.batch()
      let operationCount = 0
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
        operationCount++
        
        if (operationCount === 500) {
          batches.push(batch.commit())
          batch = adminDb.batch()
          operationCount = 0
        }
      })
      
      if (operationCount > 0) {
        batches.push(batch.commit())
      }
      
      await Promise.all(batches)
    }

    // Delete watchlist
    await deleteInBatches(`watchlist/${userId}/tokens`)

    // Delete analysis history
    await deleteInBatches(`analysis_history/${userId}/scans`)

    // Delete alerts
    await deleteInBatches(`alerts/${userId}/notifications`)

    // Delete single documents
    const singleDocDeletes = [
      adminDb.collection('portfolio').doc(userId).delete(),
      adminDb.collection('settings').doc(userId).delete(),
      adminDb.collection('totp_secrets').doc(userId).delete(),
      adminDb.collection('admin_notification_preferences').doc(userId).delete(),
      adminDb.collection('users').doc(userId).delete()
    ]

    await Promise.all(singleDocDeletes)

    // Delete from Firebase Auth
    await adminAuth.deleteUser(userId)

    console.log(`[Delete Account] User deleted successfully: ${userId}`)

    return NextResponse.json({ success: true, message: 'Account deleted successfully' })
  } catch (error: any) {
    console.error('[Delete Account] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete account', 
      details: error?.message || 'Unknown error' 
    }, { status: 500 })
  }
}
