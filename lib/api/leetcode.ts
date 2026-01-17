/**
 * LeetCode API Client
 * Uses our server-side API proxy to avoid CORS
 */

export interface LeetCodeStats {
    username: string;
    problemsSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    ranking: number;
    reputation: number;
}

/**
 * Fetch user stats from LeetCode via our backend API
 */
export async function getLeetCodeStats(username: string): Promise<LeetCodeStats | null> {
    try {
        const response = await fetch(`/api/leetcode/${username}`);

        if (!response.ok) {
            console.error('Failed to fetch LeetCode profile:', response.status);
            return null;
        }

        const data = await response.json();
        return data as LeetCodeStats;
    } catch (error) {
        console.error('Error fetching LeetCode stats:', error);
        return null;
    }
}
