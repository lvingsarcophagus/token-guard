# Firebase Storage Setup Guide

## Overview

This guide explains how to configure Firebase Storage for profile image uploads in Tokenomics Lab.

## Storage Structure

```
storage/
└── profile-images/
    └── {userId}/
        └── {timestamp}_{filename}
```

## Security Rules

Add these rules to your Firebase Storage in the Firebase Console:

### Navigate to Storage Rules

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Click "Storage" in the left sidebar
4. Click the "Rules" tab
5. Replace the existing rules with the following:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Profile images - users can only upload to their own folder
    match /profile-images/{userId}/{allPaths=**} {
      // Allow read if authenticated
      allow read: if request.auth != null;
      
      // Allow write only to own folder
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024  // Max 5MB
                   && request.resource.contentType.matches('image/.*');  // Only images
      
      // Allow delete only own images
      allow delete: if request.auth != null 
                    && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Rule Explanation

- **Read Access**: Any authenticated user can view profile images
- **Write Access**: 
  - Users can only upload to their own folder (`userId` must match `request.auth.uid`)
  - File size limited to 5MB
  - Only image files allowed (JPEG, PNG, GIF, etc.)
- **Delete Access**: Users can only delete their own images

## Environment Variables

Ensure your `.env.local` file includes the Firebase Storage bucket:

```bash
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

## Firestore Schema Update

The user profile document in Firestore includes a `photoURL` field:

```typescript
interface UserDocument {
  uid: string
  email: string
  displayName: string | null
  photoURL: string | null  // ← Profile image URL
  plan: 'FREE' | 'PREMIUM'
  // ... other fields
}
```

## Usage in Application

### Profile Image Upload Component

Located at: `components/profile-image-upload.tsx`

Features:
- Image preview with circular avatar
- Upload button with file picker
- Remove image button
- File validation (type and size)
- Firebase Storage integration
- Automatic Firestore profile update

### Integration

The component is integrated into the profile page at `app/profile/page.tsx`:

```tsx
import ProfileImageUpload from "@/components/profile-image-upload"

// In the profile page
<ProfileImageUpload />
```

## Testing

1. **Upload Test**:
   - Navigate to `/profile`
   - Click "UPLOAD IMAGE"
   - Select an image file (< 5MB)
   - Verify image appears in preview
   - Check Firestore `users/{userId}` document has `photoURL` field

2. **Remove Test**:
   - Click the X button on the profile image
   - Verify image is removed from preview
   - Check Firestore `photoURL` field is cleared

3. **Security Test**:
   - Try uploading a file > 5MB (should fail)
   - Try uploading a non-image file (should fail)
   - Verify users cannot access other users' image folders

## Troubleshooting

### "Permission Denied" Error

**Cause**: Storage rules not configured or user not authenticated

**Solution**:
1. Verify Storage rules are published in Firebase Console
2. Ensure user is logged in
3. Check browser console for detailed error messages

### Image Not Displaying

**Cause**: CORS or URL issues

**Solution**:
1. Verify `photoURL` is saved in Firestore
2. Check Firebase Storage CORS configuration
3. Ensure Storage bucket is publicly readable for authenticated users

### Upload Fails Silently

**Cause**: File validation or network issues

**Solution**:
1. Check file size (must be < 5MB)
2. Verify file is an image type
3. Check browser network tab for failed requests
4. Verify Firebase Storage is enabled in Firebase Console

## Cost Considerations

Firebase Storage pricing (as of 2024):
- **Storage**: $0.026/GB per month
- **Download**: $0.12/GB
- **Upload**: $0.12/GB

Typical usage for profile images:
- Average image size: 500KB
- 1000 users = ~500MB storage = ~$0.013/month
- Very cost-effective for profile images

## Best Practices

1. **Image Optimization**: Consider resizing images on upload to reduce storage costs
2. **Cleanup**: Delete old profile images when users upload new ones
3. **CDN**: Firebase Storage includes CDN, so images load fast globally
4. **Backup**: Firebase Storage is automatically backed up by Google
5. **Monitoring**: Use Firebase Console to monitor storage usage

## Next Steps

- [ ] Publish Storage rules in Firebase Console
- [ ] Test image upload functionality
- [ ] Verify security rules work correctly
- [ ] Monitor storage usage in Firebase Console
- [ ] Consider adding image compression for optimization
