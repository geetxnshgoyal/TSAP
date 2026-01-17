'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import {
    Terminal, ArrowLeft, BarChart3, PieChart as PieChartIcon,
    Users, TrendingUp, Code2, Award, Calendar
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export default function AnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{
        totalMembers: number;
        totalSolved: number;
        platformDistribution: { name: string; value: number }[];
        batchPerformance: { name: string; avgSolved: number; total: number }[];
        topPerformers: User[];
    } | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch all members
                try {
                    const q = query(
                        collection(db, 'users'),
                        where('role', '==', 'member'),
                        where('approved', '==', true)
                    );
                    const snapshot = await getDocs(q);

                    let members: User[] = [];
                    let totalSolved = 0;
                    let lc = 0, cf = 0, cc = 0;
                    const batchMap: Record<string, { total: number; count: number }> = {};

                    snapshot.forEach(doc => {
                        const data = doc.data() as User;
                        members.push({ id: doc.id, ...data });

                        const uLc = data.platforms?.leetcode?.problemsSolved || 0;
                        const uCf = data.platforms?.codeforces?.problemsSolved || 0;
                        const uCc = data.platforms?.codechef?.problemsSolved || 0;
                        const uTotal = uLc + uCf + uCc;

                        totalSolved += uTotal;
                        lc += uLc;
                        cf += uCf;
                        cc += uCc;

                        // Batch stats
                        if (data.batch) {
                            if (!batchMap[data.batch]) {
                                batchMap[data.batch] = { total: 0, count: 0 };
                            }
                            batchMap[data.batch].total += uTotal;
                            batchMap[data.batch].count += 1;
                        }
                    });

                    // Process Batch Data
                    const batchPerformance = Object.entries(batchMap).map(([batch, val]) => ({
                        name: `Batch ${batch}`,
                        avgSolved: Math.round(val.total / val.count),
                        total: val.total
                    })).sort((a, b) => b.avgSolved - a.avgSolved);

                    // Top Performers (Client-side sort for now as total calc is complex for query)
                    const topPerformers = members.sort((a, b) => {
                        const totalA = (a.platforms?.leetcode?.problemsSolved || 0) +
                            (a.platforms?.codeforces?.problemsSolved || 0) +
                            (a.platforms?.codechef?.problemsSolved || 0);
                        const totalB = (b.platforms?.leetcode?.problemsSolved || 0) +
                            (b.platforms?.codeforces?.problemsSolved || 0) +
                            (b.platforms?.codechef?.problemsSolved || 0);
                        return totalB - totalA;
                    }).slice(0, 5);

                    setStats({
                        totalMembers: members.length,
                        totalSolved,
                        platformDistribution: [
                            { name: 'LeetCode', value: lc },
                            { name: 'Codeforces', value: cf },
                            { name: 'CodeChef', value: cc },
                        ],
                        batchPerformance,
                        topPerformers
                    });

                } catch (error) {
                    console.error("Error fetching analytics:", error);
                } finally {
                    setLoading(false);
                }

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

    if (!stats) return null;

    const COLORS = ['#eab308', '#3b82f6', '#f97316']; // Yellow (LC), Blue (CF), Orange (CC)

    return (
        <div className="min-h-screen grid-bg">
            <header className="border-b border-terminal-border bg-terminal-surface/50 backdrop-blur-lg sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Terminal className="w-8 h-8 text-terminal-primary" />
                        <div>
                            <h1 className="text-2xl font-bold gradient-text">TSAP</h1>
                            <p className="text-xs text-terminal-muted">Club Analytics</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => router.push('/dashboard')} className="btn-ghost flex items-center">
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card glass p-6 border-l-4 border-l-terminal-primary flex items-center justify-between">
                        <div>
                            <p className="text-terminal-muted text-xs uppercase font-bold tracking-wider">Total Problems Solved</p>
                            <h3 className="text-4xl font-bold text-white mt-2">{stats.totalSolved.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-terminal-primary/20 rounded-xl text-terminal-primary">
                            <Code2 className="w-8 h-8" />
                        </div>
                    </div>
                    <div className="card glass p-6 border-l-4 border-l-terminal-secondary flex items-center justify-between">
                        <div>
                            <p className="text-terminal-muted text-xs uppercase font-bold tracking-wider">Active Members</p>
                            <h3 className="text-4xl font-bold text-white mt-2">{stats.totalMembers}</h3>
                        </div>
                        <div className="p-3 bg-terminal-secondary/20 rounded-xl text-terminal-secondary">
                            <Users className="w-8 h-8" />
                        </div>
                    </div>
                    <div className="card glass p-6 border-l-4 border-l-terminal-accent flex items-center justify-between">
                        <div>
                            <p className="text-terminal-muted text-xs uppercase font-bold tracking-wider">Avg. Problems / Member</p>
                            <h3 className="text-4xl font-bold text-white mt-2">
                                {stats.totalMembers > 0 ? Math.round(stats.totalSolved / stats.totalMembers) : 0}
                            </h3>
                        </div>
                        <div className="p-3 bg-terminal-accent/20 rounded-xl text-terminal-accent">
                            <BarChart3 className="w-8 h-8" />
                        </div>
                    </div>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Platform Distribution */}
                    <div className="card glass">
                        <h3 className="text-xl font-bold text-gray-100 mb-6 flex items-center">
                            <PieChartIcon className="w-5 h-5 mr-2 text-terminal-primary" />
                            Platform Distribution
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.platformDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {stats.platformDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Batch Performance */}
                    <div className="card glass">
                        <h3 className="text-xl font-bold text-gray-100 mb-6 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-terminal-secondary" />
                            Batch Performance (Avg Solved)
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.batchPerformance}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#64748b" />
                                    <YAxis dataKey="name" type="category" width={80} stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                                    />
                                    <Bar dataKey="avgSolved" name="Avg Problems" fill="#c084fc" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Top Performers */}
                <div className="card glass">
                    <h3 className="text-xl font-bold text-gray-100 mb-6 flex items-center">
                        <Award className="w-5 h-5 mr-2 text-yellow-500" />
                        Top Performing Members
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-terminal-border/50 text-terminal-muted text-xs uppercase tracking-wider">
                                    <th className="p-3">Rank</th>
                                    <th className="p-3">Member</th>
                                    <th className="p-3">Batch</th>
                                    <th className="p-3 text-right">Total Solved</th>
                                    <th className="p-3 text-right">LC / CF / CC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.topPerformers.map((member, index) => {
                                    const lc = member.platforms?.leetcode?.problemsSolved || 0;
                                    const cf = member.platforms?.codeforces?.problemsSolved || 0;
                                    const cc = member.platforms?.codechef?.problemsSolved || 0;
                                    const total = lc + cf + cc;

                                    return (
                                        <tr key={member.id} className="border-b border-terminal-border/20 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => router.push(`/profile/${member.id}`)}>
                                            <td className="p-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                                        index === 1 ? 'bg-gray-400/20 text-gray-300' :
                                                            index === 2 ? 'bg-orange-700/20 text-orange-600' :
                                                                'text-terminal-muted'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="p-3 font-medium text-white">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-terminal-surface border border-terminal-border flex items-center justify-center mr-3 text-xs">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    {member.name}
                                                </div>
                                            </td>
                                            <td className="p-3 text-terminal-muted">{member.batch || '-'}</td>
                                            <td className="p-3 text-right font-bold text-terminal-primary">{total}</td>
                                            <td className="p-3 text-right text-xs text-terminal-muted">
                                                <span className="text-yellow-500">{lc}</span> / <span className="text-blue-400">{cf}</span> / <span className="text-orange-500">{cc}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
