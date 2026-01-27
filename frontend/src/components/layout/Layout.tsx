import { ReactNode } from 'react';
import { Header } from './Header';
import { GuestWarningBanner } from '../GuestWarningBanner';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <GuestWarningBanner />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
