'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LeaderboardEntry } from '@/types';
import { Trophy, Medal, Award, TrendingUp, Flame, Code2 } from 'lucide-react';

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'all' | 'monthly' | 'weekly'>('all');

    useEffect(() => {
        loadLeaderboard();
    }, [timeframe]);

    const loadLeaderboard = async () => {
        try {
            const usersQuery = query(collection(db, 'users'));
            const snapshot = await getDocs(usersQuery);

            const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => {
                const data = doc.data();
                const totalProblems =
                    (data.platforms?.leetcode?.problemsSolved || 0) +
                    (data.platforms?.codeforces?.problemsSolved || 0) +
                    (data.platforms?.codechef?.problemsSolved || 0);

                const avgRating =
                    ((data.platforms?.leetcode?.rating || 0) +
                        (data.platforms?.codeforces?.rating || 0) +
                        (data.platforms?.codechef?.rating || 0)) / 3;

                return {
                    userId: doc.id,
                    user: {
                        name: data.name,
                        photoURL: data.photoURL,
                        batch: data.batch,
                    },
                    rank: index + 1,
                    totalProblems,
                    weeklyProblems: data.stats?.weeklyProblems || 0,
                    monthlyProblems: data.stats?.monthlyProblems || 0,
                    currentStreak: data.stats?.currentStreak || 0,
                    averageRating: Math.floor(avgRating),
                    platforms: {
                        leetcode: data.platforms?.leetcode?.problemsSolved,
                        codeforces: data.platforms?.codeforces?.problemsSolved,
                        codechef: data.platforms?.codechef?.problemsSolved,
                    },
                };
            });

            // Sort based on timeframe
            const sortedEntries = entries.sort((a, b) => {
                if (timeframe === 'weekly') return b.weeklyProblems - a.weeklyProblems;
                if (timeframe === 'monthly') return b.monthlyProblems - a.monthlyProblems;
                return b.totalProblems - a.totalProblems;
            });

            // Update ranks
            sortedEntries.forEach((entry, index) => {
                entry.rank = index + 1;
            });

            setLeaderboard(sortedEntries);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid-bg">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <Trophy className="w-10 h-10 text-terminal-accent" />
                        <h1 className="text-4xl font-bold gradient-text">Leaderboard</h1>
                    </div>
                    <p className="text-terminal-muted">
                        See how you rank against other TSAP members
                    </p>
                </div>

                {/* Timeframe Selector */}
                <div className="card glass mb-8">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setTimeframe('all')}
                            className={`px-4 py-2 rounded-md font-medium transition-all ${timeframe === 'all'
                                    ? 'bg-terminal-primary text-terminal-bg'
                                    : 'bg-terminal-border text-terminal-muted hover:text-gray-100'
                                }`}
                        >
                            All Time
                        </button>
                        <button
                            onClick={() => setTimeframe('monthly')}
                            className={`px-4 py-2 rounded-md font-medium transition-all ${timeframe === 'monthly'
                                    ? 'bg-terminal-primary text-terminal-bg'
                                    : 'bg-terminal-border text-terminal-muted hover:text-gray-100'
                                }`}
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => setTimeframe('weekly')}
                            className={`px-4 py-2 rounded-md font-medium transition-all ${timeframe === 'weekly'
                                    ? 'bg-terminal-primary text-terminal-bg'
                                    : 'bg-terminal-border text-terminal-muted hover:text-gray-100'
                                }`}
                        >
                            This Week
                        </button>
                    </div>
                </div>

                {/* Top 3 Podium */}
                {!loading && leaderboard.length >= 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* 2nd Place */}
                        <div className="order-2 md:order-1">
                            <PodiumCard entry={leaderboard[1]} medal="silver" />
                        </div>
                        {/* 1st Place */}
                        <div className="order-1 md:order-2">
                            <PodiumCard entry={leaderboard[0]} medal="gold" />
                        </div>
                        {/* 3rd Place */}
                        <div className="order-3">
                            <PodiumCard entry={leaderboard[2]} medal="bronze" />
                        </div>
                    </div>
                )}

                {/* Full Leaderboard */}
                <div className="card">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {leaderboard.map((entry, index) => (
                                <LeaderboardRow key={entry.userId} entry={entry} highlight={index < 3} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PodiumCard({ entry, medal }: { entry: LeaderboardEntry; medal: 'gold' | 'silver' | 'bronze' }) {
    const medalColors = {
        gold: 'from-yellow-500 to-amber-600',
        silver: 'from-gray-300 to-gray-500',
        bronze: 'from-orange-700 to-amber-900',
    };

    const medalIcons = {
        gold: '🥇',
        silver: '🥈',
        bronze: '🥉',
    };

    const heights = {
        gold: 'md:h-80',
        silver: 'md:h-64',
        bronze: 'md:h-56',
    };

    return (
        <div className={`card-hover ${heights[medal]} flex flex-col justify-between relative overflow-hidden`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${medalColors[medal]} opacity-5`}></div>
            <div className="relative z-10">
                <div className="text-center mb-4">
                    <div className="text-6xl mb-2">{medalIcons[medal]}</div>
                    <div className="text-2xl font-bold text-terminal-primary">#{entry.rank}</div>
                </div>
                <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-terminal-border flex items-center justify-center mx-auto mb-3 text-3xl">
                        {entry.user.name.charAt(0)}
                    </div>
                    <h3 className="text-xl font-bold text-gray-100 mb-1">{entry.user.name}</h3>
                    {entry.user.batch && (
                        <p className="text-sm text-terminal-muted">Batch {entry.user.batch}</p>
                    )}
                </div>
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-4 pt-4 border-t border-terminal-border">
                <div className="text-center">
                    <p className="text-2xl font-bold text-terminal-primary">{entry.totalProblems}</p>
                    <p className="text-xs text-terminal-muted">Problems</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-terminal-secondary">{entry.currentStreak}</p>
                    <p className="text-xs text-terminal-muted">Streak</p>
                </div>
            </div>
        </div>
    );
}

function LeaderboardRow({ entry, highlight }: { entry: LeaderboardEntry; highlight: boolean }) {
    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
        if (rank === 3) return <Award className="w-5 h-5 text-orange-700" />;
        return <span className="text-terminal-muted font-mono">#{rank}</span>;
    };

    return (
        <div className={`p-4 rounded-lg transition-all hover:bg-terminal-border/50 ${highlight ? 'bg-terminal-primary/5 border border-terminal-primary/20' : ''
            }`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 text-center">
                        {getRankIcon(entry.rank)}
                    </div>

                    <div className="w-12 h-12 rounded-full bg-terminal-border flex items-center justify-center text-lg font-bold">
                        {entry.user.name.charAt(0)}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center space-x-3">
                            <h3 className="font-bold text-gray-100">{entry.user.name}</h3>
                            {entry.user.batch && (
                                <span className="text-xs text-terminal-muted">Batch {entry.user.batch}</span>
                            )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                            {entry.platforms.leetcode && (
                                <span className="text-xs badge platform-leetcode">LC: {entry.platforms.leetcode}</span>
                            )}
                            {entry.platforms.codeforces && (
                                <span className="text-xs badge platform-codeforces">CF: {entry.platforms.codeforces}</span>
                            )}
                            {entry.platforms.codechef && (
                                <span className="text-xs badge platform-codechef">CC: {entry.platforms.codechef}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex items-center space-x-8">
                    <div className="text-center">
                        <div className="flex items-center space-x-1">
                            <Code2 className="w-4 h-4 text-terminal-primary" />
                            <span className="text-xl font-bold text-gray-100">{entry.totalProblems}</span>
                        </div>
                        <p className="text-xs text-terminal-muted">Problems</p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center space-x-1">
                            <Flame className="w-4 h-4 text-terminal-accent" />
                            <span className="text-xl font-bold text-terminal-accent">{entry.currentStreak}</span>
                        </div>
                        <p className="text-xs text-terminal-muted">Streak</p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4 text-terminal-secondary" />
                            <span className="text-xl font-bold text-terminal-secondary">{entry.averageRating}</span>
                        </div>
                        <p className="text-xs text-terminal-muted">Avg Rating</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
