# 🚀 Firestore Setup Guide

## Step 1: Deploy Security Rules

### Option A: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **token-guard**
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules`
5. Paste into the rules editor
6. Click **Publish**

### Option B: Firebase CLI

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project (if not done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

---

## Step 2: Create Firestore Indexes

### Required Indexes

Go to **Firestore Database** → **Indexes** → **Composite** tab

> ⚠️ **Important:** For subcollections (tokens, notifications, scans), use **Collection Group** scope, not Collection scope!

#### Index 1: Watchlist Tokens (Collection Group)
- Collection ID: `tokens`
- Query scope: **Collection group** ⚠️
- Fields to index:
  - `lastUpdatedAt` → Descending
  - `addedAt` → Descending

#### Index 2: Alerts (Collection Group)
- Collection ID: `notifications`
- Query scope: **Collection group** ⚠️
- Fields to index:
  - `read` → Ascending
  - `severity` → Descending
  - `createdAt` → Descending

#### Index 3: Analysis History (Collection Group)
- Collection ID: `scans`
- Query scope: **Collection group** ⚠️
- Fields to index:
  - `analyzedAt` → Descending

#### Index 4: Users (Regular Collection)
- Collection ID: `users`
- Query scope: **Collection** (not collection group)
- Fields to index:
  - `plan` → Ascending
  - `createdAt` → Descending

### Auto-Create Indexes

Alternatively, use the app and Firebase will suggest creating indexes automatically when queries fail.

---

## 📸 Visual Guide: Creating Collection Group Index

### Step-by-Step for Index 1 (Watchlist Tokens)

1. **Firebase Console** → **Firestore Database** → **Indexes** tab
2. Click **"Composite"** sub-tab
3. Click **"Create Index"** button
4. Fill in the form:
   ```
   Collection ID: tokens
   
   Query scope: ○ Collection
                ● Collection group  ← SELECT THIS!
   
   Fields:
   Field 1: lastUpdatedAt | Sort: Descending
   Field 2: addedAt       | Sort: Descending
   ```
5. Click **"Create"**
6. Wait 2-5 minutes for index to build

### Why Collection Group?

**❌ Wrong:** `watchlist/{userId}/tokens` (throws "reserved" error)  
**✅ Correct:** `tokens` with Collection Group scope

**Explanation:**
- `watchlist/{userId}/tokens` is a **subcollection** path
- Firestore doesn't allow literal paths with `{userId}` in index names
- Instead, use **Collection Group** which indexes ALL `tokens` subcollections across all users
- Our queries use `collectionGroup('tokens')` which requires this type of index

### Visual Example

```
Firestore Structure:
└── watchlist/
    ├── user123/
    │   └── tokens/          ← This subcollection
    │       ├── tokenABC
    │       └── tokenXYZ
    └── user456/
        └── tokens/          ← And this subcollection
            └── tokenDEF

Collection Group "tokens" = ALL tokens subcollections combined
```

---

## Step 3: Test Database Connection

### 1. Start Development Server
```bash
pnpm dev
```

### 2. Test User Creation
1. Navigate to `http://localhost:3000/signup`
2. Create a new account
3. Check Firebase Console → Firestore Database
4. Verify `users/{userId}` document exists with:
   - `plan: 'FREE'`
   - `usage.dailyLimit: 10`
   - `subscription.status: 'active'`

### 3. Test Dashboard Data
1. Login with test account
2. Visit `/dashboard` (should redirect to `/free-dashboard`)
3. Open browser console
4. Check for any Firestore permission errors

### 4. Test Firestore Service
```typescript
import { getUserProfile } from '@/lib/services/firestore-service'

// In component
const profile = await getUserProfile(user.uid)
console.log(profile)
// Should return UserDocument with plan, usage, etc.
```

---

## Step 4: Verify Security Rules

### Test Plan-Based Access

**Free User Test:**
```javascript
// Should succeed
await addToWatchlist(userId, tokenData)

// Should fail (Premium only)
await createAlert(userId, alertData)
// Error: Missing or insufficient permissions
```

**Premium User Test:**
```javascript
// Upgrade user first
await updateUserPlan(userId, 'PREMIUM')

// Now should succeed
await createAlert(userId, alertData)
await updatePortfolio(userId, portfolioData)
```

### Test Ownership Rules

**Valid (Own Data):**
```javascript
const myData = await getWatchlist(myUserId)
// ✅ Returns data
```

