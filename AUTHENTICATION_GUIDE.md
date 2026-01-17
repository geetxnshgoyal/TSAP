# TSAP Dual Login & Codeforces Integration Guide

## 🔐 Authentication System

### Two Portal Types

#### 1. **Member Portal** (Green)
For ordinary students/members:
- **Login**: Email + Password
- **Sign Up**: 
  - Full Name
  - Roll Number (e.g., 21CS01)
  - Batch (e.g., 2021)
  - Email
  - Password
- **Firestore Role**: `member`

#### 2. **Mentor Portal** (Cyan/Blue)
For mentors and admins:
- **Login**: Email + Password
- **Sign Up**:
  - Full Name
  - **Mentor Access Code** (Required: `TSAP2026`)
  - Email
  - Password
- **Firestore Role**: `mentor`

### Security Features
✅ Portal-specific validation (can't login to wrong portal)
✅ Mentor access code verification on signup
✅ Role-based data storage in Firestore
✅ Automatic portal mismatch detection

---

## 🔗 Codeforces API Integration

### Files Created

1. **`/lib/codeforces.ts`** - API utilities
   - `getCodeforcesUser(handle)` - Fetch user profile
   - `getCodeforcesSubmissions(handle, count)` - Fetch submissions  
   - `getCodeforcesRatingHistory(handle)` - Fetch rating changes
   - `calculateCodeforcesStats(submissions)` - Calculate stats

2. **`/components/CodeforcesConnector.tsx`** - UI component
   - Handle input & verification
   - Real-time stats fetching
   - Error handling & success feedback

### How to Use in Dashboard

```tsx
import CodeforcesConnector from '@/components/CodeforcesConnector';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// In your dashboard component:
const handleCodeforcesConnect = async (handle: string, stats: any) => {
  const userRef = doc(db, 'users', user.uid);
  await updateDoc(userRef, {
    'platforms.codeforces': {
      handle,
      ...stats,
      lastUpdated: new Date(),
    },
  });
};

// In JSX:
<CodeforcesConnector 
  onConnect={handleCodeforcesConnect}
  currentHandle={user.platforms?.codeforces?.handle}
/>
```

### API Response Examples

#### User Info
```typescript
{
  handle: "tourist",
  rating: 3918,
  maxRating: 3979,
  rank: "legendary grandmaster",
  maxRank: "legendary grandmaster",
  contribution: 126
}
```

#### Calculated Stats
```typescript
{
  totalProblems: 1245,
  totalSubmissions: 5632,
  acceptedSubmissions: 1876,
  problemsByRating: {
    800: 45,
    1000: 120,
    1200: 230,
    // ...
  },
  problemsByTag: {
    "dp": 156,
    "greedy": 189,
    "graphs": 98,
    // ...
  },
  currentStreak: 15,
  maxStreak: 47
}
```

---

## ⚙️ Setup Instructions

### 1. Enable Firebase Authentication
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (`tsap-4a5cd`)
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Email/Password** authentication
5. Click Save

### 2. Firestore Security Rules (Recommended)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can read/write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Mentors can read all user data
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['mentor', 'admin'];
    }
  }
}
```

### 3. Environment Variables (Optional but Recommended)
Create `/Users/geetanshgoyal/TSAP/.env.local`:
```bash
NEXT_PUBLIC_MENTOR_ACCESS_CODE=TSAP2026
```

Then update `app/page.tsx`:
```typescript
const MENTOR_ACCESS_CODE = process.env.NEXT_PUBLIC_MENTOR_ACCESS_CODE || 'TSAP2026';
```

---

## 🧪 Testing Guide

### Test Member Portal
1. Go to http://localhost:3000
2. Select **Member Portal** (should be default)
3. Click **Sign Up**
4. Fill in: Name, Roll Number, Batch, Email, Password
5. Create account → Should redirect to dashboard with `role: member`

### Test Mentor Portal
1. Select **Mentor Portal** button
2. Click **Sign Up**
3. Fill in: Name, Mentor Code (`TSAP2026`), Email, Password
4. Create account → Should redirect to dashboard with `role: mentor`

### Test Portal Mismatch Protection
1. Create a member account
2. Try logging in via **Mentor Portal**
3. Should show error: "This account is not a mentor account"

### Test Codeforces Integration
```typescript
import { getCodeforcesUser, getCodeforcesSubmissions } from '@/lib/codeforces';

// Example usage:
const user = await getCodeforcesUser('tourist');
console.log(user.rating); // 3918

const submissions = await getCodeforcesSubmissions('tourist', 100);
console.log(submissions.length); // 100
```

---

## 📊 Firestore Structure

```
users/
  {userId}/
    email: string
    name: string
    rollNumber: string | null  // null for mentors
    batch: string | null       // null for mentors
    role: "member" | "mentor" | "admin"
    joinedAt: Timestamp
    platforms: {
      codeforces?: {
        handle: string
        rating: number
        maxRating: number
        rank: string
        totalProblems: number
        currentStreak: number
        maxStreak: number
        lastUpdated: Timestamp
      }
    }
    stats: {
      totalProblems: number
      easyProblems: number
      mediumProblems: number
      hardProblems: number
      weeklyProblems: number
      monthlyProblems: number
      currentStreak: number
      maxStreak: number
    }
```

---

## 🚀 Next Steps

1. **Add other platforms**: LeetCode, CodeChef using similar patterns
2. **Dashboard integration**: Show Codeforces stats on main dashboard
3. **Leaderboard**: Rank users by total problems solved
4. **Auto-sync**: Schedule Cloud Functions to update stats daily
5. **Contest tracking**: Show upcoming Codeforces contests

---

## 🛠️ Troubleshooting

### "Firebase: Error (auth/operation-not-allowed)"
→ Enable Email/Password auth in Firebase Console

### "Codeforces API error: handle: Field should contain only Latin letters, digits, underscore or dash characters"
→ Check the handle spelling (case-sensitive!)

### "User not found on Codeforces"
→ Verify the handle exists at https://codeforces.com/profile/{handle}

### Portal mismatch not working
→ Check Firestore has correct `role` field

---

**Access Codes:**
- **Mentor Portal**: `TSAP2026`
- Change this in production via environment variables!
