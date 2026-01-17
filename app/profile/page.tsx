'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import { Terminal, LogOut, ArrowLeft, Save, User as UserIcon, Mail, Hash, BookOpen, Activity } from 'lucide-react';
import { getCodeforcesTagStats } from '@/lib/api/codeforces';

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
    const [tagStats, setTagStats] = useState<{ name: string; count: number; percentage: number }[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);

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

            const maxCount = sortedStats.length > 0 ? sortedStats[0].count : 1;

            setTagStats(sortedStats.map(s => ({
                ...s,
                percentage: (s.count / maxCount) * 100
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
                                    <p className="text-xs text-terminal-muted mt-1">Email cannot be changed</p>
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
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-100 flex items-center">
                                        <Activity className="w-5 h-5 mr-2 text-terminal-accent" />
                                        Topic Strength Analysis
                                    </h2>
                                    <p className="text-sm text-terminal-muted mt-1">Based on unique solved problems from Codeforces</p>
                                </div>
                                {!user.platforms?.codeforces?.username && (
                                    <span className="text-xs badge-warning">Connect Codeforces to view</span>
                                )}
                            </div>

                            {loadingStats ? (
                                <div className="py-12 flex justify-center">
                                    <div className="spinner"></div>
                                </div>
                            ) : tagStats.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        {/* Summary Cards */}
                                        <div className="bg-terminal-surface rounded-lg p-4 border border-terminal-border">
                                            <p className="text-terminal-muted text-xs uppercase font-bold">Strongest Topic</p>
                                            <p className="text-xl font-bold text-terminal-success">{tagStats[0].name}</p>
                                            <p className="text-xs text-gray-400">{tagStats[0].count} problems solved</p>
                                        </div>
                                        <div className="bg-terminal-surface rounded-lg p-4 border border-terminal-border">
                                            <p className="text-terminal-muted text-xs uppercase font-bold">Diverse Topics</p>
                                            <p className="text-xl font-bold text-terminal-accent">{tagStats.length}</p>
                                            <p className="text-xs text-gray-400">Total unique tags covered</p>
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-bold text-gray-300 mb-3">Topic Breakdown</h3>
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {tagStats.map((tag) => (
                                            <div key={tag.name} className="group">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-sm font-medium text-gray-300 group-hover:text-terminal-primary transition-colors">
                                                        {tag.name}
                                                    </span>
                                                    <span className="text-xs text-terminal-muted">
                                                        {tag.count} problems
                                                    </span>
                                                </div>
                                                <div className="w-full bg-terminal-surface rounded-full h-2.5 overflow-hidden">
                                                    <div
                                                        className={`h-2.5 rounded-full transition-all duration-1000 ${tag.count >= 50 ? 'bg-terminal-success shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                                                                tag.count >= 20 ? 'bg-terminal-primary' :
                                                                    'bg-terminal-secondary'
                                                            }`}
                                                        style={{ width: `${tag.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-terminal-muted bg-terminal-surface/30 rounded-lg border border-dashed border-terminal-border">
                                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    {user.platforms?.codeforces?.username ? (
                                        <p>No solved problems found with tags yet.</p>
                                    ) : (
                                        <p>Connect your Codeforces account on the Dashboard to see your topic strengths!</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
