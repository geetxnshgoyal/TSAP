import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;

    if (!username) {
        return NextResponse.json(
            { error: 'Username is required' },
            { status: 400 }
        );
    }

    try {
        // Fetch the CodeChef profile page
        const response = await fetch(`https://www.codechef.com/users/${username}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const html = await response.text();

        // Parse the HTML using cheerio
        const $ = cheerio.load(html);

        // Extract rating
        let rating = 0;
        const ratingText = $('.rating-number').text().trim();
        if (ratingText) {
            rating = parseInt(ratingText, 10) || 0;
        }

        // Extract stars
        let stars = 'Unrated';
        const starsText = $('.rating-star span').text().trim();
        if (starsText) {
            stars = starsText;
        }

        // Extract rank/title
        let rank = 'Unrated';
        const rankText = $('.rating-title').text().trim();
        if (rankText) {
            rank = rankText;
        }

        // Extract problems solved from the correct location
        // Look for "Total Problems Solved: X" in .problems-solved section
        let problemsSolved = 0;

        const problemsSection = $('.problems-solved h3');
        if (problemsSection.length > 0) {
            const problemsText = problemsSection.text();
            // Text format: "Total Problems Solved: 2"
            const match = problemsText.match(/Total Problems Solved:\s*(\d+)/i);
            if (match) {
                problemsSolved = parseInt(match[1], 10);
            }
        }

        // Return the parsed data
        return NextResponse.json({
            user: {
                username,
                rating,
                stars,
                rank,
                problemsSolved,
            },
            rating,
            rank,
            stars,
            problemsSolved,
        });
    } catch (error) {
        console.error('Error fetching CodeChef stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user stats' },
            { status: 500 }
        );
    }
}
