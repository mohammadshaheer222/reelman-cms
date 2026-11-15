'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Trash2,
  AlertTriangle,
  Loader2,
  Calendar,
  MapPin,
  IndianRupee,
  Archive,
  ShieldAlert,
} from 'lucide-react';
import { Client } from '@/types';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface DeleteClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onDeleted?: (deletedId: string) => void;
}

export function DeleteClientModal({
  open,
  onOpenChange,
  client,
  onDeleted,
}: DeleteClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [isPermanent, setIsPermanent] = useState(false);

  // Cache client during modal close animation so it doesn't flash empty
  const clientCacheRef = useRef<Client | null>(client);
  useEffect(() => {
    if (client) {
      clientCacheRef.current = client;
    }
  }, [client]);

  const activeClient = client || clientCacheRef.current;

  if (!activeClient) return null;

  const hasPrice = typeof activeClient.workPrice === 'number' && activeClient.workPrice > 0;
  const hasAdvance = typeof activeClient.advancePaid === 'number' && activeClient.advancePaid > 0;
  const balance = (activeClient.workPrice || 0) - (activeClient.advancePaid || 0);

  const statusObj =
    typeof activeClient.status === 'object' && activeClient.status !== null
      ? activeClient.status
      : null;
  const statusColor = statusObj?.color || '#dc2626';

  const handleDelete = async (permanentOverride?: boolean) => {
    const permanent = permanentOverride !== undefined ? permanentOverride : isPermanent;
    setLoading(true);

    try {
      const url = `/api/clients/${activeClient._id}${permanent ? '?permanent=true' : ''}`;
      const res = await fetch(url, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Failed to delete client');
      }

      toast.success(
        permanent
          ? `Client "${activeClient.name || 'Client'}" permanently deleted`
          : `Client "${activeClient.name || 'Client'}" moved to archive`
      );

      onDeleted?.(activeClient._id);
      window.dispatchEvent(new CustomEvent('client-updated'));
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not delete client';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !loading && onOpenChange(val)}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md p-6 rounded-3xl bg-white dark:bg-[#14171d] shadow-2xl border border-gray-100 dark:border-neutral-800 gap-0 z-[9999]">
        {/* Top Header with Warning Icon */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 text-[#dc2626] dark:text-red-400 flex items-center justify-center shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-neutral-900 animate-pulse" />
          </div>

          <div className="space-y-1 flex-1 pr-6">
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
              Delete Client Booking
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
              Are you sure you want to delete this client? Confirm details below.
            </DialogDescription>
          </div>
        </div>

        {/* Client Summary Card */}
        <div className="bg-gray-50/80 dark:bg-neutral-900/80 rounded-2xl p-3.5 border border-gray-200/70 dark:border-neutral-800 mb-4 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                style={{ backgroundColor: statusColor }}
                className="w-8 h-8 rounded-xl text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs"
              >
                {(activeClient.name || 'C').charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {activeClient.name || 'Unnamed Client'}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-[10px] text-gray-500 dark:text-neutral-400 font-semibold bg-white dark:bg-neutral-800 px-1.5 py-0.2 rounded border border-gray-200 dark:border-neutral-700">
                    {activeClient.clientId}
                  </span>
                  <StatusBadge status={activeClient.status} size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Details Row: Venue, Date, Price */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200/60 dark:border-neutral-800 text-xs text-gray-600 dark:text-neutral-300">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate font-medium">
                {activeClient.district || activeClient.location || 'Kerala'}
              </span>
            </div>

            {activeClient.date && (
              <div className="flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate font-medium">{formatDate(activeClient.date)}</span>
              </div>
            )}

            {hasPrice && (
              <div className="flex items-center gap-1.5 truncate col-span-2">
                <IndianRupee className="w-3.5 h-3.5 text-gray-500 dark:text-neutral-400 shrink-0" />
                <span className="font-bold text-gray-900 dark:text-white">
                  ₹{activeClient.workPrice?.toLocaleString('en-IN')}
                </span>
                {hasAdvance && (
                  <span className="text-[11px] text-gray-400 dark:text-neutral-500">
                    (Adv: ₹{activeClient.advancePaid?.toLocaleString('en-IN')})
                  </span>
                )}
                {balance > 0 && (
                  <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                    • Bal: ₹{balance.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Warning Callout Box */}
        <div className="bg-red-50/70 dark:bg-red-950/30 rounded-2xl p-3 border border-red-200/80 dark:border-red-900/50 mb-4 text-xs text-red-900 dark:text-red-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#dc2626] dark:text-red-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-red-950 dark:text-red-200">Warning:</strong> All shooting dates,
            deliverables, milestones, notes, and payment records associated with this client will be
            removed from your active pipeline.
          </p>
        </div>

        {/* Permanent Delete Option Checkbox */}
        <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800/60 transition-colors mb-5 select-none">
          <input
            type="checkbox"
            checked={isPermanent}
            onChange={(e) => setIsPermanent(e.target.checked)}
            className="w-4 h-4 rounded text-[#dc2626] focus:ring-red-500 border-gray-300 dark:border-neutral-700 dark:bg-neutral-900 transition-all cursor-pointer accent-[#dc2626]"
          />
          <div className="text-xs">
            <span className="font-semibold text-gray-800 dark:text-neutral-200">
              Permanently purge from database
            </span>
            <span className="block text-[11px] text-gray-400 dark:text-neutral-500">
              {isPermanent
                ? 'Record will be wiped completely and cannot be restored.'
                : 'Unchecked: record will be archived safely and can be restored.'}
            </span>
          </div>
        </label>

        {/* Footer Buttons */}
        <DialogFooter className="gap-2 sm:gap-2 flex-col-reverse sm:flex-row justify-end pt-2 border-t border-gray-100 dark:border-neutral-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-xl text-xs font-semibold px-4 h-10 border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={() => handleDelete()}
            disabled={loading}
            className="rounded-xl text-xs font-bold px-4 h-10 bg-[#dc2626] hover:bg-red-700 active:scale-95 text-white flex items-center justify-center gap-1.5 shadow-md shadow-red-500/20 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isPermanent ? 'Delete Permanently' : 'Delete Client'}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
