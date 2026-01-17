'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import { Terminal, LogOut, ArrowLeft, Save, User as UserIcon, Mail, Hash, BookOpen, Activity, BarChart, PieChart } from 'lucide-react';
import { getCodeforcesTagStats } from '@/lib/api/codeforces';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        rollNumber: '',
        batch: '',
    });

    // Analytics State
    const [tagStats, setTagStats] = useState<{ name: string; count: number; fullMark: number }[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);
    const [chartType, setChartType] = useState<'radar' | 'bar'>('radar');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const fullUser = {
                        id: firebaseUser.uid,
                        ...userData,
                        joinedAt: userData.joinedAt?.toDate?.() || new Date(userData.joinedAt)
                    } as User;

                    setUser(fullUser);
                    setFormData({
                        name: fullUser.name,
                        rollNumber: fullUser.rollNumber || '',
                        batch: fullUser.batch || '',
                    });

                    // Fetch analytics if linked to Codeforces
                    if (fullUser.platforms?.codeforces?.username) {
                        fetchTopicStats(fullUser.platforms.codeforces.username);
                    }
                }
            } else {
                router.push('/');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const fetchTopicStats = async (handle: string) => {
        setLoadingStats(true);
        try {
            const stats = await getCodeforcesTagStats(handle);

            // Convert to array and sort
            const sortedStats = Object.entries(stats)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            const maxCount = sortedStats.length > 0 ? sortedStats[0].count : 100;

            // Format for charts
            // Take top 8 for Radar, Top 15 for Bar
            setTagStats(sortedStats.map(s => ({
                name: s.name.charAt(0).toUpperCase() + s.name.slice(1), // Capitalize
                count: s.count,
                fullMark: maxCount
            })));

        } catch (error) {
            console.error("Failed to fetch topic stats", error);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.id), {
                name: formData.name,
                rollNumber: formData.rollNumber,
                batch: formData.batch,
            });
            alert('Profile updated successfully!');
            setUser(prev => prev ? ({ ...prev, ...formData }) : null);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen grid-bg flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) return null;

    // Data subsets
    const radarData = tagStats.slice(0, 6); // Top 6 skills for neat radar
    const barData = tagStats.slice(0, 10);  // Top 10 for bar chart

    return (
        <div className="min-h-screen grid-bg">
            <header className="border-b border-terminal-border bg-terminal-surface/50 backdrop-blur-lg sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Terminal className="w-8 h-8 text-terminal-primary" />
                        <div>
                            <h1 className="text-2xl font-bold gradient-text">TSAP</h1>
                            <p className="text-xs text-terminal-muted">Profile & Analytics</p>
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

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Edit Profile */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="card glass">
                            <h2 className="text-xl font-bold text-gray-100 mb-6 flex items-center">
                                <UserIcon className="w-5 h-5 mr-2 text-terminal-primary" />
                                Edit Profile
                            </h2>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-terminal-muted mb-1">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <UserIcon className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="input w-full pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-terminal-muted mb-1">Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <input
                                            type="email"
                                            value={user.email}
                                            disabled
                                            className="input w-full pl-10 opacity-50 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-terminal-muted mb-1">Roll Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Hash className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.rollNumber}
                                            onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                                            className="input w-full pl-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-terminal-muted mb-1">Batch</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <BookOpen className="h-4 w-4 text-gray-500" />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.batch}
                                            onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                                            className="input w-full pl-10"
                                        />
                                    </div>
                                </div>

                                <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center">
                                    {saving ? <div className="spinner"></div> : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Strong Topics Analytics */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card glass">
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-100 flex items-center">
                                        <Activity className="w-5 h-5 mr-2 text-terminal-accent" />
                                        Topic Strength Analysis
                                    </h2>
                                    <p className="text-sm text-terminal-muted mt-1">Based on unique solved problems from Codeforces</p>
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
                                            <p className="text-center text-xs text-terminal-muted mt-2">
                                                Top 6 diverse topics show your "Skill Shape"
                                            </p>
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
                                                                index === 0 ? '#22c55e' : // Top 1 -> Green
                                                                    index < 3 ? '#3b82f6' :   // Top 3 -> Blue
                                                                        '#6366f1'                 // Rest -> Indigo
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
                                    {user.platforms?.codeforces?.username ? (
                                        <p>No solved problems with tags found yet.</p>
                                    ) : (
                                        <p>Connect your Codeforces account on the Dashboard to see your topic strengths!</p>
                                    )}
                                </div>
                            )}

                            {/* Stats Summary - Kept for quick numerical reference */}
                            {tagStats.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    <div className="bg-terminal-surface rounded-lg p-3 border border-terminal-border text-center">
                                        <p className="text-terminal-muted text-[10px] uppercase font-bold tracking-wider">Strongest</p>
                                        <p className="text-lg font-bold text-terminal-success truncate px-1">{tagStats[0].name}</p>
                                    </div>
                                    <div className="bg-terminal-surface rounded-lg p-3 border border-terminal-border text-center">
                                        <p className="text-terminal-muted text-[10px] uppercase font-bold tracking-wider">Total Tags</p>
                                        <p className="text-lg font-bold text-terminal-accent">{tagStats.length}</p>
                                    </div>
                                    <div className="bg-terminal-surface rounded-lg p-3 border border-terminal-border text-center">
                                        <p className="text-terminal-muted text-[10px] uppercase font-bold tracking-wider">Top Count</p>
                                        <p className="text-lg font-bold text-gray-100">{tagStats[0].count}</p>
                                    </div>
                                    <div className="bg-terminal-surface rounded-lg p-3 border border-terminal-border text-center">
                                        <p className="text-terminal-muted text-[10px] uppercase font-bold tracking-wider">Weakest (Top 10)</p>
                                        <p className="text-lg font-bold text-red-400 truncate px-1">{tagStats[Math.min(9, tagStats.length - 1)].name}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
