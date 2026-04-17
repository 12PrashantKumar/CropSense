"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NavBar() {
    const [username, setUsername] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const check = () => setUsername(localStorage.getItem("username"));
        check();
        // Re-check on storage events (login/logout in another tab)
        window.addEventListener("storage", check);
        return () => window.removeEventListener("storage", check);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setUsername(null);
        router.push('/');
    };

    return (
        <nav className="fixed w-full z-50 glass-panel border-b-0 border-white/5 py-4">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center">
                <a href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center">
                        <span className="font-bold text-lg text-white">C</span>
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        CropSense
                    </span>
                </a>

                <div className="flex gap-6 items-center">
                    <a href="/" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Home</a>
                    <a href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Dashboard</a>

                    {username ? (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full border border-white/10">
                                <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold uppercase">
                                    {username.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-gray-200">{username}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-sm font-medium bg-white/10 hover:bg-red-500/20 hover:text-red-400 px-4 py-2 rounded-full transition-all"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <a href="/auth" className="text-sm font-medium bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all">
                            Sign In
                        </a>
                    )}
                </div>
            </div>
        </nav>
    );
}
