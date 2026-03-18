import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CropSense - AI Disease Detection',
  description: 'Advanced AI-powered crop disease detection platform for sustainable agriculture.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-dark-900 text-white">
        <nav className="fixed w-full z-50 glass-panel border-b-0 border-white/5 py-4">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center">
                <span className="font-bold text-lg text-white">C</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                CropSense
              </span>
            </div>
            <div className="flex gap-6 items-center">
              <a href="/" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Home</a>
              <a href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Dashboard</a>
              <a href="/auth" className="text-sm font-medium bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all">Sign In</a>
            </div>
          </div>
        </nav>
        
        <main className="flex-grow pt-20">
          {children}
        </main>
        
        <footer className="py-8 border-t border-white/5 mt-auto">
          <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} CropSense AI. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
