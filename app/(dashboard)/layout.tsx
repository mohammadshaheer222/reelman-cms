'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Route permission protection for staff with restricted tabs
  const allowed = user?.allowedNavItems;
  const hasRestrictedNav = Boolean(user && Array.isArray(allowed) && allowed.length > 0);

  const isCurrentPathBlocked = hasRestrictedNav && (() => {
    if (pathname === '/') {
      return !allowed!.includes('/');
    }
    const knownSections = [
      '/clients',
      '/calendar',
      '/notepad',
      '/packages',
      '/activity',
      '/team',
      '/settings',
    ];
    const matchingSection = knownSections.find(
      (sec) => pathname === sec || pathname.startsWith(sec + '/')
    );
    if (matchingSection) {
      return !allowed!.includes(matchingSection);
    }
    return false;
  })();

  useEffect(() => {
    if (user && isCurrentPathBlocked && hasRestrictedNav) {
      const fallback = allowed!.find((item) => item !== '/') || allowed![0] || '/clients';
      router.replace(fallback);
    }
  }, [user, isCurrentPathBlocked, hasRestrictedNav, allowed, router]);

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

  if (user && isCurrentPathBlocked && hasRestrictedNav) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafbfc]">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/logo.png"
            alt="Reelman Flow Logo"
            className="w-12 h-12 rounded-2xl object-cover shadow-md border border-gray-100 animate-pulse"
          />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Redirecting to permitted section...</p>
        </div>
      </div>
    );
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
