import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen hero-bg flex flex-col justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-[100px] -z-10" />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <div className="flex flex-col gap-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-900/40 border border-brand-500/30 text-brand-300 w-fit text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              AI-Powered Accuracy (85%+)
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-tight">
              Protect Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">Harvest</span> With AI.
            </h1>

            <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
              Upload an image of your crop and instantly detect diseases using our state-of-the-art CNN model. Track your crop health over time and receive actionable recommendations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-full bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(32,180,103,0.4)]"
              >
                Start Diagnosing
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
              <Link
                href="/auth"
                className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-semibold flex items-center justify-center border border-white/10 transition-all backdrop-blur-sm"
              >
                View History Logs
              </Link>
            </div>

            <div className="flex gap-6 mt-8 pt-6 border-t border-white/10">
              <div>
                <p className="text-3xl font-bold text-white">17<span className="text-brand-500">+</span></p>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Diseases Detected</p>
              </div>
              <div className="w-px bg-white/10"></div>
              <div>
                <p className="text-3xl font-bold text-white">5</p>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Crop Varieties (Corn, Wheat...)</p>
              </div>
            </div>
          </div>

          {/* Visual Showcase */}
          <div className="relative animate-float mx-auto w-full max-w-md hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/30 to-brand-400/10 rounded-3xl blur-2xl transform rotate-3"></div>
            <div className="glass-panel p-2 rounded-3xl relative">
              <div className="bg-dark-900 rounded-2xl overflow-hidden border border-white/5 relative aspect-[4/5] flex flex-col items-center justify-center group cursor-pointer">
                {/* Fake dashboard/app preview */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1530836369250-ef72a3f5c748?auto=format&fit=crop&q=80&w=800" alt="Plant Leaf Scan" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />

                <div className="absolute top-0 left-0 right-0 h-[60%] bg-gradient-to-b from-dark-900 to-transparent flex items-start justify-center pt-12 pointer-events-none z-10">
                  <div className="w-32 h-32 rounded-full border-2 border-brand-500/60 border-dashed animate-[spin_10s_linear_infinite] opacity-80 absolute"></div>
                  <div className="w-16 h-16 text-brand-400 group-hover:scale-110 transition-transform relative mt-8">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" /></svg>
                  </div>
                </div>

                {/* Bottom gradient fade so text is legible */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-dark-900 via-dark-900/90 to-transparent pointer-events-none z-0"></div>

                <div className="text-center mt-32 z-10 px-6 relative">
                  <h3 className="text-xl font-bold text-white mb-2">Corn Common Rust</h3>
                  <div className="w-full bg-dark-800 rounded-full h-2 mb-4">
                    <div className="bg-brand-500 h-2 rounded-full w-[92%]"></div>
                  </div>
                  <p className="text-sm text-brand-400 font-medium bg-brand-950 px-3 py-1 rounded-full border border-brand-800 inline-block">92% Confidence</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
