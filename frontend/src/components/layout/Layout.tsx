import { ReactNode } from 'react';
import { Header } from './Header';
import { GuestWarningBanner } from '../GuestWarningBanner';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-chess-light">
      <Header />
      <GuestWarningBanner />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="mt-auto py-6 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>Chess Trainer &copy; 2024 - Sharpen your tactics, master your game</p>
        </div>
      </footer>
    </div>
  );
}
