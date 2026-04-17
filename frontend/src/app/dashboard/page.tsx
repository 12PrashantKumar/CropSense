"use client"
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitDiagnosticImage, fetchDiagnosticHistory } from '@/lib/api';

// Adjusted type for real API data
type HistoryItem = {
    id: number;
    disease_name: string;
    confidence: number;
    recommendation: string;
    image_path: string;
    timestamp?: string;
};

export default function Dashboard() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [username, setUsername] = useState<string>('Farmer');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUsername = localStorage.getItem("username");

        if (!token) {
            router.push('/auth');
            return;
        }

        if (storedUsername) setUsername(storedUsername);

        loadHistory(token);
    }, [router]);

    const loadHistory = async (token: string) => {
        try {
            const data = await fetchDiagnosticHistory(token);
            setHistory(data);
        } catch (error) {
            console.error("Failed to load history", error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResult(null); // Reset previous result
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResult(null);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;

        const token = localStorage.getItem("token");
        if (!token) {
            router.push('/auth');
            return;
        }

        setIsAnalyzing(true);
        setAnalyzeError(null);

        try {
            const data = await submitDiagnosticImage(selectedFile, token);
            setResult({
                disease: data.disease_name,
                confidence: Math.round(data.confidence * 100),
                recommendation: data.recommendation
            });
            loadHistory(token);
        } catch (error: any) {
            console.error("Analysis failed", error);
            if (error.message === "SESSION_EXPIRED") {
                localStorage.removeItem("token");
                localStorage.removeItem("username");
                router.push('/auth');
            } else {
                setAnalyzeError(error.message || "Failed to analyze image. Ensure backend is running.");
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Diagnostic Dashboard</h1>
                    <p className="text-gray-400 mt-1">Upload crop images for instant AI analysis.</p>
                </div>
                <div className="px-4 py-2 glass-panel rounded-full flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold uppercase">
                        {username.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-200">{username}</span>
                    <button
                        onClick={() => {
                            localStorage.removeItem("token");
                            localStorage.removeItem("username");
                            router.push('/auth');
                        }}
                        className="ml-2 text-xs text-brand-400 hover:text-brand-300"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">

                {/* Main Analysis Area */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div
                        className={`glass-panel border-2 border-dashed ${previewUrl ? 'border-brand-500/50 bg-brand-900/10' : 'border-white/20 hover:border-brand-500/50 hover:bg-white/5'} rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] transition-all relative overflow-hidden group`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => !previewUrl && fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        {previewUrl ? (
                            <div className="w-full h-full flex flex-col items-center">
                                <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-6">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={previewUrl} alt="Crop Preview" className="w-full h-full object-cover" />

                                    {isAnalyzing && (
                                        <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4"></div>
                                            <p className="text-brand-400 font-medium animate-pulse">AI is analyzing structure & patterns...</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 w-full max-w-md">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewUrl(null);
                                            setSelectedFile(null);
                                            setResult(null);
                                        }}
                                        className="flex-1 px-6 py-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-white font-medium border border-white/10 transition-colors"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAnalyze();
                                        }}
                                        disabled={isAnalyzing || result !== null}
                                        className={`flex-[2] px-6 py-3 rounded-xl font-semibold transition-all ${isAnalyzing || result ? 'bg-brand-900 text-brand-500 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-500 text-white hover:shadow-[0_0_20px_rgba(32,180,103,0.3)]'}`}
                                    >
                                        {result ? 'Analysis Complete' : 'Run Diagnostic'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center cursor-pointer">
                                <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-brand-900 transition-all border border-white/5 group-hover:border-brand-500/30">
                                    <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Drag & Drop crop image here</h3>
                                <p className="text-gray-400 text-sm">or click to browse from your computer</p>
                                <p className="text-gray-500 text-xs mt-4">Supports JPG, PNG (Max 5MB)</p>
                            </div>
                        )}
                    </div>

                    {/* Error message */}
                    {analyzeError && (
                        <div className="glass-panel rounded-2xl px-6 py-4 border border-red-500/30 bg-red-900/20 text-red-300 text-sm">
                            {analyzeError}
                        </div>
                    )}

                    {/* Results Area */}
                    {result && (
                        <div className="glass-panel rounded-3xl p-8 border border-white/10 animate-fade-in-up">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-8 rounded-full bg-brand-500"></div>
                                <h2 className="text-2xl font-bold text-white">Diagnostic Results</h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Detected Issue</p>
                                    <p className="text-xl font-bold text-brand-400">{result.disease}</p>

                                    <div className="mt-6">
                                        <p className="text-sm text-gray-400 mb-2">AI Confidence</p>
                                        <div className="w-full bg-dark-800 rounded-full h-3 mb-2">
                                            <div className="bg-gradient-to-r from-brand-600 to-brand-400 h-3 rounded-full" style={{ width: `${result.confidence}%` }}></div>
                                        </div>
                                        <p className="text-sm font-medium text-white text-right">{result.confidence}% Match</p>
                                    </div>
                                </div>

                                <div className="bg-brand-950/50 rounded-2xl p-6 border border-brand-900/50">
                                    <p className="text-sm text-brand-500 font-semibold mb-2 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                        Recommendation
                                    </p>
                                    <p className="text-gray-300 leading-relaxed text-sm">{result.recommendation}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* History Sidebar */}
                <div className="glass-panel p-6 rounded-3xl border border-white/10 lg:h-[800px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Recent History</h3>
                        <button className="text-sm text-brand-500 hover:text-brand-400 font-medium">View All</button>
                    </div>

                    <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
                        {history.length > 0 ? (
                            history.map((item) => (
                                <div key={item.id} className="bg-dark-800/50 hover:bg-dark-800 p-4 rounded-2xl border border-white/5 cursor-pointer transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded w-fit ${item.disease_name.includes('Healthy') ? 'bg-brand-900/50 text-brand-400' : 'bg-red-900/30 text-red-400'}`}>
                                            {Math.round(item.confidence * 100)}%
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Just now'}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-white text-sm mt-1">{item.disease_name}</h4>
                                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{item.recommendation}</p>
                                </div>
                            ))
                        ) : (
                            <div className="bg-dark-800/30 p-4 rounded-xl border border-dashed border-white/10 text-center mt-4 group">
                                <span className="text-gray-500 text-sm font-medium group-hover:text-brand-500 transition-colors">Start a new diagnosis to see it here</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
