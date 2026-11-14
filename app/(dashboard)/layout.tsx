'use client';
import { useState } from 'react';
import { Camera } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  if (loading && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafbfc]">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/logo.png"
            alt="Reelman Flow Logo"
            className="w-12 h-12 rounded-2xl object-cover shadow-md border border-gray-100 animate-pulse"
          />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Loading Reelman Flow...</p>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    // Redirection to login is handled automatically by AuthProvider
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafbfc]">
      {/* Sidebar (Desktop and Mobile Drawer) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenMobileNav={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
