/**
 * CodeChef API Client
 * Uses server-side scraping via Next.js API route
 */

export interface CodeChefUser {
    username: string;
    rating: number;
    stars: string;
    rank: string;
    problemsSolved: number;
    country?: string;
}

export interface CodeChefStats {
    user: CodeChefUser;
    rating: number;
    rank: string;
    stars: string;
    problemsSolved: number;
}

/**
 * Fetch user stats from CodeChef profile via our backend API
 * Uses server-side scraping to bypass CORS restrictions
 */
export async function getCodeChefStats(username: string): Promise<CodeChefStats | null> {
    try {
        // Use our backend API route for scraping
        const response = await fetch(`/api/codechef/${username}`);

        if (!response.ok) {
            console.error('Failed to fetch CodeChef profile:', response.status);
            return null;
        }

        const data = await response.json();
        return data as CodeChefStats;
    } catch (error) {
        console.error('Error fetching CodeChef stats:', error);
        return null;
    }
}

/**
 * Get color class for CodeChef rating
 */
export function getCodeChefRatingColor(rating: number): string {
    if (rating >= 2500) return 'text-red-500'; // 7 Star
    if (rating >= 2200) return 'text-red-400'; // 6 Star
    if (rating >= 1800) return 'text-yellow-400'; // 5 Star
    if (rating >= 1600) return 'text-purple-400'; // 4 Star
    if (rating >= 1400) return 'text-blue-400'; // 3 Star
    if (rating >= 1200) return 'text-green-400'; // 2 Star
    if (rating >= 1000) return 'text-green-300'; // 1 Star
    return 'text-gray-400'; // Unrated
}
