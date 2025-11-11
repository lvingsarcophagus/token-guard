# 🔐 Admin System - Complete Guide

## Overview

Comprehensive admin panel for TokenGuard with user management, cache management, and analytics.

## 🎯 Features

### 1. Admin Login
- Dedicated admin login page at `/admin/login`
- Role-based access control
- Security monitoring and logging

### 2. Admin Dashboard (`/admin/dashboard`)
- **User Management**: View, edit, delete users
- **Role Management**: Change user tiers (FREE, PREMIUM, ADMIN)
- **Cache Management**: View and clear tokenomics cache
- **Analytics**: User distribution, system health
- **Real-time Statistics**: Live user counts, cache stats

### 3. Tokenomics Caching
- Firestore-based cache (30-minute TTL)
- Automatic cache invalidation
- Query count tracking
- Performance optimization

## 🚀 Quick Setup

### Step 1: Create Your First Admin

```powershell
# Find your UID in Firebase Console → Authentication
node scripts/make-admin.js <YOUR_UID>
```

**Example:**
```powershell
node scripts/make-admin.js ZXO60YVMvVMQY5HKI2I1xYYqRip1
```

### Step 2: Sign Out & Sign In
User must completely sign out and sign back in to get admin claims.

### Step 3: Access Admin Panel

**Method 1: Direct Login**
1. Go to `/admin/login`
2. Enter admin credentials
3. Redirects to `/admin/dashboard`

**Method 2: From Dashboard**
1. If already logged in as admin
2. Visit `/admin/dashboard` directly

## 📁 File Structure

```
app/
├── admin/
│   ├── login/
│   │   └── page.tsx          # Admin login page
│   └── dashboard/
│       └── page.tsx           # Main admin dashboard
│
api/
└── admin/
    ├── set-user-role/
    │   └── route.ts           # Set/get user roles
    ├── delete-user/
    │   └── route.ts           # Delete users
    ├── cache-stats/
    │   └── route.ts           # Get cache statistics
    └── clear-cache/
        └── route.ts           # Clear tokenomics cache

lib/
├── tokenomics-cache.ts        # Cache service
└── firebase-admin.ts          # Admin SDK setup

scripts/
├── make-admin.js              # Create admin users
└── make-premium.js            # Upgrade to premium
```

## 🎨 Admin Dashboard Features

### User Management Tab

**Features:**
- View all users with email, UID, role, tier
- Search users by email or UID
- Edit user roles (FREE → PREMIUM → ADMIN)
- Delete users (with confirmation)
- Bulk operations support

**Actions:**
1. **Edit Role**:
   - Click edit button
   - Select new role
   - Click save
   - User must sign out/in to see changes

2. **Delete User**:
   - Click delete button
   - Confirm deletion
   - Removes from Auth + Firestore

### Cache Management Tab

**Features:**
- View all cached tokens
- See query counts per token
- Last updated timestamps
- Clear individual token cache
- Clear all cache at once

**Benefits:**
- Reduced API calls
- Faster response times
- Lower costs
- Better performance

### Analytics Tab

**Metrics:**
- User distribution (FREE/PREMIUM/ADMIN)
- Conversion rates
- System health status
- Cache hit rates
- Average response times

## 🔌 API Endpoints

### 1. Set User Role

**Endpoint:** `POST /api/admin/set-user-role`

**Request:**
```json
{
  "targetUid": "abc123def456",
  "role": "PREMIUM"
}
```

**Headers:**
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "uid": "abc123def456",
  "role": "PREMIUM",
  "message": "User role updated to PREMIUM"
}
```

### 2. Delete User

**Endpoint:** `DELETE /api/admin/delete-user`

**Request:**
```json
{
  "uid": "abc123def456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "uid": "abc123def456"
}
```

### 3. Get Cache Stats

**Endpoint:** `GET /api/admin/cache-stats`

**Response:**
```json
{
  "success": true,
  "tokens": [
    {
      "address": "0x...",
      "name": "Tether USD",
      "symbol": "USDT",
      "queryCount": 42,
      "lastUpdated": "2025-11-03T..."
    }
  ],
  "totalQueries": 156,
  "count": 12
}
```

### 4. Clear Cache

**Endpoint:** `POST /api/admin/clear-cache`

**Clear Specific Token:**
```json
{
  "address": "0x..."
}
```

**Clear All:**
```json
{}
```

## 💾 Firestore Collections

### tokenCache

Stores tokenomics data for performance optimization.

```
/tokenCache/{tokenAddress}
  ├── address: string
  ├── name: string
  ├── symbol: string
  ├── priceData: {
  │   ├── price: number
  │   ├── marketCap: number
  │   ├── volume24h: number
  │   ├── liquidity: number
  │   └── ...
  │ }
  ├── securityData: {
  │   ├── riskScore: number
  │   ├── riskLevel: string
  │   ├── issues: array
  │   └── ...
  │ }
  ├── tokenomics: {
  │   ├── holderCount: number
  │   ├── burnMechanism: boolean
  │   └── ...
  │ }
  ├── queryCount: number
  ├── lastUpdated: timestamp
  └── chainId: string
