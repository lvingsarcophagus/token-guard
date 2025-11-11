# 🔐 User Roles & Permissions System

Complete guide for managing user tiers (FREE, PREMIUM, ADMIN) in TokenGuard.

## 📋 Overview

TokenGuard uses Firebase Authentication custom claims + Firestore for user roles:

- **FREE**: Basic 3-factor risk analysis, 10 queries/day
- **PREMIUM**: Advanced 10-factor analysis, unlimited queries
- **ADMIN**: Full access + ability to manage other users

## 🚀 Quick Start

### 1. Create Your First Admin User

After a user signs up, get their UID from Firebase Console and run:

```powershell
# Install dependencies first (if not done)
npm install firebase-admin dotenv

# Make the user an admin
node scripts/make-admin.js <USER_UID>
```

**Example:**
```powershell
node scripts/make-admin.js abc123def456ghi789
```

**Output:**
```
✅ Firebase Admin initialized
👤 User found: admin@example.com
✅ Custom claims set: { role: "ADMIN", admin: true }
✅ Firestore user document updated
🎉 Success! User is now an ADMIN
```

### 2. User Must Sign Out & Sign In

⚠️ **Important**: Custom claims are part of the ID token. The user must:
1. Sign out of the app
2. Sign in again
3. Now they have admin privileges

## 📝 Scripts Available

### Make Admin
```powershell
node scripts/make-admin.js <UID>
```
- Sets user to ADMIN role
- Grants `admin: true` claim
- Updates Firestore document

### Make Premium
```powershell
node scripts/make-premium.js <UID>
```
- Upgrades user to PREMIUM
- Unlimited API queries
- Advanced 10-factor analysis

## 🎨 Admin Panel (UI)

Admins can manage users through the web interface:

1. **Navigate** to `/admin`
2. **See the Admin Panel** card (red border)
3. **Enter user UID** (find in Firebase Console)
4. **Select role**: FREE, PREMIUM, or ADMIN
5. **Click "Set User Role"**

The panel only appears for users with admin privileges.

## 🔧 API Endpoint

### Set User Role

**Endpoint:** `POST /api/admin/set-user-role`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <FIREBASE_ID_TOKEN>"
}
```

**Body:**
```json
{
  "targetUid": "abc123def456",
  "role": "PREMIUM",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "uid": "abc123def456",
  "role": "PREMIUM",
  "message": "User role updated to PREMIUM. User must refresh their token to see changes."
}
```

### List Users

**Endpoint:** `GET /api/admin/set-user-role`

**Headers:**
```json
{
  "Authorization": "Bearer <FIREBASE_ID_TOKEN>"
}
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "uid": "abc123",
      "email": "user@example.com",
      "role": "PREMIUM",
      "tier": "pro",
      "admin": false
    }
  ],
  "count": 1
}
```

## 💻 Using Roles in Code

### React Hook

```tsx
import { useUserRole } from '@/hooks/use-user-role'

function MyComponent() {
  const { role, isAdmin, isPremium, isFree, loading } = useUserRole()

  if (loading) return <div>Loading...</div>

  if (isAdmin) {
    return <div>Admin Panel</div>
  }

  if (isPremium) {
    return <div>Premium Features</div>
  }

  return <div>Free Features</div>
}
```

### Refresh Token After Role Change

```tsx
import { refreshUserToken } from '@/hooks/use-user-role'

async function upgradeUser() {
  // After upgrading user via API
  await refreshUserToken()
  // Now the user has updated claims
}
```

### Check in API Routes

```typescript
import { getAdminAuth } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  const adminAuth = getAdminAuth()
  const user = await adminAuth.verifyIdToken(token)
  
  // Check role from custom claims
  if (user.role !== 'PREMIUM' && user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Premium subscription required' },
      { status: 403 }
    )
  }
  
  // Continue with premium logic...
}
```

## 🗄️ Firestore Structure

### Users Collection

```
/users/{uid}
  ├── email: string
  ├── role: "FREE" | "PREMIUM" | "ADMIN"
  ├── tier: "free" | "pro"
  ├── admin: boolean
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  └── premiumSince?: timestamp (for PREMIUM users)
```

### Rate Limits Collection

```
/rateLimits/{uid}
  ├── date: string (YYYY-MM-DD)
  ├── count: number
  ├── lastQuery: timestamp
  └── limit: number
