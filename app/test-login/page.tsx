'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function TestLogin() {
    const [email, setEmail] = useState('geetansh.test@test.edu');
    const [password, setPassword] = useState('Test@1234');
    const [result, setResult] = useState('');

    const handleLogin = async () => {
        try {
            setResult('Attempting login...');
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setResult(`SUCCESS! Logged in as: ${userCredential.user.email}`);
            console.log('User:', userCredential.user);
        } catch (error: any) {
            setResult(`ERROR: ${error.code} - ${error.message}`);
            console.error('Login error:', error);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
            <h1>Firebase Auth Test</h1>
            <div style={{ marginTop: '20px' }}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <div style={{ marginTop: '15px' }}>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <button
                    onClick={handleLogin}
                    style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
                >
                    Test Login
                </button>
            </div>
            {result && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: result.includes('SUCCESS') ? '#d4edda' : '#f8d7da',
                    border: result.includes('SUCCESS') ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
                    borderRadius: '4px'
                }}>
                    {result}
                </div>
            )}
        </div>
    );
}
