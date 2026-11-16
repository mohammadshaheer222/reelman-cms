'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Root Error Boundary Caught]:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8f9fa] dark:bg-[#0c0e12]">
      <div className="max-w-md w-full bg-white dark:bg-[#14171d] rounded-3xl border border-gray-100 dark:border-neutral-800 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-[#dc2626] flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/50 shadow-inner">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-[#141414] dark:text-white tracking-tight">
            Application Error<span className="text-[#dc2626]">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 font-normal leading-relaxed">
            The studio application encountered an unexpected runtime state. Please try recovering below.
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-gray-400 dark:text-neutral-500 bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded-md inline-block">
              Code: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-[#141414] hover:bg-black text-white rounded-xl px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#dc2626]" />
            <span>Try Again</span>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto rounded-xl px-5 py-2.5 text-xs font-semibold border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            <Link href="/" className="flex items-center justify-center gap-2">
              <Home className="w-3.5 h-3.5 text-gray-400" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
