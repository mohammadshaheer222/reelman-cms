'use client';

import React from 'react';
import { StickyNote } from 'lucide-react';
import { CallNotepad } from '@/components/clients/CallNotepad';

export default function NotepadPage() {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100/90 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#141414] text-white flex items-center justify-center shadow-xs">
            <StickyNote className="w-5 h-5 text-[#dc2626]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Scratchpad
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#141414] tracking-tight">
              Call Notepad<span className="text-[#dc2626]">.</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal">
              Quick rough scratchpad for client inquiries, call bullets, and reminders.
            </p>
          </div>
        </div>
      </div>

      {/* Pure Rough Notepad */}
      <CallNotepad isInline={true} />
    </div>
  );
}
