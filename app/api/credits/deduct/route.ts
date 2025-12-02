import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * POST /api/credits/deduct
 * Deduct credits when user uses a feature
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const adminAuth = getAdminAuth()
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    const body = await request.json()
    const { feature, amount, reason, tokenAddress } = body

    // Feature costs in credits
    const FEATURE_COSTS: Record<string, number> = {
      'ai_analyst': 1,        // 1 credit = $0.10
      'portfolio_audit': 0.5  // 0.5 credits per token = $0.05
    }

    const cost = amount || FEATURE_COSTS[feature]
    
    if (!cost || cost <= 0) {
      return NextResponse.json({ error: 'Invalid feature or amount' }, { status: 400 })
    }

    // Get user document
    const adminDb = getAdminDb()
    const userRef = adminDb.collection('users').doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    const currentCredits = userData?.credits || 0
    const userPlan = userData?.plan
    const featurePreferences = userData?.featurePreferences || {
      aiRiskAnalyst: true,
      portfolioAudit: true
    }

    // Check if user has PAY_PER_USE plan
    if (userPlan !== 'PAY_PER_USE') {
      return NextResponse.json({ 
        error: 'This feature requires PAY_PER_USE plan' 
      }, { status: 403 })
    }

    // Check if feature is enabled in user preferences
    if (feature === 'ai_analyst' && !featurePreferences.aiRiskAnalyst) {
      return NextResponse.json({ 
        success: true,
        credits: currentCredits,
        deducted: 0,
        skipped: true,
        message: 'AI Risk Analyst is disabled in preferences'
      })
    }

    if (feature === 'portfolio_audit' && !featurePreferences.portfolioAudit) {
      return NextResponse.json({ 
        success: true,
        credits: currentCredits,
        deducted: 0,
        skipped: true,
        message: 'Portfolio Audit is disabled in preferences'
      })
    }

    // Check if user has enough credits
    if (currentCredits < cost) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        required: cost,
        available: currentCredits
      }, { status: 402 }) // 402 Payment Required
    }

    // Deduct credits
    await userRef.update({
      credits: FieldValue.increment(-cost),
      updatedAt: FieldValue.serverTimestamp()
    })

    // Log transaction
    await adminDb.collection('credit_transactions').add({
      userId,
      feature: feature || 'token_scan',
      cost,
      reason: reason || feature || 'Token scan',
      tokenAddress: tokenAddress || null,
      type: 'usage',
      status: 'completed',
      createdAt: FieldValue.serverTimestamp()
    })

    // Log activity
    const activityLog: any = {
      userId,
      userEmail: userData?.email || 'unknown',
      action: 'credits_used',
      details: `Used ${cost} credits for ${reason || feature || 'unknown'}`,
      metadata: {
        cost,
        balanceBefore: currentCredits,
        balanceAfter: currentCredits - cost
      },
      timestamp: FieldValue.serverTimestamp(),
      userAgent: request.headers.get('user-agent') || 'Unknown'
    }

    // Only add optional fields if they have values
    if (feature) activityLog.metadata.feature = feature
    if (reason) activityLog.metadata.reason = reason
    if (tokenAddress) activityLog.metadata.tokenAddress = tokenAddress

    await adminDb.collection('activity_logs').add(activityLog)

    const newBalance = currentCredits - cost

    console.log(`✅ Deducted ${cost} credits from user ${userId} for ${feature} (balance: ${newBalance})`)

    return NextResponse.json({
      success: true,
      credits: newBalance,
      deducted: cost
    })
  } catch (error: any) {
    console.error('❌ Error deducting credits:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to deduct credits' },
      { status: 500 }
    )
  }
}
