'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Sparkles, Activity, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Proposals', href: '/packages', icon: Sparkles },
  { label: 'Activity', href: '/activity', icon: Activity },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-gray-100/90 pb-safe">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-all duration-200 relative',
                active ? 'text-[#141414] font-bold' : 'text-gray-400 hover:text-gray-700'
              )}
            >
              <Icon className={cn('w-5 h-5 transition-transform', active ? 'text-[#2C8567] scale-110' : '')} />
              <span className="text-[11px]">{tab.label}</span>
              {active && (
                <span className="absolute top-1 w-1 h-1 rounded-full bg-[#2C8567]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
