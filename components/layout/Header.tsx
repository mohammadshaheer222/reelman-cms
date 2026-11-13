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

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="sm:hidden w-36">
            <GlobalSearch />
          </div>

          {/* Add Client button */}
          <Button
            size="sm"
            onClick={() => setAddClientOpen(true)}
            className="flex items-center gap-1.5 shadow-sm bg-[#2C8567] hover:bg-[#236d54] text-white"
          >
            <Plus className="w-4 h-4" />
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
