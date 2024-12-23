"use client";

import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useRouter } from 'next/navigation'; // Add this import

const AuthPage = () => {
    const router = useRouter(); // Add this
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isNewUser, setIsNewUser] = useState(false);

    // Add this useEffect to check if user is already logged in
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                router.push('/'); // Redirect to home if already authenticated
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isNewUser) {
                await createUserWithEmailAndPassword(auth, email, password);
                // After successful signup
                localStorage.setItem('authToken', await auth.currentUser?.getIdToken() || '');
                router.push('/'); // Redirect to home page
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                // After successful login
                localStorage.setItem('authToken', await auth.currentUser?.getIdToken() || '');
                router.push('/'); // Redirect to home page
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                alert(error.message); // Now it's safe to access `message`
            }
            else {
                alert("An unknown error occurred"); // Fallback for non-Error errors
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-2xl font-bold mb-4">{isNewUser ? "Sign Up" : "Login"}</h1>
            <form onSubmit={handleAuth} className="bg-white p-6 rounded shadow-md">
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border rounded"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded"
                        required
                    />
                </div>
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
                    {isNewUser ? "Sign Up" : "Login"}
                </button>
            </form>
            <button
                onClick={() => setIsNewUser(!isNewUser)}
                className="mt-4 text-blue-500 underline"
            >
                {isNewUser ? "Already have an account? Login" : "New here? Sign Up"}
            </button>
        </div>
    );
};

export default AuthPage;
