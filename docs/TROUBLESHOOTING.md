# 🔧 Free Dashboard Troubleshooting

## Quick Fix Checklist

### 1. **Check Dev Server is Running**
```bash
pnpm dev
```
Should show: `✓ Ready in XXXms`  
URL: `http://localhost:3000`

### 2. **Check User Authentication**
Open browser console (F12) and check:
```javascript
// In browser console
console.log('User:', user)
console.log('User Profile:', userProfile)
```

Expected output:
```javascript
User: { uid: "xxx", email: "user@example.com", ... }
User Profile: { plan: "FREE", usage: { tokensAnalyzed: 0, ... }, ... }
```

### 3. **Check Firestore Permissions**

**Symptom:** "Missing or insufficient permissions" error

**Fix:**
1. Go to Firebase Console → Firestore Database → Rules
2. Verify rules are published:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
3. Click **Publish**

### 4. **Check Browser Console for Errors**

Common errors and fixes:

#### Error: "getUserProfile is not a function"
**Fix:** Clear cache and rebuild
```bash
rm -rf .next
pnpm dev
```

#### Error: "Cannot read properties of undefined (reading 'plan')"
**Fix:** User profile not loaded yet. Dashboard should show loading spinner.

#### Error: "Network request failed"
**Fix:** 
- Check internet connection
- Verify Firebase config in `.env.local`
- Check Firebase project is active

### 5. **Verify Firebase Configuration**

Check `.env.local` has all required variables:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
```

### 6. **Test Dashboard Access Manually**

1. **Login first:**
   - Go to `http://localhost:3000/login`
   - Sign in with test account

2. **Check redirect:**
   - After login, should redirect to `/dashboard`
   - `/dashboard` should redirect to `/free-dashboard` (for FREE users)

3. **If stuck on loading:**
   - Open browser console (F12)
   - Look for errors
   - Check Network tab for failed requests

### 7. **Clear Browser Cache**

Sometimes old code is cached:
```bash
# In browser
1. Press Ctrl+Shift+Delete
2. Clear "Cached images and files"
3. Reload page (Ctrl+F5)
```

### 8. **Check if Firestore Data Exists**

Go to Firebase Console → Firestore Database → Data:

**Expected structure:**
```
users/
  {userId}/
    plan: "FREE"
    usage: { tokensAnalyzed: 0, dailyLimit: 10 }
    createdAt: Timestamp
```

**If missing:**
- User profile creation failed
- Check browser console for `createUserProfile` errors
- Try logging out and back in

### 9. **Manual Dashboard Stats Fix**

If dashboard loads but shows no data, the stats call might be failing. 

**Check in browser console:**
```javascript
// This should NOT show errors
// Look for: "Failed to load dashboard data:"
```

**If stats fail:**
- Firestore permissions issue
- Collections don't exist
- Network error

**Workaround:**
Dashboard now shows empty stats (0s) if Firestore fails, so it should still render.

### 10. **Force Profile Creation**

If user profile never gets created:

**Option A: Via Console**
```javascript
// In browser console (after login)
await createUserProfile(user.uid, user.email, user.displayName)
```

**Option B: Via Firestore Console**
1. Go to Firestore Database → Data
2. Click "Start collection" → Enter `users`
3. Add document with ID = your user UID
4. Add fields:
```json
{
  "plan": "FREE",
  "email": "your@email.com",
  "usage": {
    "tokensAnalyzed": 0,
    "dailyLimit": 10,
    "lastResetDate": [current timestamp]
  },
  "createdAt": [current timestamp],
  "lastLoginAt": [current timestamp]
}
```

---

## Common Issues

### Issue: "Dashboard shows loading spinner forever"

**Diagnosis:**
```javascript
// Check in browser console:
console.log('Loading:', loading)
console.log('User:', user)
console.log('User Profile:', userProfile)
```

**Possible causes:**
1. `loading` stuck at `true` → Auth not initializing
2. `user` is `null` → Not logged in
3. `userProfile` is `null` → Profile not loading

**Fix:**
- If `user` is null → Go to `/login`
- If `userProfile` is null → Check browser console for errors
- If `loading` stuck → Refresh page, check Firebase connection

### Issue: "Redirects to /login immediately"

**Cause:** User is not authenticated

**Fix:**
1. Go to `/login` or `/signup`
2. Create account or sign in
3. Should redirect to `/dashboard` → `/free-dashboard`

### Issue: "Charts not rendering"

**Diagnosis:**
```javascript
// Check if Recharts loaded
import { AreaChart } from 'recharts'
console.log(AreaChart) // Should be a function
```

**Fix:**
```bash
# Reinstall dependencies
pnpm install
pnpm dev
```

### Issue: "403 Forbidden" or "Permission denied"

**Cause:** Firestore security rules blocking access

**Fix:**
1. Firebase Console → Firestore → Rules
2. Update rules (see step 3 above)
3. Click Publish
4. Wait 1-2 minutes for rules to propagate
5. Refresh dashboard

---

## Debug Mode

Add this to `free-dashboard/page.tsx` to see detailed logs:

```typescript
useEffect(() => {
  console.log('=== FREE DASHBOARD DEBUG ===')
  console.log('User:', user)
  console.log('UserProfile:', userProfile)
  console.log('Loading:', loading)
  console.log('LoadingData:', loadingData)
  console.log('Stats:', stats)
  console.log('=========================')
}, [user, userProfile, loading, loadingData, stats])
```

---

## Still Not Working?

1. **Check all errors in console** (F12 → Console tab)
2. **Check Network tab** for failed requests
3. **Try different browser** (incognito mode)
4. **Check Firebase project status** (console.firebase.google.com)
5. **Restart dev server:** `Ctrl+C` then `pnpm dev`
6. **Clear .next cache:** `rm -rf .next && pnpm dev`

---

## Emergency Fallback

If nothing works, the dashboard now includes fallback behavior:

**Auth Context:**
- Creates fallback profile if Firestore fails
- User can still access dashboard with empty data

**Free Dashboard:**
- Shows 0s for all metrics if stats fail
- Charts show "No scans yet" message
- No crash, just empty state

This means the dashboard should **always render**, even with Firestore issues. If it doesn't, there's a more fundamental problem with React/Next.js.

---

## Getting Help

If issue persists:

1. **Screenshot browser console errors**
2. **Note the exact error message**
3. **Check Firebase Console → Functions → Logs** (if using)
4. **Verify all files exist:**
   - `/app/free-dashboard/page.tsx`
   - `/app/dashboard/page.tsx`
   - `/lib/services/firestore-service.ts`
   - `/contexts/auth-context.tsx`

---

**Last Updated:** November 7, 2025
