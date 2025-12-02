/**
 * Admin API for viewing payment history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify admin auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);

    // Check if user is admin
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status'); // active, expired, all

    // Get subscriptions from Firestore
    let query = db.collection('subscriptions')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (status && status !== 'all') {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.get();
    const subscriptions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId || '',
        amount: data.amount || '0',
        status: data.status || 'unknown',
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        startDate: data.startDate?.toDate?.()?.toISOString() || null,
        expiryDate: data.expiryDate?.toDate?.()?.toISOString() || null,
      };
    });

    // Get user details for each subscription
    const userIds = [...new Set(subscriptions.map(s => s.userId).filter(Boolean))];
    const userPromises = userIds.map(uid => 
      db.collection('users').doc(uid).get()
    );
    const userDocs = await Promise.all(userPromises);
    const userMap = new Map();
    userDocs.forEach(doc => {
      if (doc.exists) {
        userMap.set(doc.id, {
          email: doc.data()?.email || 'Unknown',
          displayName: doc.data()?.displayName || 'Unknown',
        });
      }
    });

    // Enrich subscriptions with user data
    const enrichedSubscriptions = subscriptions.map(sub => ({
      ...sub,
      userEmail: userMap.get(sub.userId)?.email || 'Unknown',
      userName: userMap.get(sub.userId)?.displayName || 'Unknown',
    }));

    // Calculate stats
    const totalRevenue = subscriptions.reduce((sum, sub) => 
      sum + parseFloat(sub.amount || '0'), 0
    );
    const activeCount = subscriptions.filter(s => s.status === 'active').length;

    return NextResponse.json({
      success: true,
      subscriptions: enrichedSubscriptions,
      stats: {
        total: subscriptions.length,
        active: activeCount,
        totalRevenue: totalRevenue.toFixed(2),
      },
    });
  } catch (error: any) {
    console.error('[Admin Payments] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get payments', message: error?.message },
      { status: 500 }
    );
  }
}
