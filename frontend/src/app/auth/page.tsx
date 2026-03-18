"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { loginUser, registerUser } from '@/lib/api';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const data = await loginUser(formData.username, formData.password);
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("username", formData.username);
                router.push('/dashboard');
            } else {
                await registerUser(formData.username, formData.email, formData.password);
                // Auto-login after registration
                const data = await loginUser(formData.username, formData.password);
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("username", formData.username);
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-brand-600/10 rounded-full blur-[120px] -z-10" />

            <div className="glass-panel w-full max-w-md p-8 rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden">
                {/* Decorative corner */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-600/20 rounded-full blur-xl" />

                <h2 className="text-3xl font-bold text-white mb-2">{isLogin ? "Welcome Back" : "Create Account"}</h2>
                <p className="text-gray-400 mb-6">{isLogin ? "Enter your details to access your dashboard." : "Join us to start diagnosing crops."}</p>

                {error && (
                    <div className="bg-red-900/40 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {!isLogin && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-300">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder-gray-600 focus:bg-dark-800"
                                placeholder="farmer@example.com"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-300">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder-gray-600 focus:bg-dark-800"
                            placeholder="farmer_john"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between">
                            <label className="text-sm font-medium text-gray-300">Password</label>
                            {isLogin && <a href="#" className="text-xs text-brand-400 hover:text-brand-300 font-medium">Forgot?</a>}
                        </div>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="bg-dark-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder-gray-600 focus:bg-dark-800"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 disabled:opacity-50 text-white font-semibold py-3 rounded-lg mt-4 transition-all hover:shadow-[0_0_15px_rgba(32,180,103,0.3)] active:scale-[0.98] flex justify-center"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            isLogin ? "Sign In" : "Sign Up"
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                        }}
                        className="text-brand-400 font-medium hover:text-brand-300 transition-colors"
                    >
                        {isLogin ? "Sign up" : "Log in"}
                    </button>
                </p>
            </div>
        </div>
    );
}
