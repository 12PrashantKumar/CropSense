import type { Metadata } from 'next';
import './globals.css';
import NavBar from './NavBar';

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
        <NavBar />
        
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
