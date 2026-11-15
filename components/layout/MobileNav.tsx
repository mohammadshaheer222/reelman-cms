'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Sparkles, Activity, Settings, Calendar, StickyNote, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const tabs = [
  { label: 'Home', href: '/', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Map', href: '/map', icon: MapPin },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Notepad', href: '/notepad', icon: StickyNote },
  { label: 'Proposals', href: '/packages', icon: Sparkles },
  { label: 'Activity', href: '/activity', icon: Activity },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const visibleTabs = tabs.filter((tab) => {
    if (!user) return true;
    if (user.allowedNavItems && Array.isArray(user.allowedNavItems)) {
      return user.allowedNavItems.includes(tab.href);
    }
    return true;
  });

  return (
    <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#111317]/95 backdrop-blur-md border-t border-gray-100/90 dark:border-neutral-800/80 pb-safe">
      <div className="flex">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-all duration-200 relative',
                active ? 'text-[#141414] dark:text-white font-bold' : 'text-gray-400 dark:text-neutral-500 hover:text-gray-700 dark:hover:text-neutral-300'
              )}
            >
              <Icon className={cn('w-5 h-5 transition-transform', active ? 'text-[#2C8567] dark:text-emerald-400 scale-110' : '')} />
              <span className="text-[11px] truncate max-w-[64px]">{tab.label}</span>
              {active && (
                <span className="absolute top-1 w-1 h-1 rounded-full bg-[#2C8567] dark:bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
