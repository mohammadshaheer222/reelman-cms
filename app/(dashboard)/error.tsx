'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error securely to console for debugging
    console.error('[Dashboard Error Boundary]:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#14171d] rounded-2xl border border-gray-100 dark:border-neutral-800 p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-[#dc2626] flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/50">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold text-[#141414] dark:text-white tracking-tight">
            Something went wrong
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 font-normal leading-relaxed">
            An unexpected error occurred while loading this view. Your studio records and bookings are safe.
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-gray-400 dark:text-neutral-500 bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded-md inline-block">
              Ref ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-[#141414] hover:bg-black text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#dc2626]" />
            <span>Try Again</span>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto rounded-xl px-4 py-2 text-xs font-semibold border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            <Link href="/" className="flex items-center justify-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-gray-400" />
              <span>Dashboard</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
