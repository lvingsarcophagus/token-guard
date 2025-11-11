# 🔍 Firestore Indexes - Quick Reference

## Copy-Paste Guide for Firebase Console

### Index 1: Watchlist Tokens
```
Collection ID: tokens
Query Scope: Collection group ✓
Fields:
  - lastUpdatedAt (Descending)
  - addedAt (Descending)
```

### Index 2: Alert Notifications
```
Collection ID: notifications
Query Scope: Collection group ✓
Fields:
  - read (Ascending)
  - severity (Descending)
  - createdAt (Descending)
```

### Index 3: Analysis History
```
Collection ID: scans
Query Scope: Collection group ✓
Fields:
  - analyzedAt (Descending)
```

### Index 4: Users
```
Collection ID: users
Query Scope: Collection (regular)
Fields:
  - plan (Ascending)
  - createdAt (Descending)
```

---

## ⚠️ IMPORTANT: Collection Group vs Collection

| Index | Collection ID | Scope Type | Why? |
|-------|--------------|------------|------|
| 1 | `tokens` | **Collection group** | Subcollection under `watchlist/{userId}/` |
| 2 | `notifications` | **Collection group** | Subcollection under `alerts/{userId}/` |
| 3 | `scans` | **Collection group** | Subcollection under `analysis_history/{userId}/` |
| 4 | `users` | Collection | Root-level collection |

**Rule:** If path contains `{userId}` → Use **Collection Group**

---

## 🚀 Firebase CLI Alternative

If you prefer using CLI to create indexes:

1. Create `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "tokens",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "lastUpdatedAt", "order": "DESCENDING" },
        { "fieldPath": "addedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "read", "order": "ASCENDING" },
        { "fieldPath": "severity", "order": "DESCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "scans",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "analyzedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "plan", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

2. Deploy:
```bash
firebase deploy --only firestore:indexes
```

---

## 🔄 Auto-Creation Method (Easiest)

**Don't want to create indexes manually?** Just use the app!

1. Start your app: `pnpm dev`
2. Navigate to dashboard
3. Open browser console (F12)
4. When you see error like:
   ```
   The query requires an index. You can create it here:
   https://console.firebase.google.com/...
   ```
5. Click the link → Creates index automatically
6. Wait 2-5 minutes
7. Refresh page

**Repeat for each query that fails** until all 4 indexes are created.

---

## ✅ Verify Indexes Created

### Firebase Console
1. Go to **Firestore Database** → **Indexes** → **Composite**
2. You should see 4 indexes with status:
   - 🟡 **Building** (wait 2-5 min)
   - 🟢 **Enabled** (ready to use)

### Test in Code
```typescript
// This should work without errors once indexes are ready
const tokens = await getWatchlist(userId)
const alerts = await getAlerts(userId) 
const history = await getAnalysisHistory(userId)
```

---

## 🐛 Troubleshooting

### Error: "Collection ID 'watchlist/{userId}/tokens' is reserved"
**Fix:** Use `tokens` with **Collection group** scope (not the full path)

### Error: "The query requires an index"
**Fix:** Click the error link or create manually as shown above

### Index shows "Building" forever
**Wait:** Complex indexes can take 5-10 minutes
**Check:** Firestore quota limits not exceeded
**Retry:** Delete and recreate index

### Error: "index_already_exists"
**Solution:** Index already created, just wait for it to finish building

---

**Need help?** See full guide in [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md)
