# TSAP - Turing Society of Algorithmic Programmers

**Competitive Programming Club Platform @ NST Bangalore**

A comprehensive web platform for tracking competitive programming progress across multiple platforms, featuring real-time leaderboards, analytics, and AI-powered submission monitoring.

## 🚀 Features

### Phase 1 (Current)
- ✅ **Authentication System** - Secure login/signup with Firebase Auth
- ✅ **Platform Integration** - Connect LeetCode, Codeforces, and CodeChef profiles
- ✅ **Dashboard** - Personal stats, progress tracking, and platform overview
- ✅ **Leaderboard** - Real-time rankings with weekly/monthly/all-time views
- ✅ **Responsive Design** - Beautiful CP-themed UI with terminal aesthetics

### Phase 2 (Upcoming)
- 🔄 **Analytics Page** - Detailed progress charts, heatmaps, and difficulty breakdowns
- 🔄 **Admin Panel** - Mentor dashboard with member analytics and reports
- 🔄 **AI Detection** - Automated plagiarism detection in submissions
- 🔄 **Notifications** - Real-time alerts for achievements and flagged submissions
- 🔄 **API Integration** - Real data sync from CP platforms

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Charts**: Recharts
- **Icons**: Lucide React

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project

### Setup Steps

1. **Clone the repository**
   ```bash
   cd tsap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Copy `.env.local.example` to `.env.local`
   - Add your Firebase credentials:
   
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Firestore Structure

```
users/
  {userId}/
    - email: string
    - name: string
    - rollNumber: string
    - batch: string
    - role: 'member' | 'admin' | 'mentor'
    - joinedAt: timestamp
    - platforms: {
        leetcode?: { username, rating, problemsSolved, ... }
        codeforces?: { username, rating, problemsSolved, ... }
        codechef?: { username, rating, problemsSolved, ... }
      }
    - stats: {
        totalProblems, easyProblems, mediumProblems, hardProblems,
        weeklyProblems, monthlyProblems, currentStreak, maxStreak
      }

submissions/
  {submissionId}/
    - userId: string
    - platform: 'leetcode' | 'codeforces' | 'codechef'
    - problemId: string
    - problemName: string
    - difficulty: 'easy' | 'medium' | 'hard'
    - status: 'accepted' | 'wrong_answer' | ...
    - timestamp: timestamp
    - aiDetectionScore?: number
    - flagged?: boolean

notifications/
  {notificationId}/
    - userId: string
    - type: 'ai_detection' | 'achievement' | 'system'
    - title: string
    - message: string
    - read: boolean
    - timestamp: timestamp
```

## 🎨 Theme & Design

The platform features a **competitive programming-inspired theme**:
- Terminal/Matrix aesthetics
- Monospace fonts (JetBrains Mono)
- Green/Cyan terminal colors
- Code snippet backgrounds
- Animated complexity visualizations
- Glassmorphism effects
- Grid pattern backgrounds

## 🔐 Security Rules (Firestore)

Add these rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /submissions/{submissionId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    
    match /notifications/{notificationId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

## 📱 Pages

- `/` - Login/Signup page
- `/dashboard` - User dashboard with stats and platform connections
- `/leaderboard` - Rankings and competition
- `/analytics` - Personal analytics (coming soon)
- `/admin` - Admin panel for mentors (coming soon)

## 🧑‍💻 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

### Firebase Hosting
```bash
npm run build
firebase init hosting
firebase deploy
```

## 📝 Future Enhancements

- [ ] Real API integrations with LeetCode, Codeforces, CodeChef
- [ ] Advanced analytics with solve rate trends
- [ ] Contests and challenges
- [ ] AI-based problem recommendations
- [ ] Mobile app (React Native)
- [ ] Discord bot integration
- [ ] Export reports as PDF

## 📄 License

MIT License - feel free to use this for your club!

## 👥 Contributors

Built with ❤️ by TSAP @ NST Bangalore

---

**Time Complexity**: O(log n) • **Space Complexity**: O(1) 🚀
