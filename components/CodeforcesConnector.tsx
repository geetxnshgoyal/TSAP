'use client';

import { useState } from 'react';
import { Code2, Link, Check, X, Loader } from 'lucide-react';
import { getCodeforcesUser, getCodeforcesSubmissions, calculateCodeforcesStats } from '@/lib/codeforces';

interface CodeforcesConnectorProps {
    onConnect: (handle: string, stats: any) => Promise<void>;
    currentHandle?: string;
}

export default function CodeforcesConnector({ onConnect, currentHandle }: CodeforcesConnectorProps) {
    const [handle, setHandle] = useState(currentHandle || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleConnect = async () => {
        if (!handle.trim()) {
            setError('Please enter a Codeforces handle');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Verify user exists
            const user = await getCodeforcesUser(handle.trim());
            if (!user) {
                setError('User not found on Codeforces');
                setLoading(false);
                return;
            }

            // Fetch submissions and calculate stats
            const submissions = await getCodeforcesSubmissions(handle.trim(), 1000);
            const stats = calculateCodeforcesStats(submissions);

            // Save to database
            await onConnect(handle.trim(), {
                handle: user.handle,
                rating: user.rating || 0,
                maxRating: user.maxRating || 0,
                rank: user.rank || 'unrated',
                maxRank: user.maxRank || 'unrated',
                ...stats,
            });

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to connect Codeforces account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card glass">
            <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-terminal-primary/10 rounded-lg">
                    <Code2 className="w-6 h-6 text-terminal-primary" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-100">Connect Codeforces</h3>
                    <p className="text-sm text-terminal-muted">
                        Link your account to track submissions and stats
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                        Codeforces Handle
                    </label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="e.g., tourist"
                            className="input flex-1"
                            value={handle}
                            onChange={(e) => setHandle(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            onClick={handleConnect}
                            disabled={loading}
                            className="btn-primary flex items-center space-x-2"
                        >
                            {loading ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : success ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <Link className="w-5 h-5" />
                            )}
                            <span>{currentHandle ? 'Update' : 'Connect'}</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <X className="w-5 h-5 text-red-400" />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="flex items-center space-x-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <Check className="w-5 h-5 text-green-400" />
                        <p className="text-sm text-green-400">
                            Successfully connected! Stats will update shortly.
                        </p>
                    </div>
                )}

                <div className="text-xs text-terminal-muted space-y-1">
                    <p>• Your Codeforces handle is your username (case-sensitive)</p>
                    <p>• We'll fetch your last 1000 submissions to calculate stats</p>
                    <p>• Stats update automatically every 24 hours</p>
                </div>
            </div>
        </div>
    );
}
