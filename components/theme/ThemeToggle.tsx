'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ThemeToggleProps {
  className?: string;
  showDropdown?: boolean;
}

export function ThemeToggle({ className = '', showDropdown = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Placeholder during SSR to prevent layout shift
    return (
      <div
        className={`w-9 h-9 rounded-xl border border-gray-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 flex items-center justify-center text-gray-400 ${className}`}
        aria-hidden="true"
      >
        <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-neutral-800 animate-pulse" />
      </div>
    );
  }

  if (showDropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`w-9 h-9 rounded-xl border border-gray-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-all shadow-xs group focus:outline-hidden ${className}`}
            title="Select Theme"
            aria-label="Theme options"
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-12" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500 transition-transform group-hover:rotate-45" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-36 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-xl p-1 z-[9999]"
        >
          <DropdownMenuItem
            onClick={() => setTheme('light')}
            className={`flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer ${
              theme === 'light'
                ? 'bg-red-50 text-[#dc2626] dark:bg-red-950/40 dark:text-red-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </div>
            {theme === 'light' && <Check className="w-3.5 h-3.5 text-[#dc2626]" />}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer ${
              theme === 'dark'
                ? 'bg-red-50 text-[#dc2626] dark:bg-red-950/40 dark:text-red-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-amber-400" />
              <span>Dark</span>
            </div>
            {theme === 'dark' && <Check className="w-3.5 h-3.5 text-[#dc2626]" />}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setTheme('system')}
            className={`flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer ${
              theme === 'system'
                ? 'bg-red-50 text-[#dc2626] dark:bg-red-950/40 dark:text-red-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-blue-500" />
              <span>System</span>
            </div>
            {theme === 'system' && <Check className="w-3.5 h-3.5 text-[#dc2626]" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // 1-Click Smooth Quick Toggle
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-xl border border-gray-200/80 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-200 transition-all duration-200 shadow-2xs hover:shadow-xs group focus:outline-hidden ${className}`}
      title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-amber-400 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-all duration-300 group-hover:rotate-45 group-hover:scale-110" />
        )}
      </div>
    </button>
  );
}
