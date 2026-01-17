// Codeforces API Integration
// Documentation: https://codeforces.com/apiHelp

export interface CodeforcesUser {
    handle: string;
    rating?: number;
    maxRating?: number;
    rank?: string;
    maxRank?: string;
    contribution?: number;
    friendOfCount?: number;
    avatar?: string;
    titlePhoto?: string;
}

export interface CodeforcesSubmission {
    id: number;
    contestId?: number;
    creationTimeSeconds: number;
    problem: {
        contestId?: number;
        index: string;
        name: string;
        type: string;
        rating?: number;
        tags: string[];
    };
    author: {
        contestId?: number;
        members: Array<{ handle: string }>;
        participantType: string;
        ghost: boolean;
        startTimeSeconds?: number;
    };
    programmingLanguage: string;
    verdict?: string;
    testset: string;
    passedTestCount: number;
    timeConsumedMillis: number;
    memoryConsumedBytes: number;
}

export interface CodeforcesRating {
    contestId: number;
    contestName: string;
    handle: string;
    rank: number;
    ratingUpdateTimeSeconds: number;
    oldRating: number;
    newRating: number;
}

const API_BASE = 'https://codeforces.com/api';

/**
 * Fetch user information from Codeforces
 */
export async function getCodeforcesUser(handle: string): Promise<CodeforcesUser | null> {
    try {
        const response = await fetch(`${API_BASE}/user.info?handles=${handle}`);
        const data = await response.json();

        if (data.status !== 'OK') {
            console.error('Codeforces API error:', data.comment);
            return null;
        }

        return data.result[0];
    } catch (error) {
        console.error('Error fetching Codeforces user:', error);
        return null;
    }
}

/**
 * Fetch user submissions from Codeforces
 * @param handle - Codeforces handle
 * @param count - Number of submissions to fetch (max 100000, default 100)
 */
export async function getCodeforcesSubmissions(
    handle: string,
    count: number = 100
): Promise<CodeforcesSubmission[]> {
    try {
        const response = await fetch(`${API_BASE}/user.status?handle=${handle}&from=1&count=${count}`);
        const data = await response.json();

        if (data.status !== 'OK') {
            console.error('Codeforces API error:', data.comment);
            return [];
        }

        return data.result;
    } catch (error) {
        console.error('Error fetching Codeforces submissions:', error);
        return [];
    }
}

/**
 * Fetch user rating history from Codeforces
 */
export async function getCodeforcesRatingHistory(handle: string): Promise<CodeforcesRating[]> {
    try {
        const response = await fetch(`${API_BASE}/user.rating?handle=${handle}`);
        const data = await response.json();

        if (data.status !== 'OK') {
            console.error('Codeforces API error:', data.comment);
            return [];
        }

        return data.result;
    } catch (error) {
        console.error('Error fetching Codeforces rating history:', error);
        return [];
    }
}

/**
 * Calculate statistics from Codeforces submissions
 */
export function calculateCodeforcesStats(submissions: CodeforcesSubmission[]) {
    const acceptedSubmissions = submissions.filter((s) => s.verdict === 'OK');
    const uniqueProblems = new Set(
        acceptedSubmissions.map((s) => `${s.problem.contestId}-${s.problem.index}`)
    );

    // Count by difficulty
    const problemsByRating: Record<number, number> = {};
    acceptedSubmissions.forEach((s) => {
        if (s.problem.rating) {
            problemsByRating[s.problem.rating] = (problemsByRating[s.problem.rating] || 0) + 1;
        }
    });

    // Count by tags
    const problemsByTag: Record<string, number> = {};
    acceptedSubmissions.forEach((s) => {
        s.problem.tags.forEach((tag) => {
            problemsByTag[tag] = (problemsByTag[tag] || 0) + 1;
        });
    });

    // Calculate streak (assumes submissions are sorted by time descending)
    let currentStreak = 0;
    let maxStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const submissionsByDay = new Map<string, boolean>();
    acceptedSubmissions.forEach((s) => {
        const date = new Date(s.creationTimeSeconds * 1000);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString().split('T')[0];
        submissionsByDay.set(dateKey, true);
    });

    // Calculate current streak
    let checkDate = new Date(today);
    while (submissionsByDay.has(checkDate.toISOString().split('T')[0])) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate max streak
    const sortedDates = Array.from(submissionsByDay.keys()).sort();
    let tempStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            tempStreak++;
            maxStreak = Math.max(maxStreak, tempStreak);
        } else {
            tempStreak = 1;
        }
    }

    return {
        totalProblems: uniqueProblems.size,
        totalSubmissions: submissions.length,
        acceptedSubmissions: acceptedSubmissions.length,
        problemsByRating,
        problemsByTag,
        currentStreak,
        maxStreak,
    };
}
