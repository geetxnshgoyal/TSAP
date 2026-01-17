// Platform types
export type PlatformType = 'leetcode' | 'codeforces' | 'codechef';

export interface PlatformProfile {
    username: string;
    rating?: number;
    maxRating?: number;
    rank?: string;
    problemsSolved?: number;
    connected: boolean;
    lastSynced?: Date;
}

export interface UserPlatforms {
    leetcode?: PlatformProfile;
    codeforces?: PlatformProfile;
    codechef?: PlatformProfile;
}

// User types
export interface User {
    id: string;
    email: string;
    name: string;
    rollNumber?: string;
    batch?: string;
    photoURL?: string;
    role: 'member' | 'admin' | 'mentor';
    joinedAt: Date;
    platforms: UserPlatforms;
    stats: UserStats;
}

export interface UserStats {
    totalProblems: number;
    easyProblems: number;
    mediumProblems: number;
    hardProblems: number;
    weeklyProblems: number;
    monthlyProblems: number;
    currentStreak: number;
    maxStreak: number;
    lastSubmissionDate?: Date;
}

// Submission types
export interface Submission {
    id: string;
    userId: string;
    platform: PlatformType;
    problemId: string;
    problemName: string;
    difficulty: 'easy' | 'medium' | 'hard';
    status: 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error' | 'compilation_error';
    language: string;
    timestamp: Date;
    executionTime?: number;
    memory?: number;
    aiDetectionScore?: number;
    flagged?: boolean;
}

// Leaderboard types
export interface LeaderboardEntry {
    userId: string;
    user: {
        name: string;
        photoURL?: string;
        batch?: string;
    };
    rank: number;
    totalProblems: number;
    weeklyProblems: number;
    monthlyProblems: number;
    currentStreak: number;
    averageRating: number;
    platforms: {
        leetcode?: number;
        codeforces?: number;
        codechef?: number;
    };
}

// Analytics types
export interface ActivityHeatmap {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
}

export interface PlatformStats {
    platform: PlatformType;
    problemsSolved: number;
    rating: number;
    percentile: number;
}

export interface ProgressData {
    date: string;
    problems: number;
    cumulative: number;
}

// Notification types
export interface Notification {
    id: string;
    userId: string;
    type: 'ai_detection' | 'achievement' | 'system' | 'reminder';
    title: string;
    message: string;
    read: boolean;
    timestamp: Date;
    metadata?: {
        submissionId?: string;
        aiScore?: number;
    };
}

// Admin Analytics types
export interface AdminAnalytics {
    totalMembers: number;
    activeMembers: number;
    totalSubmissions: number;
    averageProblemsPerUser: number;
    platformDistribution: {
        leetcode: number;
        codeforces: number;
        codechef: number;
    };
    difficultyDistribution: {
        easy: number;
        medium: number;
        hard: number;
    };
    flaggedSubmissions: number;
}

export interface MemberReport {
    userId: string;
    user: {
        name: string;
        email: string;
        rollNumber?: string;
        batch?: string;
    };
    stats: UserStats;
    recentActivity: Submission[];
    heatmap: ActivityHeatmap[];
    flaggedCount: number;
}
