import React from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#14171d] rounded-3xl border border-gray-100 dark:border-neutral-800 p-8 shadow-[0_4px_28px_rgba(0,0,0,0.03)] text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-neutral-800/80 text-gray-400 dark:text-neutral-500 flex items-center justify-center mx-auto border border-gray-200/60 dark:border-neutral-700">
          <FileQuestion className="w-8 h-8 text-[#dc2626]" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#dc2626]">
            Error 404
          </span>
          <h1 className="text-2xl font-black text-[#141414] dark:text-white tracking-tight">
            Page Not Found<span className="text-[#dc2626]">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 font-normal leading-relaxed">
            The studio page, proposal, or booking record you are searching for does not exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            asChild
            className="w-full sm:w-auto bg-[#141414] hover:bg-black text-white rounded-xl px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Link href="/">
              <Home className="w-3.5 h-3.5 text-[#dc2626]" />
              <span>Back to Dashboard</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto rounded-xl px-5 py-2.5 text-xs font-semibold border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            <Link href="/clients">
              <span>View Clients</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
