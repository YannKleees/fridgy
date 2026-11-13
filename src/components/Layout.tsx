import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showAddButton?: boolean;
}

export function Layout({
  children,
  title = "My Fridge",
  showAddButton = true
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Main content */}
      <main className="container mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}