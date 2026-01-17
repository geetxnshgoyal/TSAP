// Example: Adding Codeforces Connector to Dashboard
// Add this to your app/dashboard/page.tsx

/*
import CodeforcesConnector from '@/components/CodeforcesConnector';
import { doc, updateDoc } from 'firebase/firestore';

// Inside your DashboardPage component:

const handleCodeforcesConnect = async (handle: string, stats: any) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      'platforms.codeforces': {
        handle,
        rating: stats.rating,
        maxRating: stats.maxRating,
        rank: stats.rank,
        maxRank: stats.maxRank,
        totalProblems: stats.totalProblems,
        currentStreak: stats.currentStreak,
        maxStreak: stats.maxStreak,
        problemsByRating: stats.problemsByRating,
        problemsByTag: stats.problemsByTag,
        lastUpdated: new Date(),
      },
      // Also update combined stats
      'stats.totalProblems': stats.totalProblems,
      'stats.currentStreak': stats.currentStreak,
      'stats.maxStreak': stats.maxStreak,
    });
    
    // Refresh user data
    await fetchUserData();
    
    alert('Codeforces account connected successfully!');
  } catch (error) {
    console.error('Error connecting Codeforces:', error);
    throw error;
  }
};

// In your JSX, add this section:

<div className="mb-8">
  <h2 className="text-2xl font-bold mb-6">Connect Platforms</h2>
  <div className="grid gap-6">
    <CodeforcesConnector
      onConnect={handleCodeforcesConnect}
      currentHandle={user.platforms?.codeforces?.handle}
    />
    
    {/* You can add more platform connectors here * /}
  </div>
</div>

{/* Display Codeforces Stats if connected * /}
{user.platforms?.codeforces && (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-6">Codeforces Stats</h2>
    <div className="grid md:grid-cols-3 gap-6">
      <div className="card glass">
        <p className="text-terminal-muted mb-1">Current Rating</p>
        <p className="text-3xl font-bold text-terminal-primary">
          {user.platforms.codeforces.rating || 'Unrated'}
        </p>
        <p className="text-sm text-terminal-muted">
          Max: {user.platforms.codeforces.maxRating || 'N/A'}
        </p>
      </div>
      
      <div className="card glass">
        <p className="text-terminal-muted mb-1">Rank</p>
        <p className="text-2xl font-bold capitalize text-terminal-secondary">
          {user.platforms.codeforces.rank || 'Unrated'}
        </p>
        <p className="text-sm text-terminal-muted">
          Peak: {user.platforms.codeforces.maxRank || 'N/A'}
        </p>
      </div>
      
      <div className="card glass">
        <p className="text-terminal-muted mb-1">Problems Solved</p>
        <p className="text-3xl font-bold text-terminal-accent">
          {user.platforms.codeforces.totalProblems || 0}
        </p>
        <p className="text-sm text-terminal-muted">
          Streak: {user.platforms.codeforces.currentStreak || 0} days
        </p>
      </div>
    </div>
  </div>
)}

*/

// Quick Test Function
export async function testCodeforcesAPI() {
    const { getCodeforcesUser, getCodeforcesSubmissions, calculateCodeforcesStats } =
        await import('@/lib/codeforces');

    // Test with a well-known user
    const user = await getCodeforcesUser('tourist');
    console.log('User:', user);

    const submissions = await getCodeforcesSubmissions('tourist', 100);
    console.log('Submissions count:', submissions.length);

    const stats = calculateCodeforcesStats(submissions);
    console.log('Stats:', stats);

    return { user, submissions, stats };
}