```

**TTL:** 30 minutes (configurable in `lib/tokenomics-cache.ts`)

### users

User profile and role data.

```
/users/{uid}
  ├── email: string
  ├── role: "FREE" | "PREMIUM" | "ADMIN"
  ├── tier: "free" | "pro"
  ├── admin: boolean
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  └── premiumSince?: timestamp
```

## 🔐 Security

### Admin Access Control

1. **Custom Claims**: Server-side verification
2. **Token Validation**: All admin APIs check ID token
3. **Role Verification**: `admin: true` or `role: "ADMIN"`
4. **Self-Protection**: Cannot delete own account
5. **Audit Logging**: All actions logged

### Protected Routes

- `/admin/dashboard` - Admin only
- `/admin/login` - Public (but checks role after login)
- `/api/admin/*` - All require admin token

### Best Practices

✅ **DO:**
- Use admin login page for admins
- Verify admin claims server-side
- Log all administrative actions
- Use environment variables for secrets
- Implement rate limiting

❌ **DON'T:**
- Expose admin scripts publicly
- Allow client-side role changes
- Skip token verification
- Delete users without confirmation
- Commit .env.local to Git

## 🛠️ Caching System

### How It Works

1. **Request comes in** → Check cache first
2. **Cache hit** → Return cached data (fast!)
3. **Cache miss** → Fetch from APIs → Cache result
4. **TTL expired** → Auto-refresh on next request

### Cache Flow

```
User Request
     ↓
Check tokenCache collection
     ↓
   Found? ← NO ─→ Fetch from APIs
     ↓ YES             ↓
Expired? ← NO ─→   Cache result
     ↓ YES             ↓
Return cached    Return + cache
```

### Configuration

Edit `lib/tokenomics-cache.ts`:

```typescript
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
```

### Cache Statistics

```typescript
import { getCacheStatistics } from '@/lib/tokenomics-cache'

const stats = await getCacheStatistics()
// Returns: totalEntries, validEntries, totalQueries, cacheHitRate
```

## 📊 Statistics Dashboard

### Live Metrics

- **Total Users**: All registered users
- **Premium Users**: Active premium subscriptions
- **Free Users**: Basic tier users
- **Admin Users**: System administrators
- **Cached Tokens**: Number of tokens in cache
- **Total Queries**: Cumulative API requests

### User Distribution Chart

Shows percentage breakdown:
- FREE users (gray)
- PREMIUM users (green)
- ADMIN users (red)

### System Health

- ✅ All Systems Operational
- 📊 Cache Hit Rate
- ⚡ Average Response Time

## 🔍 Search & Filter

### User Search

Search by:
- Email address
- User UID
- Case-insensitive matching

### Cache Filter

Filter cached tokens by:
- Token symbol
- Contract address
- Query count

## ⚡ Performance Tips

1. **Use caching** - Reduces API calls by ~80%
2. **Clear expired cache** - Run cleanup periodically
3. **Monitor query counts** - Identify hot tokens
4. **Set proper TTL** - Balance freshness vs performance

## 🚨 Troubleshooting

### "Access Denied" Error

**Problem:** User can't access admin panel

**Solution:**
1. Run `node scripts/make-admin.js <UID>`
2. User must sign out completely
3. User must sign in again
4. Check custom claims in Firebase Console

### Cache Not Working

**Problem:** Always fetching from APIs

**Solution:**
1. Check Firestore rules allow admin write
2. Verify `tokenCache` collection exists
3. Check Firebase Admin SDK initialized
4. Review console logs for errors

### Can't Delete User

**Problem:** Delete button doesn't work

**Solution:**
1. Check you're not trying to delete yourself
2. Verify admin token is valid
3. Ensure user exists in Firebase Auth
4. Check Firestore permissions

## 📝 Development Commands

```powershell
# Create admin user
node scripts/make-admin.js <UID>

# Create premium user
node scripts/make-premium.js <UID>

# Start dev server
npm run dev

# Check Firebase rules
# Go to Firebase Console → Firestore → Rules
```

## 🎯 Next Steps

1. ✅ Set up your first admin user
2. ✅ Login to admin panel
3. ✅ Explore user management
4. ✅ Check cache statistics
5. ✅ Monitor system analytics

---

## 💡 Pro Tips

- **Keyboard Shortcuts**: Use browser search (Ctrl+F) to find users quickly
- **Bulk Operations**: Select multiple users for batch role changes (coming soon)
- **Export Data**: Download user lists as CSV (coming soon)
- **Email Notifications**: Auto-notify users on role changes (coming soon)

---

**Need Help?** Check the console logs for detailed error messages!
