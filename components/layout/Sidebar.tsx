'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Calendar,
  Package,
  History,
  UserCheck,
  Settings,
  StickyNote,
  LogOut,
  X,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const navItems = [
  { label: 'Home', href: '/', icon: Home, description: 'Overview and revenue metrics' },
  { label: 'Clients', href: '/clients', icon: Users, description: 'Client bookings and status tracking' },
  { label: 'Calendar', href: '/calendar', icon: Calendar, description: 'Shoot schedule and availability conflicts' },
  { label: 'Notepad', href: '/notepad', icon: StickyNote, description: 'Rough scratchpad for quick phone notes' },
  { label: 'Packages', href: '/packages', icon: Package, description: 'Package builder and PDF proposals' },
  { label: 'History', href: '/activity', icon: History, description: 'Recent audit activity and team logs' },
  { label: 'Team', href: '/team', icon: UserCheck, description: 'Crew members and user accounts' },
  { label: 'Settings', href: '/settings', icon: Settings, description: 'Business settings and lead statuses' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const visibleNavItems = navItems.filter((item) => {
    if (!user) return true;
    if (user.allowedNavItems && Array.isArray(user.allowedNavItems)) {
      return user.allowedNavItems.includes(item.href);
    }
    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100/90 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 select-none shadow-[2px_0_12px_rgba(0,0,0,0.02)]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Reelman Flow Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-xs border border-gray-100 group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-gray-900 leading-none">Reelman</span>
                <span className="text-xs font-semibold text-[#2C8567] bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60 leading-none">
                  Flow
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium leading-none mt-1">Creator Studio CRM</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
            Navigation
          </div>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                  active
                    ? 'bg-[#141414] text-white shadow-xs font-semibold'
                    : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 transition-transform group-hover:scale-110',
                    active ? 'text-white' : 'text-gray-400 group-hover:text-gray-700'
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="p-3 border-t border-gray-100">
          <div className="p-2.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-xl border border-gray-200/80 shadow-2xs">
              <AvatarFallback className="text-xs font-bold bg-[#141414] text-white">
                {user ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Producer'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <p className="text-[11px] text-gray-500 capitalize truncate font-medium">
                  {user?.role || 'Creator'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
