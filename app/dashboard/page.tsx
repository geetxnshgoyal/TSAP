'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import {
    Terminal, LogOut, Link2, TrendingUp, Flame,
    Calendar, Code2, Award, BarChart3, Users, Zap, ArrowLeft, Mail
} from 'lucide-react';
import { getCodeforcesStats, getCodeforcesRatingColor, getCodeforcesSubmissions } from '@/lib/api/codeforces';
import { getCodeChefStats, getCodeChefRatingColor } from '@/lib/api/codechef';
import { getLeetCodeStats } from '@/lib/api/leetcode';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Real-time listener for current user data
                const userRef = doc(db, 'users', firebaseUser.uid);
                const unsubDoc = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        setUser({
                            id: firebaseUser.uid,
                            ...userData,
                            joinedAt: userData.joinedAt?.toDate?.() || new Date(userData.joinedAt)
                        } as User);
                    }
                    setLoading(false);
                });
                return () => unsubDoc();
            } else {
                router.push('/');
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen grid-bg flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) return null;

    if (user.role === 'mentor' || user.role === 'admin') {
        return <MentorDashboard user={user} />;
    }

    return <MemberDashboard user={user} setUser={setUser} />;
}

// ==========================================
// MENTOR DASHBOARD
// ==========================================
function MentorDashboard({ user }: { user: User }) {
    const router = useRouter();
    const [pendingUsers, setPendingUsers] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalSolved: 0,
        activeToday: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time listener for ALL users
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pending: any[] = [];
            let approvedCount = 0;
            let totalProbs = 0;

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.role === 'member') {
                    // Check for pending approval
                    if (data.approved === false) {
                        pending.push({ id: docSnap.id, ...data });
                    } else {
                        // Count approved members
                        approvedCount++;
                        // Calculate stats
                        const userProbs =
                            (data.platforms?.leetcode?.problemsSolved || 0) +
                            (data.platforms?.codeforces?.problemsSolved || 0) +
                            (data.platforms?.codechef?.problemsSolved || 0);
                        totalProbs += userProbs;
                    }
                }
            });

            setPendingUsers(pending);
            setStats({
                totalMembers: approvedCount,
                totalSolved: totalProbs,
                activeToday: 0 // Placeholder
            });
            setLoading(false);
        }, (error) => {
            console.error("Error fetching mentor data:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (userId: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                approved: true
            });
            // No need to manually update state, onSnapshot will handle it!
            alert("User approved successfully!");
        } catch (error) {
            console.error("Error approving user:", error);
            alert("Failed to approve user");
        }
    };

    const handleLogout = async () => {
        await auth.signOut();
    };

    return (
        <div className="min-h-screen grid-bg">
            <header className="border-b border-terminal-border bg-terminal-surface/50 backdrop-blur-lg sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Terminal className="w-8 h-8 text-terminal-secondary" />
                        <div>
                            <h1 className="text-2xl font-bold gradient-text">TSAP <span className="text-xs px-2 py-0.5 rounded bg-terminal-secondary/10 text-terminal-secondary border border-terminal-secondary/20 ml-2 tracking-wider">MENTOR</span></h1>
                            <p className="text-xs text-terminal-muted">Administration Console</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <a href="/profile" className="hidden md:block text-right hover:opacity-80 transition-opacity group">
                            <p className="font-medium text-gray-100 group-hover:text-terminal-primary transition-colors">{user.name}</p>
                            <p className="text-xs text-terminal-muted">Mentor</p>
                        </a>
                        <button onClick={handleLogout} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Logout">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-terminal-primary/20 blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="card glass p-6 border-l-4 border-l-terminal-primary relative bg-terminal-surface/60">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-terminal-muted text-xs uppercase font-bold tracking-wider">Total Members</p>
                                    <h3 className="text-4xl font-bold text-white mt-2">{stats.totalMembers}</h3>
                                </div>
                                <div className="p-3 bg-terminal-primary/20 rounded-xl text-terminal-primary shadow-lg shadow-terminal-primary/10">
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="card glass p-6 border-l-4 border-l-yellow-500 relative bg-terminal-surface/60">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-terminal-muted text-xs uppercase font-bold tracking-wider">Pending Requests</p>
                                    <h3 className="text-4xl font-bold text-yellow-500 mt-2">{pendingUsers.length}</h3>
                                </div>
                                <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-500 shadow-lg shadow-yellow-500/10">
                                    <Zap className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-0 bg-terminal-accent/20 blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="card glass p-6 border-l-4 border-l-terminal-accent relative bg-terminal-surface/60">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-terminal-muted text-xs uppercase font-bold tracking-wider">Problems Solved</p>
                                    <h3 className="text-4xl font-bold text-terminal-accent mt-2">{stats.totalSolved}</h3>
                                </div>
                                <div className="p-3 bg-terminal-accent/20 rounded-xl text-terminal-accent shadow-lg shadow-terminal-accent/10">
                                    <Code2 className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Pending Approvals */}
                    <div className="lg:col-span-2">
                        <div className="card glass min-h-[400px] flex flex-col">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-terminal-border/50">
                                <h3 className="text-xl font-bold text-white flex items-center">
                                    <div className="p-1.5 rounded bg-yellow-500/10 mr-3 border border-yellow-500/20">
                                        <Users className="w-5 h-5 text-yellow-500" />
                                    </div>
                                    Pending Approvals
                                    {pendingUsers.length > 0 && (
                                        <span className="ml-3 text-xs bg-yellow-500 text-black font-bold px-2 py-0.5 rounded-full">
                                            {pendingUsers.length}
                                        </span>
                                    )}
                                </h3>
                            </div>

                            {loading ? (
                                <div className="flex-1 flex items-center justify-center"><div className="spinner"></div></div>
                            ) : pendingUsers.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-terminal-muted border-2 border-dashed border-terminal-border/50 rounded-xl m-4 bg-terminal-surface/30">
                                    <Zap className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="font-medium">No pending requests</p>
                                    <p className="text-xs mt-1">New member signups will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingUsers.map(req => (
                                        <div key={req.id} className="bg-terminal-surface/50 border border-terminal-border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:border-terminal-primary/50 transition-all hover:shadow-lg hover:shadow-terminal-primary/5 group">
                                            <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center font-bold text-xl border border-gray-600">
                                                    {req.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white group-hover:text-terminal-primary transition-colors">{req.name}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-terminal-muted mt-1">
                                                        <span className="flex items-center hover:text-white transition-colors"><Mail className="w-3 h-3 mr-1" />{req.email}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="bg-terminal-border/50 px-1.5 py-0.5 rounded text-gray-400">Batch {req.batch || 'N/A'}</span>
                                                        <span className="bg-terminal-border/50 px-1.5 py-0.5 rounded text-gray-400">{req.rollNumber || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleApprove(req.id)}
                                                className="w-full sm:w-auto bg-green-500 text-black font-bold border border-green-400 px-6 py-2.5 rounded-lg hover:bg-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all flex items-center justify-center"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-6">
                        <div className="card glass border-t-4 border-t-terminal-secondary">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                                <Zap className="w-5 h-5 mr-3 text-terminal-secondary" />
                                Quick Actions
                            </h3>
                            <button
                                onClick={() => router.push('/leaderboard')}
                                className="w-full group bg-terminal-surface hover:bg-terminal-surface/80 border border-terminal-border hover:border-terminal-primary p-4 rounded-xl flex items-center justify-between transition-all mb-4"
                            >
                                <div className="flex items-center">
                                    <div className="p-2 rounded-lg bg-terminal-primary/10 text-terminal-primary mr-4 group-hover:scale-110 transition-transform">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block font-bold text-gray-200">View All Members</span>
                                        <span className="text-xs text-terminal-muted">Check leaderboard & stats</span>
                                    </div>
                                </div>
                                <ArrowLeft className="w-4 h-4 text-terminal-muted rotate-180 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => router.push('/analytics')}
                                className="w-full group bg-terminal-surface hover:bg-terminal-surface/80 border border-terminal-border hover:border-terminal-accent p-4 rounded-xl flex items-center justify-between transition-all"
                            >
                                <div className="flex items-center">
                                    <div className="p-2 rounded-lg bg-terminal-accent/10 text-terminal-accent mr-4 group-hover:scale-110 transition-transform">
                                        <BarChart3 className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block font-bold text-gray-200">Club Analytics</span>
                                        <span className="text-xs text-terminal-muted">Overview of club performance</span>
                                    </div>
                                </div>
                                <ArrowLeft className="w-4 h-4 text-terminal-muted rotate-180 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// ==========================================
// MEMBER DASHBOARD
// ==========================================
function MemberDashboard({ user, setUser }: { user: User, setUser: (u: User) => void }) {
    const router = useRouter();
    const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
    const [connectModal, setConnectModal] = useState<{ platform: string; name: string } | null>(null);
    const [usernameInput, setUsernameInput] = useState('');
    const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);

    useEffect(() => {
        const fetchActivity = async () => {
            if (user?.platforms?.codeforces?.connected && user.platforms.codeforces.username) {
                try {
                    const subs = await getCodeforcesSubmissions(user.platforms.codeforces.username);
                    // Format and take top 5
                    const formatted = subs.slice(0, 5).map(sub => ({
                        id: sub.id,
                        platform: 'codeforces',
                        problem: sub.problem.name,
                        verdict: sub.verdict === 'OK' ? 'Accepted' : 'Wrong Answer',
                        timestamp: sub.creationTimeSeconds * 1000,
                        url: `https://codeforces.com/contest/${sub.problem.contestId}/problem/${sub.problem.index}`
                    }));
                    setRecentSubmissions(formatted);
                } catch (e) {
                    console.error("Failed to fetch submissions", e);
                }
            }
        };
        fetchActivity();
    }, [user]);

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/');
    };

    const handleConnectPlatform = (platform: 'leetcode' | 'codeforces' | 'codechef') => {
        const platformNames = {
            leetcode: 'LeetCode',
            codeforces: 'Codeforces',
            codechef: 'CodeChef'
        };
        setConnectModal({ platform, name: platformNames[platform] });
        setUsernameInput('');
    };

    const handleSubmitConnection = async () => {
        if (!usernameInput.trim() || !connectModal || !user) {
            alert('Please enter a valid username');
            return;
        }

        setConnectingPlatform(connectModal.platform);

        try {
            let platformData;

            // If Codeforces, fetch real stats from API
            if (connectModal.platform === 'codeforces') {
                const stats = await getCodeforcesStats(usernameInput.trim());

                if (!stats) {
                    alert(`❌ Could not find Codeforces user "${usernameInput.trim()}". Please check the username and try again.`);
                    setConnectingPlatform(null);
                    return;
                }

                platformData = {
                    username: usernameInput.trim(),
                    connected: true,
                    problemsSolved: stats.solvedProblems,
                    rating: stats.rating,
                    rank: stats.rank,
                    maxRating: stats.maxRating,
                    maxRank: stats.maxRank,
                    lastSynced: new Date(),
                };
            } else if (connectModal.platform === 'codechef') {
                // Fetch real stats from CodeChef profile
                const stats = await getCodeChefStats(usernameInput.trim());

                if (!stats) {
                    alert(`❌ Could not find CodeChef user "${usernameInput.trim()}". Please check the username and try again.`);
                    setConnectingPlatform(null);
                    return;
                }

                platformData = {
                    username: usernameInput.trim(),
                    connected: true,
                    problemsSolved: stats.problemsSolved,
                    rating: stats.rating,
                    rank: stats.rank,
                    stars: stats.stars,
                    lastSynced: new Date(),
                };
            } else if (connectModal.platform === 'leetcode') {
                // Fetch real stats from LeetCode
                const stats = await getLeetCodeStats(usernameInput.trim());

                if (!stats) {
                    alert(`❌ Could not find LeetCode user "${usernameInput.trim()}". Please check the username and try again.`);
                    setConnectingPlatform(null);
                    return;
                }

                platformData = {
                    username: usernameInput.trim(),
                    connected: true,
                    problemsSolved: stats.problemsSolved,
                    ranking: stats.ranking,
                    easySolved: stats.easySolved,
                    mediumSolved: stats.mediumSolved,
                    hardSolved: stats.hardSolved,
                    lastSynced: new Date(),
                };
            } else {
                return;
            }

            // Save to Firestore
            await updateDoc(doc(db, 'users', user.id), {
                [`platforms.${connectModal.platform}`]: platformData,
            });

            // Update local state - onSnapshot in parent will likely handle this too, 
            // but for immediate feedback in this component context (if not using parent snapshot):
            // Actually, because we added onSnapshot to the parent component default export,
            // 'user' prop will update automatically! We don't need manual setUser here as much,
            // but it's safe to keep for immediate feedback.

            // Close modal
            setConnectModal(null);
            setUsernameInput('');
        } catch (error) {
            console.error('Error connecting platform:', error);
            alert('❌ Failed to connect platform. Please try again.');
        } finally {
            setConnectingPlatform(null);
        }
    };

    const totalPlatformProblems =
        (user.platforms.leetcode?.problemsSolved || 0) +
        (user.platforms.codeforces?.problemsSolved || 0) +
        (user.platforms.codechef?.problemsSolved || 0);

    return (
        <div className="min-h-screen grid-bg">
            {/* Header */}
            <header className="border-b border-terminal-border bg-terminal-surface/50 backdrop-blur-lg sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Terminal className="w-8 h-8 text-terminal-primary" />
                        <div>
                            <h1 className="text-2xl font-bold gradient-text">TSAP</h1>
                            <p className="text-xs text-terminal-muted">Turing Society of Algorithmic Programmers</p>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center space-x-6">
                        <NavLink href="/dashboard" active>Dashboard</NavLink>
                        <NavLink href="/leaderboard">Leaderboard</NavLink>
                        <NavLink href="/analytics">Analytics</NavLink>
                    </nav>

                    <div className="flex items-center space-x-4">
                        <a href="/profile" className="hidden md:block text-right hover:opacity-80 transition-opacity group">
                            <p className="font-medium text-gray-100 group-hover:text-terminal-primary transition-colors">{user.name}</p>
                            <p className="text-xs text-terminal-muted">{user.email}</p>
                        </a>
                        <button onClick={handleLogout} className="btn-ghost" title="Logout">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-8">
                {/* Welcome Section */}
                <div className="card glass">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-100">
                                Welcome back, {user.name.split(' ')[0]}! 👋
                            </h2>
                            <p className="text-terminal-muted mt-1">
                                {user.rollNumber && `${user.rollNumber} • `}
                                {user.batch && `Batch ${user.batch} • `}
                                Member since {new Date(user.joinedAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="text-center">
                                <p className="text-4xl font-bold gradient-text">{totalPlatformProblems}</p>
                                <p className="text-sm text-terminal-muted">Total Problems</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={<Code2 className="w-8 h-8" />}
                        label="Weekly Problems"
                        value={user.stats.weeklyProblems || 0}
                        color="primary"
                        trend="+12%"
                    />
                    <StatCard
                        icon={<Flame className="w-8 h-8" />}
                        label="Current Streak"
                        value={`${user.stats.currentStreak || 0} days`}
                        color="accent"
                        subtext={`Max: ${user.stats.maxStreak || 0} days`}
                    />
                    <StatCard
                        icon={<Calendar className="w-8 h-8" />}
                        label="Monthly Problems"
                        value={user.stats.monthlyProblems || 0}
                        color="secondary"
                    />
                    <StatCard
                        icon={<Award className="w-8 h-8" />}
                        label="Total Solved"
                        value={totalPlatformProblems}
                        color="primary"
                        subtext={`E: ${user.stats.easyProblems} M: ${user.stats.mediumProblems} H: ${user.stats.hardProblems}`}
                    />
                </div>

                {/* Platform Connections & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Connections */}
                    <div className="lg:col-span-2">
                        <div className="card h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-100">Platform Connections</h3>
                                <Link2 className="w-6 h-6 text-terminal-primary" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <PlatformCard
                                    name="LeetCode"
                                    platform="leetcode"
                                    connected={!!user.platforms.leetcode?.connected}
                                    username={user.platforms.leetcode?.username}
                                    problemsSolved={user.platforms.leetcode?.problemsSolved}
                                    rating={user.platforms.leetcode?.rating}
                                    onConnect={() => handleConnectPlatform('leetcode')}
                                    loading={connectingPlatform === 'leetcode'}
                                />
                                <PlatformCard
                                    name="Codeforces"
                                    platform="codeforces"
                                    connected={!!user.platforms.codeforces?.connected}
                                    username={user.platforms.codeforces?.username}
                                    problemsSolved={user.platforms.codeforces?.problemsSolved}
                                    rating={user.platforms.codeforces?.rating}
                                    rank={user.platforms.codeforces?.rank}
                                    onConnect={() => handleConnectPlatform('codeforces')}
                                    loading={connectingPlatform === 'codeforces'}
                                />
                                <PlatformCard
                                    name="CodeChef"
                                    platform="codechef"
                                    connected={!!user.platforms.codechef?.connected}
                                    username={user.platforms.codechef?.username}
                                    problemsSolved={user.platforms.codechef?.problemsSolved}
                                    rating={user.platforms.codechef?.rating}
                                    onConnect={() => handleConnectPlatform('codechef')}
                                    loading={connectingPlatform === 'codechef'}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Side Panel */}
                    <div className="lg:col-span-1">
                        <div className="card h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-100">Recent Activity</h3>
                                <TrendingUp className="w-5 h-5 text-terminal-accent" />
                            </div>

                            <div className="flex-1 space-y-4">
                                {recentSubmissions.length > 0 ? (
                                    recentSubmissions.map((sub) => (
                                        <a
                                            key={sub.id}
                                            href={sub.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block p-3 rounded-lg bg-terminal-surface border border-terminal-border hover:border-terminal-primary/50 transition-colors group"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                                    Codeforces
                                                </span>
                                                <span className="text-xs text-terminal-muted">
                                                    {new Date(sub.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h4 className="font-medium text-gray-200 group-hover:text-terminal-primary transition-colors truncate">
                                                {sub.problem}
                                            </h4>
                                            <div className={`text-xs mt-1 ${sub.verdict === 'Accepted' ? 'text-green-400' : 'text-red-400'}`}>
                                                {sub.verdict}
                                            </div>
                                        </a>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-terminal-muted">
                                        <p>No recent activity found.</p>
                                        <p className="text-xs mt-1">Connect platforms to track submissions.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <QuickLinkCard
                        icon={<Users />}
                        title="Leaderboard"
                        description="See how you rank against other members"
                        href="/leaderboard"
                        color="primary"
                    />
                    <QuickLinkCard
                        icon={<BarChart3 />}
                        title="Analytics"
                        description="View your detailed progress analytics"
                        href="/analytics"
                        color="secondary"
                    />
                    <QuickLinkCard
                        icon={<TrendingUp />}
                        title="Progress"
                        description="Track your problem-solving journey"
                        href="/progress"
                        color="accent"
                    />
                </div>
            </main>

            {/* Connection Modal */}
            {connectModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="card glass max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold gradient-text">Connect {connectModal.name}</h3>
                            <button
                                onClick={() => setConnectModal(null)}
                                className="text-terminal-muted hover:text-gray-100 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-terminal-muted mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={usernameInput}
                                    onChange={(e) => setUsernameInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSubmitConnection();
                                    }}
                                    placeholder={`Enter your ${connectModal.name} username`}
                                    className="w-full px-4 py-3 bg-terminal-surface border border-terminal-border rounded-lg text-gray-100 placeholder-terminal-muted focus:outline-none focus:border-terminal-primary transition-colors font-mono"
                                    autoFocus
                                />
                                <p className="text-xs text-terminal-muted mt-2">
                                    Your username will be used to fetch your profile and stats
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConnectModal(null)}
                                    className="btn-outline flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitConnection}
                                    disabled={!usernameInput.trim() || connectingPlatform !== null}
                                    className="btn-primary flex-1"
                                >
                                    {connectingPlatform ? (
                                        <div className="spinner mx-auto"></div>
                                    ) : (
                                        <>
                                            <Link2 className="w-4 h-4 mr-2" />
                                            Connect
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function NavLink({ href, children, active = false }: { href: string; children: React.ReactNode; active?: boolean }) {
    return (
        <a
            href={href}
            className={`text-sm font-medium transition-colors ${active ? 'text-terminal-primary' : 'text-gray-400 hover:text-gray-100'
                }`}
        >
            {children}
        </a>
    );
}

function StatCard({
    icon,
    label,
    value,
    color,
    trend,
    subtext
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: 'primary' | 'secondary' | 'accent';
    trend?: string;
    subtext?: string;
}) {
    const colorClass = {
        primary: 'text-terminal-primary',
        secondary: 'text-terminal-secondary',
        accent: 'text-terminal-accent',
    }[color];

    return (
        <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
                <div className={colorClass}>{icon}</div>
                {trend && (
                    <span className="text-xs badge-success">{trend}</span>
                )}
            </div>
            <p className="text-3xl font-bold text-gray-100 mb-1">{value}</p>
            <p className="text-sm text-terminal-muted">{label}</p>
            {subtext && (
                <p className="text-xs text-terminal-muted mt-2">{subtext}</p>
            )}
        </div>
    );
}

function PlatformCard({
    name,
    platform,
    connected,
    username,
    problemsSolved,
    rating,
    rank,
    onConnect,
    loading,
}: {
    name: string;
    platform: string;
    connected: boolean;
    username?: string;
    problemsSolved?: number;
    rating?: number;
    rank?: string;
    onConnect: () => void;
    loading: boolean;
}) {
    return (
        <div className={`card-hover ${connected ? 'border-terminal-primary' : ''}`}>
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-100">{name}</h4>
                <span className={`badge platform-${platform}`}>{platform}</span>
            </div>

            {connected ? (
                <div className="space-y-3">
                    <div>
                        <p className="text-sm text-terminal-muted">Username</p>
                        <p className="font-mono text-terminal-primary">@{username}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-xs text-terminal-muted">Problems</p>
                            <p className="text-xl font-bold text-gray-100">{problemsSolved}</p>
                        </div>
                        <div>
                            <p className="text-xs text-terminal-muted">Rating</p>
                            <p className="text-xl font-bold text-terminal-secondary">{rating}</p>
                        </div>
                    </div>
                    {rank && (
                        <div>
                            <p className="text-xs text-terminal-muted">Rank</p>
                            <p className="text-sm font-medium text-terminal-accent">{rank}</p>
                        </div>
                    )}
                    <button className="btn-outline w-full text-sm" disabled>
                        <Link2 className="w-4 h-4 mr-2" />
                        Connected
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-terminal-muted">
                        Connect your {name} account to track your progress
                    </p>
                    <button
                        onClick={onConnect}
                        className="btn-primary w-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="spinner mx-auto"></div>
                        ) : (
                            <>
                                <Link2 className="w-4 h-4 mr-2" />
                                Connect
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

function QuickLinkCard({
    icon,
    title,
    description,
    href,
    color
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
    color: 'primary' | 'secondary' | 'accent';
}) {
    const colorClass = {
        primary: 'text-terminal-primary group-hover:bg-terminal-primary/20',
        secondary: 'text-terminal-secondary group-hover:bg-terminal-secondary/20',
        accent: 'text-terminal-accent group-hover:bg-terminal-accent/20',
    }[color];

    return (
        <a href={href} className="card bg-terminal-surface hover:border-terminal-primary transition-all group block">
            <div className={`p-3 rounded-lg w-fit mb-4 transition-colors ${colorClass.replace('group-hover:', '')} bg-opacity-10 bg-current`}>
                {icon}
            </div>
            <h3 className="text-lg font-bold text-gray-100 mb-2 group-hover:text-terminal-primary transition-colors">{title}</h3>
            <p className="text-sm text-terminal-muted">{description}</p>
        </a>
    );
}