**Invalid (Other User's Data):**
```javascript
const otherData = await getWatchlist(otherUserId)
// ❌ Error: Missing or insufficient permissions
```

---

## Step 5: Monitor Database

### Firebase Console Monitoring

1. **Firestore Database** → **Data**
   - Check collections are populating
   - Verify document structure matches schema

2. **Usage** Tab
   - Monitor read/write operations
   - Check for excessive queries (optimize if needed)

3. **Rules** Tab
   - View real-time rule evaluations
   - Debug permission errors

### Enable Firestore Logging

In `lib/services/firestore-service.ts`, all operations log to console:
```typescript
console.log('[Firestore] Get user profile:', userId)
console.error('[Firestore] Get user profile error:', error)
```

---

## Step 6: Seed Test Data (Optional)

Create sample data for testing dashboards:

```typescript
// Create test user
await createUserProfile('test-user-id', 'test@example.com', 'Test User')

// Add watchlist tokens
await addToWatchlist('test-user-id', {
  address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  name: 'Tether USD',
  symbol: 'USDT',
  chainId: '1',
  latestAnalysis: {
    riskScore: 29,
    riskLevel: 'LOW',
    analyzedAt: new Date(),
    breakdown: {
      supplyDilution: 22,
      holderConcentration: 60,
      liquidityDepth: 33,
      vestingUnlock: 0,
      contractControl: 0,
      taxFee: 0,
      distribution: 0,
      burnDeflation: 80,
      adoption: 67,
      auditTransparency: 0
    }
  },
  marketData: {
    price: 1.00,
    priceChange24h: 0.02,
    marketCap: 183000000000,
    volume24h: 7500000000,
    liquidity: 176000000
  },
  alertsEnabled: true,
  alertThreshold: 10,
  notes: '',
  tags: ['stablecoin'],
  addedAt: new Date(),
  lastUpdatedAt: new Date()
})

// Add analysis history
await saveAnalysisHistory('test-user-id', {
  tokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  tokenName: 'Tether USD',
  tokenSymbol: 'USDT',
  chainId: '1',
  results: {
    overall_risk_score: 29,
    risk_level: 'LOW',
    confidence_score: 96,
    breakdown: { /* ... */ }
  },
  marketSnapshot: {
    price: 1.00,
    marketCap: 183000000000,
    volume24h: 7500000000,
    liquidity: 176000000
  },
  plan: 'FREE',
  analyzedAt: new Date()
})
```

---

## Troubleshooting

### Error: "Missing or insufficient permissions"

**Cause:** Firestore security rules not deployed or user not authenticated

**Fix:**
1. Check Firebase Console → Rules are published
2. Verify user is logged in: `console.log(user)`
3. Check user owns the resource: `userId === user.uid`

### Error: "index_not_found"

**Cause:** Required composite index doesn't exist

**Fix:**
1. Click the error link in console (auto-creates index)
2. OR manually create index in Firebase Console
3. Wait 2-5 minutes for index build to complete

### Empty Dashboard Data

**Cause:** No data in Firestore collections

**Fix:**
1. Check Firestore Console → Collections exist
2. Verify document structure matches schema
3. Run seed data script (see Step 6)
4. Check browser console for errors

### Premium Features Not Working

**Cause:** User plan not set to 'PREMIUM'

**Fix:**
```typescript
await updateUserPlan(userId, 'PREMIUM')
```

Then refresh the page and check `userProfile.plan === 'PREMIUM'`

---

## Production Checklist

Before deploying to production:

- [ ] Firestore security rules deployed
- [ ] All 4 indexes created and active
- [ ] Test user signup flow
- [ ] Test free dashboard with <10 scans
- [ ] Test premium upgrade flow
- [ ] Test watchlist CRUD operations
- [ ] Test alert creation (premium only)
- [ ] Test portfolio tracking
- [ ] Monitor Firestore usage costs
- [ ] Set up billing alerts in Firebase
- [ ] Enable Firestore backups
- [ ] Review security rules for edge cases

---

## Cost Optimization

### Free Tier Limits
- **Reads:** 50,000/day
- **Writes:** 20,000/day
- **Deletes:** 20,000/day
- **Storage:** 1 GB

### Optimization Tips
1. **Cache dashboard stats** client-side (5min TTL)
2. **Batch reads** when loading dashboard
3. **Use subcollections** to avoid reading entire watchlist
4. **Limit analysis history** to last 50 scans
5. **Delete old alerts** after 30 days

### Estimated Usage (100 users)
- **Daily reads:** ~5,000 (dashboard loads, watchlist)
- **Daily writes:** ~500 (new scans, alerts)
- **Storage:** ~10 MB (user profiles, watchlists, history)
- **Cost:** **FREE** (well under limits)

---

## Next Steps

1. ✅ Deploy Firestore rules
2. ✅ Create required indexes
3. ✅ Test user signup
4. ✅ Test free dashboard
5. ⏳ Implement premium upgrade payment flow
6. ⏳ Add real-time alert monitoring
7. ⏳ Integrate portfolio tracking
8. ⏳ Add email notifications

---

**Questions?** Check the [DASHBOARD_SYSTEM.md](./DASHBOARD_SYSTEM.md) for detailed documentation.
