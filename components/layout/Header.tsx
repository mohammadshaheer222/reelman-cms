'use client';

import { Menu, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { useState } from 'react';
import { QuickAddClient } from '@/components/clients/QuickAddClient';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface HeaderProps {
  onOpenMobileNav: () => void;
}

export default function Header({ onOpenMobileNav }: HeaderProps) {
  const [addClientOpen, setAddClientOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-white/85 dark:bg-[#111317]/85 backdrop-blur-md border-b border-gray-100/90 dark:border-neutral-800/80 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 transition-all">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block w-72 md:w-96">
            <GlobalSearch />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="sm:hidden w-36">
            <GlobalSearch />
          </div>

          {/* AI Copilot Quick Launcher */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant'))}
            className="flex items-center gap-1.5 border-emerald-300/80 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-xl px-3 font-medium transition-all shadow-2xs"
            title="Open Studio AI Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Studio AI</span>
          </Button>

          {/* Light / Dark Mode Toggle */}
          <ThemeToggle showDropdown />

          {/* Add Client button - Upreels style CTA */}
          <Button
            size="sm"
            onClick={() => setAddClientOpen(true)}
            className="flex items-center gap-1.5 shadow-xs bg-[#141414] hover:bg-black dark:bg-[#dc2626] dark:hover:bg-red-700 text-white rounded-xl px-4 font-semibold hover:shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-[#dc2626] dark:text-white" />
            <span>Add Client</span>
          </Button>
        </div>
      </header>

      {/* Quick Add Client Dialog */}
      <QuickAddClient
        open={addClientOpen}
        onOpenChange={setAddClientOpen}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent('client-created'));
        }}
      />
    </>
  );
}
