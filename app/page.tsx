'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Code2, Terminal, Zap, TrendingUp, Users, Award, Shield } from 'lucide-react';

// Mentor access code (in production, this should be in environment variables)
const MENTOR_ACCESS_CODE = 'TSAP2026';

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [isMentorLogin, setIsMentorLogin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        rollNumber: '',
        batch: '',
        mentorCode: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                // Login
                const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

                if (userDoc.exists()) {
                    const userData = userDoc.data();

                    // Check if trying to login to wrong portal
                    if (isMentorLogin && userData.role !== 'mentor' && userData.role !== 'admin') {
                        alert('This account is not a mentor account. Please use the Member Login.');
                        await auth.signOut();
                        setLoading(false);
                        return;
                    }
                    if (!isMentorLogin && (userData.role === 'mentor' || userData.role === 'admin')) {
                        alert('This is a mentor account. Please use the Mentor Login.');
                        await auth.signOut();
                        setLoading(false);
                        return;
                    }

                    // CHECK APPROVAL STATUS
                    if (userData.role === 'member' && !userData.approved) {
                        alert('Your account is pending approval from a mentor. Please try again later.');
                        await auth.signOut();
                        setLoading(false);
                        return;
                    }

                    router.push('/dashboard');
                }
            } else {
                // Sign up
                // Validate mentor code for mentor signup
                if (isMentorLogin && formData.mentorCode !== MENTOR_ACCESS_CODE) {
                    alert('Invalid mentor access code. Please contact the club admin.');
                    setLoading(false);
                    return;
                }

                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

                // Create user document in Firestore
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    email: formData.email,
                    name: formData.name,
                    rollNumber: isMentorLogin ? null : formData.rollNumber,
                    batch: isMentorLogin ? null : formData.batch,
                    role: isMentorLogin ? 'mentor' : 'member',
                    approved: isMentorLogin ? true : false, // Members need approval, Mentors are auto-approved via code
                    joinedAt: new Date(),
                    platforms: {},
                    stats: {
                        totalProblems: 0,
                        easyProblems: 0,
                        mediumProblems: 0,
                        hardProblems: 0,
                        weeklyProblems: 0,
                        monthlyProblems: 0,
                        currentStreak: 0,
                        maxStreak: 0,
                    },
                });

                if (isMentorLogin) {
                    router.push('/dashboard');
                } else {
                    alert('Account created successfully! Please wait for a mentor to approve your account.');
                    await auth.signOut(); // Sign out immediately so they can't access dashboard
                    setIsLogin(true); // Switch to login view
                }
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen grid-bg flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-32 h-32 bg-terminal-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-20 right-10 w-40 h-40 bg-terminal-secondary/10 rounded-full blur-3xl animate-pulse-slow animation-delay-400"></div>
                <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-terminal-accent/5 rounded-full blur-3xl animate-pulse-slow animation-delay-600"></div>
            </div>

            <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 relative z-10">
                {/* Left Side - Branding */}
                <div className="hidden md:flex flex-col justify-center space-y-8 p-8">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <Terminal className="w-12 h-12 text-terminal-primary" />
                            <h1 className="text-5xl font-bold gradient-text">TSAP</h1>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-100">
                            Turing Society of <br />
                            <span className="text-terminal-secondary">Algorithmic Programmers</span>
                        </h2>
                        <p className="text-terminal-muted text-lg">
                            NST Bangalore's Premier Competitive Programming Club
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Feature icon={<Code2 />} text="Track problems across LeetCode, Codeforces & CodeChef" />
                        <Feature icon={<TrendingUp />} text="Visualize your progress with analytics & heatmaps" />
                        <Feature icon={<Users />} text="Compete on real-time leaderboards" />
                        <Feature icon={<Award />} text="AI-powered submission integrity checks" />
                    </div>

                    <div className="code-block">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-terminal-danger"></div>
                            <div className="w-3 h-3 rounded-full bg-terminal-accent"></div>
                            <div className="w-3 h-3 rounded-full bg-terminal-primary"></div>
                        </div>
                        <code className="text-xs">
                            <div>{'function solve(n) {'}</div>
                            <div className="ml-4">{'// Time: O(log n)'}</div>
                            <div className="ml-4">{'// Space: O(1)'}</div>
                            <div className="ml-4 text-terminal-secondary">{'return n * n;'}</div>
                            <div>{'}'}</div>
                        </code>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="flex items-center justify-center">
                    <div className="card glass w-full max-w-md">
                        <div className="mb-8 text-center md:hidden">
                            <div className="flex items-center justify-center space-x-2 mb-2">
                                <Terminal className="w-8 h-8 text-terminal-primary" />
                                <h1 className="text-3xl font-bold gradient-text">TSAP</h1>
                            </div>
                            <p className="text-terminal-muted">Competitive Programming Club</p>
                        </div>

                        {/* Portal Type Selector */}
                        <div className="mb-6">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsMentorLogin(false)}
                                    className={`p-4 rounded-lg border-2 transition-all ${!isMentorLogin
                                        ? 'border-terminal-primary bg-terminal-primary/10'
                                        : 'border-terminal-border hover:border-terminal-muted'
                                        }`}
                                >
                                    <Users className="w-6 h-6 mx-auto mb-2 text-terminal-primary" />
                                    <p className="text-sm font-medium text-gray-100">Member Portal</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsMentorLogin(true)}
                                    className={`p-4 rounded-lg border-2 transition-all ${isMentorLogin
                                        ? 'border-terminal-secondary bg-terminal-secondary/10'
                                        : 'border-terminal-border hover:border-terminal-muted'
                                        }`}
                                >
                                    <Shield className="w-6 h-6 mx-auto mb-2 text-terminal-secondary" />
                                    <p className="text-sm font-medium text-gray-100">Mentor Portal</p>
                                </button>
                            </div>
                        </div>

                        <div className="flex space-x-2 mb-6">
                            <button
                                type="button"
                                onClick={() => setIsLogin(true)}
                                className={`flex-1 py-2 rounded-md font-medium transition-all ${isLogin
                                    ? 'bg-terminal-primary text-terminal-bg'
                                    : 'bg-terminal-border text-terminal-muted hover:text-gray-100'
                                    }`}
                            >
                                Login
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsLogin(false)}
                                className={`flex-1 py-2 rounded-md font-medium transition-all ${!isLogin
                                    ? 'bg-terminal-primary text-terminal-bg'
                                    : 'bg-terminal-border text-terminal-muted hover:text-gray-100'
                                    }`}
                            >
                                Sign Up
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isLogin && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-300">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="input w-full"
                                            placeholder="Enter your name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    {/* Show Roll Number and Batch only for members */}
                                    {!isMentorLogin && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-300">Roll Number</label>
                                                <input
                                                    type="text"
                                                    className="input w-full"
                                                    placeholder="e.g., 21CS01"
                                                    value={formData.rollNumber}
                                                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-300">Batch</label>
                                                <input
                                                    type="text"
                                                    className="input w-full"
                                                    placeholder="e.g., 2021"
                                                    value={formData.batch}
                                                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Show Mentor Access Code only for mentors */}
                                    {isMentorLogin && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-300">
                                                Mentor Access Code <span className="text-terminal-accent">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="input w-full"
                                                placeholder="Enter mentor access code"
                                                value={formData.mentorCode}
                                                onChange={(e) => setFormData({ ...formData, mentorCode: e.target.value })}
                                            />
                                            <p className="text-xs text-terminal-muted mt-1">
                                                Contact club admin for the mentor access code
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="input w-full"
                                    placeholder="your.email@nst.edu"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="input w-full"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center space-x-2"
                            >
                                {loading ? (
                                    <div className="spinner"></div>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5" />
                                        <span>{isLogin ? 'Login' : 'Create Account'}</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-terminal-muted">
                            <p>Time Complexity: O(1) • Space Complexity: O(1)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-start space-x-3">
            <div className="w-6 h-6 text-terminal-primary mt-0.5">{icon}</div>
            <p className="text-gray-300">{text}</p>
        </div>
    );
}
