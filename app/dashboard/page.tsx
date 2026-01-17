'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import {
    Terminal, LogOut, Link2, TrendingUp, Flame,
    Calendar, Code2, Award, BarChart3, Users, Zap
} from 'lucide-react';
import { getCodeforcesStats, getCodeforcesRatingColor, getCodeforcesSubmissions } from '@/lib/api/codeforces';
import { getCodeChefStats, getCodeChefRatingColor } from '@/lib/api/codechef';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUser({
                        id: firebaseUser.uid,
                        ...userData,
                        joinedAt: userData.joinedAt?.toDate?.() || new Date(userData.joinedAt)
                    } as User);
                }
            } else {
                router.push('/');
            }
            setLoading(false);
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
    const [pendingUsers, setPendingUsers] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalSolved: 0,
        activeToday: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all users to calculate stats and find pending ones
                const usersSnap = await getDocs(collection(db, 'users'));
                const pending: any[] = [];
                let approvedCount = 0;
                let totalProbs = 0;

                usersSnap.forEach(docSnap => {
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
            } catch (error) {
                console.error("Error fetching mentor data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleApprove = async (userId: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                approved: true
            });
            // Remove from local state
            setPendingUsers(prev => prev.filter(u => u.id !== userId));
            setStats(prev => ({ ...prev, totalMembers: prev.totalMembers + 1 }));
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
                            <h1 className="text-2xl font-bold gradient-text">TSAP <span className="text-xs px-2 py-0.5 rounded bg-terminal-secondary/20 text-terminal-secondary border border-terminal-secondary/50 ml-2">MENTOR</span></h1>
                            <p className="text-xs text-terminal-muted">Administration Console</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:block text-right">
                            <p className="font-medium text-gray-100">{user.name}</p>
                            <p className="text-xs text-terminal-muted">Mentor</p>
                        </div>
                        <button onClick={handleLogout} className="btn-ghost">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card glass p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-terminal-muted text-sm">Total Members</p>
                                <h3 className="text-3xl font-bold text-white mt-2">{stats.totalMembers}</h3>
                            </div>
                            <div className="p-3 bg-terminal-primary/20 rounded-lg text-terminal-primary">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                    <div className="card glass p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-terminal-muted text-sm">Pending Requests</p>
                                <h3 className="text-3xl font-bold text-yellow-400 mt-2">{pendingUsers.length}</h3>
                            </div>
                            <div className="p-3 bg-yellow-500/20 rounded-lg text-yellow-500">
                                <Zap className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                    <div className="card glass p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-terminal-muted text-sm">Total Problems Solved</p>
                                <h3 className="text-3xl font-bold text-terminal-accent mt-2">{stats.totalSolved}</h3>
                            </div>
                            <div className="p-3 bg-terminal-accent/20 rounded-lg text-terminal-accent">
                                <Code2 className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Pending Approvals */}
                    <div className="lg:col-span-2">
                        <div className="card">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-yellow-400" />
                                Pending Approvals
                            </h3>

                            {loading ? (
                                <div className="text-center py-8"><div className="spinner mx-auto"></div></div>
                            ) : pendingUsers.length === 0 ? (
                                <div className="text-center py-12 text-terminal-muted border-2 border-dashed border-terminal-border rounded-xl">
                                    <p>No pending requests</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingUsers.map(req => (
                                        <div key={req.id} className="bg-terminal-surface border border-terminal-border rounded-lg p-4 flex items-center justify-between hover:border-terminal-primary/50 transition-colors">
                                            <div>
                                                <h4 className="font-bold text-white">{req.name}</h4>
                                                <div className="flex items-center space-x-4 text-xs text-terminal-muted mt-1">
                                                    <span>{req.email}</span>
                                                    <span>•</span>
                                                    <span>{req.rollNumber || 'N/A'}</span>
                                                    <span>•</span>
                                                    <span>Batch {req.batch || 'N/A'}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Joined: {req.joinedAt ? new Date(req.joinedAt?.seconds ? req.joinedAt.seconds * 1000 : req.joinedAt).toLocaleDateString() : 'Unknown'}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleApprove(req.id)}
                                                className="bg-green-500/10 text-green-400 border border-green-500/50 px-4 py-2 rounded-lg hover:bg-green-500/20 transition-colors font-medium text-sm flex items-center"
                                            >
                                                Approve Member
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-6">
                        <div className="card bg-gradient-to-br from-terminal-surface to-terminal-surface/50 border-terminal-secondary/20">
                            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                            <button className="w-full btn-outline mb-3 justify-start">
                                <Users className="w-4 h-4 mr-3" />
                                View All Members
                            </button>
                            <button className="w-full btn-outline mb-3 justify-start">
                                <BarChart3 className="w-4 h-4 mr-3" />
                                Club Analytics
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
            } else {
                // For other platforms, use placeholder data for now
                platformData = {
                    username: usernameInput.trim(),
                    connected: true,
                    problemsSolved: 0,
                    rating: 0,
                    rank: undefined,
                    lastSynced: new Date(),
                };
            }

            // Save to Firestore
            await updateDoc(doc(db, 'users', user.id), {
                [`platforms.${connectModal.platform}`]: platformData,
            });

            // Update local state
            const updatedUser = {
                ...user,
                platforms: {
                    ...user.platforms,
                    [connectModal.platform]: platformData,
                },
            };

            setUser(updatedUser);

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
                        <div className="hidden md:block text-right">
                            <p className="font-medium text-gray-100">{user.name}</p>
                            <p className="text-xs text-terminal-muted">{user.email}</p>
                        </div>
                        <button onClick={handleLogout} className="btn-ghost">
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
                        value={user.stats.totalProblems || 0}
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
                                Connect {name}
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
    color,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
    color: 'primary' | 'secondary' | 'accent';
}) {
    const colorClass = {
        primary: 'text-terminal-primary',
        secondary: 'text-terminal-secondary',
        accent: 'text-terminal-accent',
    }[color];

    return (
        <a href={href} className="card-hover cursor-pointer">
            <div className={`w-12 h-12 rounded-lg bg-terminal-border flex items-center justify-center mb-4 ${colorClass}`}>
                {icon}
            </div>
            <h4 className="text-lg font-bold text-gray-100 mb-2">{title}</h4>
            <p className="text-sm text-terminal-muted">{description}</p>
        </a>
    );
}
