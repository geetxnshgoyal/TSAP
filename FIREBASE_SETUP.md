# Firebase Setup Guide for TSAP

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Enter project name: `tsap-nst` (or your preference)
4. Disable Google Analytics (optional)
5. Click "Create Project"

## Step 2: Register Web App

1. In Firebase Console, click the **Web icon** (`</>`)
2. App nickname: `TSAP Website`
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. **Copy the config object** - you'll need these values

Example config:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "tsap-nst.firebaseapp.com",
  projectId: "tsap-nst",
  storageBucket: "tsap-nst.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 3: Enable Authentication

1. In Firebase Console, go to **Build → Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Click "Email/Password"
5. **Enable** it
6. Click "Save"

## Step 4: Create Firestore Database

1. In Firebase Console, go to **Build → Firestore Database**
2. Click "Create database"
3. Select **Production mode** (we'll add rules next)
4. Choose location: `asia-south1` (Mumbai) or closest to you
5. Click "Enable"

## Step 5: Add Security Rules

1. In Firestore, go to **Rules** tab
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read any user
      allow read: if request.auth != null;
      // Users can only write their own document
      allow write: if request.auth.uid == userId;
    }
    
    // Submissions collection
    match /submissions/{submissionId} {
      // Anyone authenticated can read submissions
      allow read: if request.auth != null;
      // Only create submissions for yourself
      allow create: if request.auth.uid == request.resource.data.userId;
      // Only admins can update (for flagging)
      allow update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      // Only read your own notifications
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      // Only write your own notifications or admins can write any
      allow write: if request.auth.uid == resource.data.userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

3. Click "Publish"

## Step 6: Update .env.local

In your project, open `.env.local` and update with your Firebase config:

```env
# Copy these from Firebase Console
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...your-actual-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tsap-nst.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tsap-nst
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tsap-nst.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Generate a random secret for NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-random-string-here
```

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

## Step 7: Test Authentication

1. **Restart your dev server** if it's running:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Click "Sign Up"

4. Fill in:
   - Name: Your Name
   - Roll Number: 21CS01 (example)
   - Batch: 2021
   - Email: test@nst.edu
   - Password: Test123!

5. Click "Create Account"

6. You should be redirected to the dashboard!

## Step 8: Verify Firestore

1. Go to Firebase Console → Firestore Database
2. You should see a new document in the `users` collection
3. It should contain your user data

## Step 9: Create Admin User (Optional)

1. After creating a regular account, go to Firestore
2. Find your user document
3. Edit it and change `role` from `"member"` to `"admin"`
4. Save
5. Reload the website - you should now see "Admin Panel" in navigation

## Common Issues & Solutions

### Issue: "Firebase: Error (auth/invalid-api-key)"
**Solution**: Make sure you copied the API key correctly and restarted the server

### Issue: "Missing or insufficient permissions"
**Solution**: Check your Firestore security rules are published correctly

### Issue: "Failed to get document because the client is offline"
**Solution**: Check your internet connection and Firebase project is active

### Issue: Environment variables not loading
**Solution**: 
- Restart Next.js dev server
- Make sure `.env.local` is in project root
- Variable names must start with `NEXT_PUBLIC_` for client-side access

## Production Deployment

### For Vercel:
1. Push code to GitHub
2. Import project to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy!

### For Firebase Hosting:
```bash
npm run build
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Firestore Indexes (Add if needed)

For complex queries, you may need composite indexes:

1. Go to Firestore → Indexes
2. Add indexes as Firebase suggests when queries fail
3. Common indexes needed:
   - Collection: `submissions`, Fields: `userId` (Asc), `timestamp` (Desc)
   - Collection: `users`, Fields: `stats.totalProblems` (Desc)

## Next Steps

✅ Firebase project created
✅ Authentication enabled
✅ Firestore database ready
✅ Security rules applied
✅ Environment configured

Now you can:
- Create user accounts
- Connect platform profiles
- View leaderboard rankings
- Track statistics

## Support

If you run into issues:
1. Check Firebase Console logs
2. Check browser console for errors
3. Verify all environment variables
4. Make sure dev server is restarted

---

**You're all set! 🚀 Start building with Firebase!**
