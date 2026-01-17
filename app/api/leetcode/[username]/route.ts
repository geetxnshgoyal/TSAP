import { NextRequest, NextResponse } from 'next/server';

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
        const query = `
            query getUserProfile($username: String!) {
                allQuestionsCount {
                    difficulty
                    count
                }
                matchedUser(username: $username) {
                    username
                    profile {
                        ranking
                        reputation
                        starRating
                    }
                    submitStats {
                        acSubmissionNum {
                            difficulty
                            count
                            submissions
                        }
                    }
                }
            }
        `;

        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com',
            },
            body: JSON.stringify({
                query,
                variables: { username },
            }),
        });

        const data = await response.json();

        if (data.errors) {
            return NextResponse.json(
                { error: data.errors[0].message },
                { status: 400 }
            );
        }

        if (!data.data.matchedUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const user = data.data.matchedUser;
        const stats = user.submitStats.acSubmissionNum;

        const totalSolved = stats.find((s: any) => s.difficulty === 'All')?.count || 0;
        const easySolved = stats.find((s: any) => s.difficulty === 'Easy')?.count || 0;
        const mediumSolved = stats.find((s: any) => s.difficulty === 'Medium')?.count || 0;
        const hardSolved = stats.find((s: any) => s.difficulty === 'Hard')?.count || 0;

        return NextResponse.json({
            username: user.username,
            problemsSolved: totalSolved,
            easySolved,
            mediumSolved,
            hardSolved,
            ranking: user.profile.ranking,
            reputation: user.profile.reputation,
        });

    } catch (error) {
        console.error('Error fetching LeetCode stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch LeetCode stats' },
            { status: 500 }
        );
    }
}
