'use client';

import React from 'react';
import { StickyNote } from 'lucide-react';
import { CallNotepad } from '@/components/clients/CallNotepad';

export default function NotepadPage() {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2C8567] text-white flex items-center justify-center shadow-xs">
            <StickyNote className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Notepad</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Quick rough scratchpad for notes and thoughts.
            </p>
          </div>
        </div>
      </div>

      {/* Pure Rough Notepad */}
      <CallNotepad isInline={true} />
    </div>
  );
}
