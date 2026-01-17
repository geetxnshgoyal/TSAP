'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LeaderboardEntry } from '@/types';
import { Trophy, Medal, Award, TrendingUp, Flame, Code2, Users, Crown, Sparkles } from 'lucide-react';

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'all' | 'monthly' | 'weekly'>('all');

    useEffect(() => {
        loadLeaderboard();
    }, [timeframe]);

    const loadLeaderboard = async () => {
        setLoading(true);
        try {
            const usersQuery = query(collection(db, 'users'));
            const snapshot = await getDocs(usersQuery);

            const entries: LeaderboardEntry[] = snapshot.docs
                .map((doc) => {
                    const data = doc.data();

                    // Skip if not member or not approved
                    if (data.role !== 'member' || !data.approved) return null;

                    const totalProblems =
                        (data.platforms?.leetcode?.problemsSolved || 0) +
                        (data.platforms?.codeforces?.problemsSolved || 0) +
                        (data.platforms?.codechef?.problemsSolved || 0);

                    // Calculate average rating only from connected platforms
                    let ratingSum = 0;
                    let ratingCount = 0;
                    if (data.platforms?.leetcode?.rating) { ratingSum += data.platforms.leetcode.rating; ratingCount++; }
                    if (data.platforms?.codeforces?.rating) { ratingSum += data.platforms.codeforces.rating; ratingCount++; }
                    if (data.platforms?.codechef?.rating) { ratingSum += data.platforms.codechef.rating; ratingCount++; }

                    const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;

                    return {
                        userId: doc.id,
                        user: {
                            name: data.name || 'Anonymous',
                            photoURL: data.photoURL,
                            batch: data.batch,
                            rollNumber: data.rollNumber
                        },
                        rank: 0, // Calculated later
                        totalProblems,
                        weeklyProblems: data.stats?.weeklyProblems || 0,
                        monthlyProblems: data.stats?.monthlyProblems || 0,
                        currentStreak: data.stats?.currentStreak || 0,
                        averageRating: Math.floor(avgRating),
                        platforms: {
                            leetcode: data.platforms?.leetcode?.problemsSolved || 0,
                            codeforces: data.platforms?.codeforces?.problemsSolved || 0,
                            codechef: data.platforms?.codechef?.problemsSolved || 0,
                        },
                    };
                })
                .filter(entry => entry !== null) as LeaderboardEntry[];

            // Sort based on timeframe
            const sortedEntries = entries.sort((a, b) => {
                if (timeframe === 'weekly') return b.weeklyProblems - a.weeklyProblems;
                if (timeframe === 'monthly') return b.monthlyProblems - a.monthlyProblems;
                // Default tie-breakers for all time: Problems -> Rating -> Streak
                if (b.totalProblems !== a.totalProblems) return b.totalProblems - a.totalProblems;
                return b.averageRating - a.averageRating;
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
            <header className="border-b border-terminal-border bg-terminal-surface/50 backdrop-blur-lg sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Trophy className="w-8 h-8 text-terminal-accent" />
                        <div>
                            <h1 className="text-2xl font-bold gradient-text">Leaderboard</h1>
                            <p className="text-xs text-terminal-muted">Top Programmers of T.S.A.P</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Timeframe Selector */}
                <div className="flex justify-center mb-12">
                    <div className="bg-terminal-surface border border-terminal-border p-1 rounded-lg flex space-x-1">
                        {['all', 'monthly', 'weekly'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t as any)}
                                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${timeframe === t
                                    ? 'bg-terminal-primary text-white shadow-lg'
                                    : 'text-terminal-muted hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {t === 'all' ? 'All Time' : t === 'monthly' ? 'This Month' : 'This Week'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <>
                        {/* Podium Section */}
                        {leaderboard.length >= 3 && (
                            <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-16 relative">
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-terminal-primary/5 to-transparent blur-3xl pointer-events-none"></div>
                                {/* 2nd Place */}
                                <div className="order-2 md:order-1 w-full md:w-1/3 max-w-[280px]">
                                    <PodiumCard entry={leaderboard[1]} rank={2} />
                                </div>
                                {/* 1st Place */}
                                <div className="order-1 md:order-2 w-full md:w-1/3 max-w-[300px] z-10 -translate-y-4">
                                    <PodiumCard entry={leaderboard[0]} rank={1} />
                                </div>
                                {/* 3rd Place */}
                                <div className="order-3 md:order-3 w-full md:w-1/3 max-w-[280px]">
                                    <PodiumCard entry={leaderboard[2]} rank={3} />
                                </div>
                            </div>
                        )}

                        {/* List Header */}
                        <div className="hidden md:flex items-center px-6 py-3 text-xs font-bold text-terminal-muted uppercase tracking-wider border-b border-terminal-border bg-terminal-surface/30 rounded-t-lg">
                            <div className="w-16 text-center">Rank</div>
                            <div className="flex-1">Member</div>
                            <div className="w-24 text-center">Problems</div>
                            <div className="w-24 text-center">Streak</div>
                            <div className="w-24 text-center">Rating</div>
                        </div>

                        {/* Full List (skip top 3 if showing podium, otherwise show all if small count) */}
                        <div className="bg-terminal-surface/20 border border-terminal-border rounded-b-lg divide-y divide-terminal-border overflow-hidden">
                            {leaderboard.slice(leaderboard.length >= 3 ? 3 : 0).map((entry) => (
                                <LeaderboardRow key={entry.userId} entry={entry} />
                            ))}
                            {leaderboard.length === 0 && (
                                <div className="py-12 text-center text-terminal-muted">
                                    No members found for this period.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

import Link from 'next/link';

// ... (existing imports)

// ... (LeaderboardPage component remains mostly same, just updating Subcomponents)

function PodiumCard({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
    const isGold = rank === 1;
    const isSilver = rank === 2;
    const isBronze = rank === 3;

    // Colors
    const borderColor = isGold ? 'border-yellow-500/50' : isSilver ? 'border-gray-400/50' : 'border-orange-700/50';
    const textColor = isGold ? 'text-yellow-400' : isSilver ? 'text-gray-300' : 'text-orange-400';
    const bgColor = isGold ? 'bg-yellow-500/10' : isSilver ? 'bg-gray-400/10' : 'bg-orange-700/10';
    const heightClass = isGold ? 'h-[320px]' : isSilver ? 'h-[280px]' : 'h-[260px]';
    const glowClass = isGold ? 'shadow-[0_0_30px_rgba(234,179,8,0.2)]' : '';

    return (
        <Link
            href={`/profile/${entry.userId}`}
            className={`relative flex flex-col items-center justify-end ${heightClass} ${bgColor} border ${borderColor} rounded-t-2xl p-6 backdrop-blur-sm ${glowClass} transition-transform hover:-translate-y-2 cursor-pointer group`}
        >
            {/* Crown for first place */}
            {isGold && <Crown className="w-12 h-12 text-yellow-500 absolute -top-14 animate-bounce" />}

            {/* Rank Badge */}
            <div className={`absolute -top-5 w-10 h-10 ${isGold ? 'bg-yellow-500' : isSilver ? 'bg-gray-400' : 'bg-orange-700'} text-black font-bold flex items-center justify-center rounded-full shadow-lg border-2 border-terminal-bg z-20`}>
                {rank}
            </div>

            {/* Avatar Placeholder */}
            <div className={`w-20 h-20 rounded-full border-4 ${isGold ? 'border-yellow-500' : isSilver ? 'border-gray-400' : 'border-orange-700'} bg-terminal-surface flex items-center justify-center text-3xl font-bold mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
                {entry.user.name.charAt(0).toUpperCase()}
            </div>

            {/* Name & Batch */}
            <h3 className="font-bold text-gray-100 text-lg text-center leading-tight mb-1 truncate w-full group-hover:text-terminal-primary transition-colors">{entry.user.name}</h3>
            {entry.user.batch && <p className="text-xs text-terminal-muted mb-4">Batch {entry.user.batch}</p>}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 w-full mt-auto">
                <div className="text-center bg-terminal-bg/50 rounded p-2">
                    <p className={`text-lg font-bold ${textColor}`}>{entry.totalProblems}</p>
                    <p className="text-[10px] text-terminal-muted uppercase">Solved</p>
                </div>
                <div className="text-center bg-terminal-bg/50 rounded p-2">
                    <p className={`text-lg font-bold text-terminal-accent`}>{entry.averageRating > 0 ? entry.averageRating : '-'}</p>
                    <p className="text-[10px] text-terminal-muted uppercase">Rating</p>
                </div>
            </div>

            {/* Platform Pills - Absolute or just small below */}
            <div className="flex gap-1 mt-3 justify-center">
                {(entry.platforms.leetcode || 0) > 0 && <div className="w-2 h-2 rounded-full bg-yellow-500" title="LeetCode Active"></div>}
                {(entry.platforms.codeforces || 0) > 0 && <div className="w-2 h-2 rounded-full bg-blue-500" title="Codeforces Active"></div>}
                {(entry.platforms.codechef || 0) > 0 && <div className="w-2 h-2 rounded-full bg-orange-500" title="CodeChef Active"></div>}
            </div>
        </Link>
    );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
    return (
        <Link
            href={`/profile/${entry.userId}`}
            className="flex flex-col md:flex-row items-center p-4 hover:bg-white/5 transition-colors group cursor-pointer"
        >
            {/* Rank & User Info */}
            <div className="flex items-center w-full md:flex-1 mb-2 md:mb-0">
                <div className="w-16 text-center font-mono font-bold text-terminal-muted group-hover:text-white transition-colors">
                    #{entry.rank}
                </div>

                <div className="flex items-center flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center font-bold text-gray-300 mr-4 shrink-0 group-hover:border-terminal-primary transition-colors">
                        {entry.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-gray-100 truncate group-hover:text-terminal-primary transition-colors">{entry.user.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            {entry.user.batch && (
                                <span className="text-xs text-terminal-muted px-1.5 py-0.5 rounded bg-terminal-border/50">
                                    Batch {entry.user.batch}
                                </span>
                            )}
                            <div className="flex gap-1.5 ml-2">
                                {(entry.platforms.leetcode || 0) > 0 && (
                                    <span className="text-[10px] px-1.5 rounded-sm bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-mono">
                                        LC:{entry.platforms.leetcode}
                                    </span>
                                )}
                                {(entry.platforms.codeforces || 0) > 0 && (
                                    <span className="text-[10px] px-1.5 rounded-sm bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                                        CF:{entry.platforms.codeforces}
                                    </span>
                                )}
                                {(entry.platforms.codechef || 0) > 0 && (
                                    <span className="text-[10px] px-1.5 rounded-sm bg-orange-500/10 text-orange-500 border border-orange-500/20 font-mono">
                                        CC:{entry.platforms.codechef}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Columns */}
            <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-0 md:gap-0 pl-16 md:pl-0">
                <div className="md:w-24 text-center md:text-center flex flex-col md:block items-start md:items-center">
                    <span className="md:hidden text-[10px] text-terminal-muted uppercase">Solved</span>
                    <span className="font-bold text-terminal-primary">{entry.totalProblems}</span>
                </div>
                <div className="md:w-24 text-center md:text-center flex flex-col md:block items-center">
                    <span className="md:hidden text-[10px] text-terminal-muted uppercase">Streak</span>
                    {entry.currentStreak > 0 ? (
                        <div className="flex items-center justify-center text-orange-500 font-bold">
                            <Flame className="w-3 h-3 mr-1" />
                            {entry.currentStreak}
                        </div>
                    ) : (
                        <span className="text-terminal-muted">-</span>
                    )}
                </div>
                <div className="md:w-24 text-center md:text-center flex flex-col md:block items-end md:items-center">
                    <span className="md:hidden text-[10px] text-terminal-muted uppercase">Rating</span>
                    <span className={`font-mono ${entry.averageRating > 0 ? 'text-blue-400' : 'text-terminal-muted'}`}>
                        {entry.averageRating > 0 ? entry.averageRating : '-'}
                    </span>
                </div>
            </div>
        </Link>
    );
}
