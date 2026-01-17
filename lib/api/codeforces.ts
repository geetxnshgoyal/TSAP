/**
 * Codeforces API Client
 * Official API documentation: https://codeforces.com/apiHelp
 */

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
    problem: {
        contestId?: number;
        index: string;
        name: string;
        rating?: number;
        tags: string[];
    };
    author: {
        members: { handle: string }[];
    };
    programmingLanguage: string;
    verdict: string;
    creationTimeSeconds: number;
}

export interface CodeforcesUserStats {
    user: CodeforcesUser;
    solvedProblems: number;
    rating: number;
    rank: string;
    maxRating: number;
    maxRank: string;
}

/**
 * Fetch user information from Codeforces API
 */
export async function getCodeforcesUser(handle: string): Promise<CodeforcesUser | null> {
    try {
        const response = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
        const data = await response.json();

        if (data.status !== 'OK' || !data.result || data.result.length === 0) {
            console.error('Codeforces API error:', data);
            return null;
        }

        return data.result[0];
    } catch (error) {
        console.error('Error fetching Codeforces user:', error);
        return null;
    }
}

/**
 * Fetch user submissions from Codeforces API
 */
export async function getCodeforcesSubmissions(handle: string): Promise<CodeforcesSubmission[]> {
    try {
        const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`);
        const data = await response.json();

        if (data.status !== 'OK' || !data.result) {
            console.error('Codeforces API error:', data);
            return [];
        }

        return data.result;
    } catch (error) {
        console.error('Error fetching Codeforces submissions:', error);
        return [];
    }
}

/**
 * Get comprehensive user statistics
 */
export async function getCodeforcesStats(handle: string): Promise<CodeforcesUserStats | null> {
    try {
        // Fetch user info and submissions in parallel
        const [user, submissions] = await Promise.all([
            getCodeforcesUser(handle),
            getCodeforcesSubmissions(handle),
        ]);

        if (!user) {
            return null;
        }

        // Count unique solved problems (verdict = OK)
        const solvedProblemSet = new Set<string>();
        submissions.forEach((submission) => {
            if (submission.verdict === 'OK') {
                const problemKey = `${submission.problem.contestId || 0}-${submission.problem.index}`;
                solvedProblemSet.add(problemKey);
            }
        });

        return {
            user,
            solvedProblems: solvedProblemSet.size,
            rating: user.rating || 0,
            rank: user.rank || 'Unrated',
            maxRating: user.maxRating || 0,
            maxRank: user.maxRank || 'Unrated',
        };
    } catch (error) {
        console.error('Error getting Codeforces stats:', error);
        return null;
    }
}

/**
 * Get color class for Codeforces rating
 */
export function getCodeforcesRatingColor(rating: number): string {
    if (rating >= 3000) return 'text-red-500'; // Legendary Grandmaster
    if (rating >= 2600) return 'text-red-400'; // International Grandmaster
    if (rating >= 2400) return 'text-red-300'; // Grandmaster
    if (rating >= 2300) return 'text-orange-500'; // International Master
    if (rating >= 2100) return 'text-orange-400'; // Master
    if (rating >= 1900) return 'text-purple-400'; // Candidate Master
    if (rating >= 1600) return 'text-blue-400'; // Expert
    if (rating >= 1400) return 'text-cyan-400'; // Specialist
    if (rating >= 1200) return 'text-green-400'; // Pupil
    return 'text-gray-400'; // Newbie
}

/**
 * Get tag statistics from submissions
 */
export async function getCodeforcesTagStats(handle: string): Promise<{ [key: string]: number }> {
    try {
        const submissions = await getCodeforcesSubmissions(handle);
        const tagCounts: { [key: string]: number } = {};
        const solvedProblems = new Set<string>();

        submissions.forEach(sub => {
            if (sub.verdict === 'OK' && sub.problem.tags) {
                const problemId = `${sub.problem.contestId}-${sub.problem.index}`;

                // Only count unique problems per tag
                if (!solvedProblems.has(problemId)) {
                    solvedProblems.add(problemId);

                    sub.problem.tags.forEach(tag => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });
                }
            }
        });

        return tagCounts;
    } catch (error) {
        console.error('Error calculating tag stats:', error);
        return {};
    }
}
