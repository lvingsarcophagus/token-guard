# Admin Account Setup Guide

## How to Create an Admin Account

### Method 1: Manual Setup in Firestore (Easiest)

1. **Create a user account** through the signup page or Firebase Auth Console
2. **Go to Firebase Console** → Firestore Database
3. **Find the user document** in the `users` collection (use the user's UID)
4. **Edit the document** and add/update:
   - `role`: Set to `"admin"`
   - `tier`: Set to `"pro"` (admins get pro features)

That's it! The user will now have admin access.

### Method 2: Using the Admin Setup API

If you have Firebase Admin SDK configured:

```bash
curl -X POST http://localhost:3000/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tokenguard.com",
    "password": "your-secure-password",
    "name": "Admin"
  }'
```

### Method 3: Programmatic Setup

After creating a user in Firebase Auth, you can set them as admin by updating their Firestore document:

```typescript
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

async function makeUserAdmin(userId: string, email: string) {
  const userRef = doc(db, 'users', userId)
  await setDoc(userRef, {
    role: 'admin',
    tier: 'pro',
    email: email,
    // ... other user data
  }, { merge: true })
}
```

## Admin Features

- Access to `/admin` page
- Admin link in navbar
- Full system statistics
- User activity monitoring
- System health monitoring

## Security Note

Make sure your Firestore security rules allow users to update their own `role` field only if they're already an admin, or handle this server-side.