```

## 🔒 Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && 
                     (request.auth.uid == userId || request.auth.token.admin == true);
    }

    // Only admins can manage all users
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }

    // Rate limits - users can only read their own
    match /rateLimits/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## 🎯 User Flow

### New User Signup
1. User signs up → automatically gets `role: "FREE"`
2. Firestore document created with FREE tier
3. Subject to 10 queries/day rate limit

### Upgrade to Premium
1. Admin runs: `node scripts/make-premium.js <UID>`
2. Custom claims updated: `{ role: "PREMIUM" }`
3. Firestore updated: `{ tier: "pro", role: "PREMIUM" }`
4. User signs out & back in
5. Now has unlimited queries + advanced analysis

### Make Admin
1. Admin runs: `node scripts/make-admin.js <UID>`
2. Custom claims: `{ role: "ADMIN", admin: true }`
3. User signs out & back in
4. Can access `/admin` page
5. Can manage other users

## 🛠️ Troubleshooting

### "User is not admin" error

**Problem**: User still seeing as FREE after running script

**Solution**:
1. Make sure the script completed successfully
2. User MUST sign out completely
3. User MUST sign in again (not just refresh)
4. Check Firebase Console → Authentication → Users → Custom claims

### Firebase Admin errors

**Problem**: `Missing Firebase credentials`

**Solution**:
1. Check `.env.local` has all variables:
   - `PROJECT_ID`
   - `CLIENT_EMAIL`
   - `PRIVATE_KEY`
2. Make sure `PRIVATE_KEY` is in quotes
3. Restart dev server after changing `.env.local`

### Role not showing in app

**Problem**: useUserRole() returns null

**Solution**:
1. Force token refresh: `user.getIdToken(true)`
2. Check Firestore `/users/{uid}` document exists
3. Verify user is authenticated
4. Check browser console for errors

## 📦 Environment Variables

Required in `.env.local`:

```bash
# Firebase Admin SDK
PROJECT_ID=token-guard-91e5b
CLIENT_EMAIL=firebase-adminsdk-...@....iam.gserviceaccount.com
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Optional (already in your .env.local)
TYPE=service_account
CLIENT_ID=...
AUTH_URI=https://accounts.google.com/o/oauth2/auth
TOKEN_URI=https://oauth2.googleapis.com/token
```

## 🔐 Best Practices

1. **Never expose admin scripts** - Keep in `/scripts`, don't deploy
2. **Validate on server** - Always check custom claims server-side
3. **Use custom claims for auth** - Don't rely on Firestore alone
4. **Refresh tokens** - After role changes, force token refresh
5. **Secure API endpoints** - Verify admin status before operations
6. **Log role changes** - Track who changed what and when

## 📚 Reference

### Role Hierarchy
```
ADMIN > PREMIUM > FREE
```

### Permissions Matrix

| Feature | FREE | PREMIUM | ADMIN |
|---------|------|---------|-------|
| Token Analysis | ✅ (10/day) | ✅ Unlimited | ✅ Unlimited |
| 3-Factor Analysis | ✅ | ✅ | ✅ |
| 10-Factor Analysis | ❌ | ✅ | ✅ |
| ML Scam Detection | ❌ | ✅ | ✅ |
| Vesting Forecasts | ❌ | ✅ | ✅ |
| Admin Panel | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |

---

## 🎉 Quick Command Reference

```powershell
# Make first admin
node scripts/make-admin.js <UID>

# Upgrade to premium
node scripts/make-premium.js <UID>

# Install dependencies (if needed)
npm install firebase-admin dotenv

# Find user UID
# Go to: Firebase Console → Authentication → Users
```

**Need help?** Check the console logs for detailed error messages!
