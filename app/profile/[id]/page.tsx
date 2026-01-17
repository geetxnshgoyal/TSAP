'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import { Terminal, ArrowLeft, Mail, BookOpen, Activity, BarChart, PieChart, Star } from 'lucide-react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { getCodeforcesTagStats } from '@/lib/api/codeforces';

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Analytics State
    const [tagStats, setTagStats] = useState<{ name: string; count: number; fullMark: number }[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);
    const [chartType, setChartType] = useState<'radar' | 'bar'>('radar');

    const userId = params.id as string;

    useEffect(() => {
        const fetchUser = async () => {
            if (!userId) return;
            try {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const fullUser = {
                        id: userId,
                        ...userData,
                        joinedAt: userData.joinedAt?.toDate?.() || new Date(userData.joinedAt)
                    } as User;
                    setUser(fullUser);

                    // Fetch stats if Codeforces connected
                    if (fullUser.platforms?.codeforces?.username) {
                        fetchTopicStats(fullUser.platforms.codeforces.username);
                    }
                } else {
                    // User not found
                    setUser(null);
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId]);

    const fetchTopicStats = async (handle: string) => {
        setLoadingStats(true);
        try {
            const stats = await getCodeforcesTagStats(handle);

            const sortedStats = Object.entries(stats)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            const maxCount = sortedStats.length > 0 ? sortedStats[0].count : 100;

            setTagStats(sortedStats.map(s => ({
                name: s.name.charAt(0).toUpperCase() + s.name.slice(1),
                count: s.count,
                fullMark: maxCount
            })));

        } catch (error) {
            console.error("Failed to fetch topic stats", error);
        } finally {
            setLoadingStats(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen grid-bg flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen grid-bg flex flex-col items-center justify-center text-center p-4">
                <div className="text-terminal-muted mb-4">User not found</div>
                <button onClick={() => router.push('/leaderboard')} className="btn-outline">
                    Back to Leaderboard
                </button>
            </div>
        );
    }

    // Data subsets
    const radarData = tagStats.slice(0, 6);
    const barData = tagStats.slice(0, 10);

    const totalProblems =
        (user.platforms.leetcode?.problemsSolved || 0) +
        (user.platforms.codeforces?.problemsSolved || 0) +
        (user.platforms.codechef?.problemsSolved || 0);

    return (
        <div className="min-h-screen grid-bg">
            <header className="border-b border-terminal-border bg-terminal-surface/50 backdrop-blur-lg sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Terminal className="w-8 h-8 text-terminal-primary" />
                        <div>
                            <h1 className="text-2xl font-bold gradient-text">TSAP</h1>
                            <p className="text-xs text-terminal-muted">Profile Viewer</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => router.back()} className="btn-ghost flex items-center">
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: User Info Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="card glass relative overflow-hidden">
                            {/* Decorative background gradient */}
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-terminal-primary/20 to-terminal-secondary/20"></div>

                            <div className="relative pt-8 px-2">
                                <div className="w-24 h-24 mx-auto rounded-full bg-terminal-surface border-4 border-terminal-surface shadow-xl flex items-center justify-center text-3xl font-bold text-gray-100 mb-4">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                                    <div className="flex items-center justify-center gap-2 text-terminal-muted text-sm mt-1">
                                        {user.batch && <span className="bg-white/5 px-2 py-0.5 rounded">Batch {user.batch}</span>}
                                        {user.rollNumber && <span className="bg-white/5 px-2 py-0.5 rounded">{user.rollNumber}</span>}
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-terminal-muted text-xs mt-2">
                                        <Mail className="w-3 h-3" />
                                        {user.email}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-terminal-border pt-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-terminal-primary">{totalProblems}</p>
                                        <p className="text-xs text-terminal-muted uppercase tracking-wider">Problems</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-terminal-accent">{user.stats.currentStreak}</p>
                                        <p className="text-xs text-terminal-muted uppercase tracking-wider">Streak</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Platform Badges */}
                        <div className="space-y-3">
                            {user.platforms.leetcode?.connected && (
                                <div className="card p-4 flex items-center justify-between !bg-terminal-surface/30">
                                    <span className="font-bold text-white">LeetCode</span>
                                    <div className="text-right">
                                        <span className="block text-yellow-500 font-bold">{user.platforms.leetcode.problemsSolved}</span>
                                        <span className="text-xs text-terminal-muted">Solved</span>
                                    </div>
                                </div>
                            )}
                            {user.platforms.codeforces?.connected && (
                                <div className="card p-4 flex items-center justify-between !bg-terminal-surface/30">
                                    <span className="font-bold text-white">Codeforces</span>
                                    <div className="text-right">
                                        <span className="block text-blue-400 font-bold">{user.platforms.codeforces.rating || 'Unrated'}</span>
                                        <span className="text-xs text-terminal-muted">Rating</span>
                                    </div>
                                </div>
                            )}
                            {user.platforms.codechef?.connected && (
                                <div className="card p-4 flex items-center justify-between !bg-terminal-surface/30">
                                    <span className="font-bold text-white">CodeChef</span>
                                    <div className="text-right">
                                        <span className="block text-orange-500 font-bold">{user.platforms.codechef.rating || 'Unrated'}</span>
                                        <span className="text-xs text-terminal-muted">Rating</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Strong Topics Analytics (Same as Private but Read-only) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card glass">
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-100 flex items-center">
                                        <Activity className="w-5 h-5 mr-2 text-terminal-accent" />
                                        Topic Strength Analysis
                                    </h2>
                                    <p className="text-sm text-terminal-muted mt-1">Based on Codeforces solved problems</p>
                                </div>

                                {tagStats.length > 0 && (
                                    <div className="flex bg-terminal-surface rounded-lg p-1 border border-terminal-border">
                                        <button
                                            onClick={() => setChartType('radar')}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center ${chartType === 'radar' ? 'bg-terminal-primary text-white shadow-lg' : 'text-terminal-muted hover:text-white'}`}
                                        >
                                            <PieChart className="w-4 h-4 mr-2" />
                                            Skill Web
                                        </button>
                                        <button
                                            onClick={() => setChartType('bar')}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center ${chartType === 'bar' ? 'bg-terminal-primary text-white shadow-lg' : 'text-terminal-muted hover:text-white'}`}
                                        >
                                            <BarChart className="w-4 h-4 mr-2" />
                                            Top Topics
                                        </button>
                                    </div>
                                )}
                            </div>

                            {loadingStats ? (
                                <div className="py-20 flex justify-center">
                                    <div className="spinner"></div>
                                </div>
                            ) : tagStats.length > 0 ? (
                                <div className="min-h-[400px] w-full flex items-center justify-center bg-terminal-surface/30 rounded-xl border border-white/5 p-4">
                                    {chartType === 'radar' ? (
                                        <div className="w-full h-[400px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                                    <PolarGrid stroke="#334155" />
                                                    <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                                    <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 'bold' }} axisLine={false} />
                                                    <Radar
                                                        name="Problems Solved"
                                                        dataKey="count"
                                                        stroke="#22c55e"
                                                        strokeWidth={2}
                                                        fill="#22c55e"
                                                        fillOpacity={0.4}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                                                        itemStyle={{ color: '#22c55e' }}
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="w-full h-[400px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ReBarChart
                                                    data={barData}
                                                    layout="vertical"
                                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                                                    <XAxis type="number" stroke="#64748b" />
                                                    <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                                                    />
                                                    <Bar dataKey="count" name="Problems Solved" radius={[0, 4, 4, 0]}>
                                                        {barData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={
                                                                index === 0 ? '#22c55e' :
                                                                    index < 3 ? '#3b82f6' :
                                                                        '#6366f1'
                                                            } />
                                                        ))}
                                                    </Bar>
                                                </ReBarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-terminal-muted bg-terminal-surface/30 rounded-lg border border-dashed border-terminal-border">
                                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No topic data available for this user.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
