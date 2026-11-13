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
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Reelman Flow Logo"
              className="w-8 h-8 rounded-lg object-cover shadow-xs border border-gray-100"
            />
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">Reelman</p>
              <p className="text-xs text-[#2C8567] font-semibold leading-none mt-1">Flow</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-[#2C8567]/10 text-[#2C8567] font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn('w-4 h-4', active ? 'text-[#2C8567]' : 'text-gray-500')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User area */}
        <div className="border-t border-gray-100 px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{user ? getInitials(user.name) : 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || 'staff'}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
