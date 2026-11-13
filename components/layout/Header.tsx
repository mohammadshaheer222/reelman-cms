'use client';

import { Menu, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { useState, useEffect } from 'react';
import { QuickAddClient } from '@/components/clients/QuickAddClient';
import { CallNotepadModal } from '@/components/clients/CallNotepadModal';
import { useStatuses } from '@/hooks/useClients';

interface HeaderProps {
  onOpenMobileNav: () => void;
}

export default function Header({ onOpenMobileNav }: HeaderProps) {
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const { statuses } = useStatuses();

  // Listen for global Alt+C keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (!isInput && e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setNotepadOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block w-72 md:w-96">
            <GlobalSearch />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="sm:hidden w-32">
            <GlobalSearch />
          </div>

          {/* Quick Call Notepad button */}
          <Button
            size="sm"
            onClick={() => setNotepadOpen(true)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white shadow-xs font-medium"
            title="Open Live Call Notepad (Alt+C)"
          >
            <FileText className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden md:inline">Call Notepad</span>
          </Button>

          {/* Add Client button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddClientOpen(true)}
            className="flex items-center gap-1.5 shadow-2xs border-gray-200"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Client</span>
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

      {/* Global Live Call Notepad Modal */}
      <CallNotepadModal
        open={notepadOpen}
        onOpenChange={setNotepadOpen}
        statuses={statuses}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent('client-created'));
        }}
      />
    </>
  );
}
