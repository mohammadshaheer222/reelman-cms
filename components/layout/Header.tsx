'use client';
import { Menu, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { useState } from 'react';
import { QuickAddClient } from '@/components/clients/QuickAddClient';

interface HeaderProps {
  onOpenMobileNav: () => void;
}

export default function Header({ onOpenMobileNav }: HeaderProps) {
  const [addClientOpen, setAddClientOpen] = useState(false);

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

        <div className="flex items-center gap-3">
          <div className="sm:hidden w-40">
            <GlobalSearch />
          </div>
          <Button
            size="sm"
            onClick={() => setAddClientOpen(true)}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Client</span>
          </Button>
        </div>
      </header>

      <QuickAddClient
        open={addClientOpen}
        onOpenChange={setAddClientOpen}
        onSuccess={() => {
          // If on clients page, will trigger refresh via event or route
          window.dispatchEvent(new CustomEvent('client-created'));
        }}
      />
    </>
  );
}
