# TSAP Firebase Auth & Platform Integration Guide

## 🎯 What We've Built

### **Complete Authentication System:**
1. **Signup Page** (`/signup`) - Users request access
2. **Login Page** (`/login`) - Approved users sign in  
3. **Mentor Dashboard** (`/mentor`) - Approve/reject user requests
4. **Auth Context** - Manages user state throughout app

### **How It Works:**

#### **New User Flow:**
```
User Signs Up → Account Created (not approved) →  
Mentor Approval Request Created → User Waits →  
Mentor Approves → User Can Log In → Access Dashboard
```

#### **Mentor Approval Flow:**
```
Mentor Logs In → Views Pending Requests →  
Approves/Rejects → User Notified → Approved Users Can Login
```

---

## 📁 Firestore Database Collections

### **1. `users` Collection**
```json
{
  "uid": "firebase-uid",
  "email": "user@example.com",
  "name": "Full Name",
  "college": "NST Bangalore",
  "approved": false,  // Changes to true when mentor approves
  "role": "user",     // Or "mentor"
  "codechef": "username",      // Added when user connects
  "codeforces": "username",    // Added when user connects  
  "leetcode": "username",      // Added when user connects
  "createdAt": "2026-01-17..."
}
```

### **2. `approvalRequests` Collection**
```json
{
  "uid": "firebase-uid",
  "name": "Full Name",
  "email": "user@example.com",
  "college": "NST Bangalore",
  "status": "pending",  // or "approved" or "rejected"
  "requestedAt": "2026-01-17...",
  "approvedAt": "2026-01-17..."  // Optional
}
```

---

## 🚀 Next Steps Required

### **Step 1: Create First Mentor Account**
You need at least one mentor to approve users. Do this in Firebase Console:

1. **Go to:** https://console.firebase.google.com
2. **Navigate to:** Authentication → Users → Add User
3. **Create account** with your email + password
4. **Copy the User UID** (long string like `xYz123AbC...`)
5. **Go to:** Firestore Database → Start Collection
6. **Collection ID:** `users`
7. **Document ID:** Paste the UID from step 4
8. **Fields:**
   ```
   uid: <paste-uid>
   email: your-email@example.com
   name: Your Name
   college: NST Bangalore
   approved: true
   role: mentor
   createdAt: 2026-01-17T14:00:00.000Z
   ```

Now you can log in as a mentor and approve other users!

---

### **Step 2: Remove Dashboard BYPASS Mode**

Currently, the dashboard has `BYPASS_AUTH = true` on line 26. This allows anyone to access without login.

**To enable real authentication:**

1. Open `/app/dashboard/page.tsx`
2. Change line 26 from:
   ```typescript
   const BYPASS_AUTH = true;
   ```
   to:
   ```typescript
   const BYPASS_AUTH = false;
   ```
3. Save and restart dev server

---

### **Step 3: Store Platform Connections in Firestore**

When users connect CodeChef/Codeforces/LeetCode, save to their Firestore document:

**Update `handleSubmitConnection` in dashboard:**
```typescript
// After fetching platform stats, save to Firestore:
await updateDoc(doc(db, 'users', user.uid), {
  [connectModal.platform]: usernameInput.trim()
});
```

This associates the platform username with the user's account permanently.

---

### **Step 4: Fetch & Display Submissions**

Create API routes to fetch recent submissions from each platform and display on dashboard.

**Planned Features:**
- Last 10 submissions
- Weekly submission count
- Problem difficulty breakdown
- Submission streak tracking
- Language usage stats

---

## 🔐 Important: Firestore Security Rules

**Add these rules in Firebase Console → Firestore → Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Only mentors can access approval requests
    match /approvalRequests/{requestId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'mentor';
    }
  }
}
```

---

## 📝 Files Created

| File Path | Purpose |
|-----------|---------|
| `/lib/firebase.ts` | Firebase initialization |
| `/contexts/AuthContext.tsx` | Authentication state management |
| `/app/signup/page.tsx` | User registration page |
| `/app/login/page.tsx` | Login page |
| `/app/mentor/page.tsx` | Mentor approval dashboard |
| `/app/pending-approval/page.tsx` | Waiting for approval screen |
| `/.env.local` | Firebase credentials (DON'T COMMIT!) |

---

## ✅ Testing the System

### **Test Flow:**

1. **Create mentor account** (see Step 1 above)
2. **Sign up a test user** at `/signup`
3. **Try logging in** - should fail (not approved yet)
4. **Log in as mentor** at `/login`
5. **Go to** `/mentor` dashboard
6. **Approve the test user**
7. **Log out mentor**
8. **Log in as test user** - should now work!
9. **Connect platforms** on `/dashboard`

---

## 🎨 Current Status

✅ Firebase configured
✅ Authentication system built
✅ Signup/Login pages created
✅ Mentor approval workflow
✅ Auth context and state management
✅ Environment variables secured

🔲 Need to create first mentor account
🔲 Need to remove BYPASS_AUTH
🔲 Need to save platform connections to Firestore
🔲 Need to build submissions tracking
🔲 Need to add Firestore security rules

---

## 💡 Tips

- The signup page now shows a success message with "Back to Login" button
- Users cannot log in until a mentor approves them
- The mentor dashboard only shows to users with `role: 'mentor'`
- Platform connections (CodeChef/Codeforces/LeetCode) are ready to be stored in Firestore

**Ready to continue? Let me know which step to tackle next!**
