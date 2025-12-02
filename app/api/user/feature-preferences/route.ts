import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'

/**
 * POST /api/user/feature-preferences
 * Update user's feature preferences for pay-per-use features
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const adminAuth = getAdminAuth()
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    const { preferences } = await request.json()

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'Invalid preferences' }, { status: 400 })
    }

    // Validate preferences structure
    const validPreferences = {
      aiRiskAnalyst: preferences.aiRiskAnalyst === true,
      portfolioAudit: preferences.portfolioAudit === true,
    }

    // Update user profile
    const adminDb = getAdminDb()
    await adminDb.collection('users').doc(userId).update({
      featurePreferences: validPreferences,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      preferences: validPreferences,
    })
  } catch (error: any) {
    console.error('[Feature Preferences] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
