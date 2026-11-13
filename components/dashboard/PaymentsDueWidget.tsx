'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IndianRupee,
  Clock,
  AlertTriangle,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Client, PaymentInstallment, createDefaultInstallments } from '@/types';
import { openWhatsApp } from '@/lib/whatsapp';
import { toast } from 'sonner';

interface PendingPaymentItem {
  client: Client;
  installment: PaymentInstallment;
  isOverdue: boolean;
  daysDiff: number; // negative if overdue, positive if in future
}

export function PaymentsDueWidget() {
  const [items, setItems] = useState<PendingPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingPayments = async () => {
    try {
      const res = await fetch('/api/clients?limit=60');
      const json = await res.json();
      if (!json.data) return;

      const clients: Client[] = json.data;
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const collectedItems: PendingPaymentItem[] = [];

      clients.forEach((client) => {
        if (client.isArchived) return;
        const workPrice = client.workPrice || 0;
        if (workPrice === 0) return;

        const installments =
          client.installments && client.installments.length > 0
            ? client.installments
            : createDefaultInstallments(workPrice, client.advancePaid || 0);

        const shootDate = client.date ? new Date(client.date) : null;

        installments.forEach((inst) => {
          if (inst.status === 'paid') return;

          let isDueThisMonth = false;
          let daysDiff = 0;
          let isOverdue = false;

          if (shootDate && !isNaN(shootDate.getTime())) {
            const diffTime = shootDate.getTime() - now.getTime();
            daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // If shoot is this month or overdue
            if (
              (shootDate.getMonth() === currentMonth && shootDate.getFullYear() === currentYear) ||
              daysDiff < 0
            ) {
              isDueThisMonth = true;
            }
            if (daysDiff < 0) {
              isOverdue = true;
            }
          } else {
            // No shoot date, but advance is unpaid
            if (inst.id === 'advance') {
              isDueThisMonth = true;
            }
          }

          if (isDueThisMonth || isOverdue) {
            collectedItems.push({
              client,
              installment: inst,
              isOverdue,
              daysDiff,
            });
          }
        });
      });

      // Sort: overdue first, then nearest due date
      collectedItems.sort((a, b) => a.daysDiff - b.daysDiff);
      setItems(collectedItems);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const totalDueThisMonth = items.reduce((sum, item) => sum + item.installment.amount, 0);

  const handleSendReminder = (item: PendingPaymentItem) => {
    if (!item.client.phone) {
      toast.error('No phone number for this client');
      return;
    }
    const portalUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/portal/${item.client._id}`
        : undefined;

    const formattedDate = item.client.date
      ? new Date(item.client.date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        })
      : 'your shoot';

    const msg = `Hi ${item.client.name || 'there'}! 👋 Following up from *Reelman Production* regarding the pending installment of *₹${item.installment.amount.toLocaleString(
      'en-IN'
    )}* for *${item.installment.name}* (Event Date: ${formattedDate}).\n\nView your booking summary & payment link:\n${portalUrl}`;

    openWhatsApp(item.client.phone, item.client.name, msg);
  };

  const handleQuickMarkPaid = async (item: PendingPaymentItem) => {
    try {
      const currentInsts =
        item.client.installments && item.client.installments.length > 0
          ? item.client.installments
          : createDefaultInstallments(item.client.workPrice || 0, item.client.advancePaid || 0);

      const updated = currentInsts.map((inst) => {
        if (inst.id === item.installment.id) {
          return {
            ...inst,
            status: 'paid' as const,
            paidAmount: inst.amount,
            paidAt: new Date().toISOString(),
          };
        }
        return inst;
      });

      const res = await fetch(`/api/clients/${item.client._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installments: updated }),
      });

      if (!res.ok) throw new Error('Update failed');

      toast.success(`Marked ₹${item.installment.amount.toLocaleString('en-IN')} as Paid ✅`);
      fetchPendingPayments();
    } catch {
      toast.error('Failed to mark installment paid');
    }
  };

  if (loading) {
    return (
      <Card className="shadow-xs border-gray-100 p-5">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-[#2C8567] animate-pulse" />
          <p className="text-xs text-gray-400">Loading payments due this month...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs border-gray-100 flex flex-col justify-between overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2 border-b border-gray-100/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-900 flex items-center justify-center font-bold">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-gray-900">
              Payments Due This Month
            </CardTitle>
            <p className="text-xs text-gray-500">
              Never chase payments without records • {items.length} pending installment{items.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {totalDueThisMonth > 0 && (
          <div className="text-left sm:text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
              Total Outstanding
            </span>
            <p className="text-lg font-bold font-mono text-amber-950 leading-tight">
              ₹{totalDueThisMonth.toLocaleString('en-IN')}
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-3 flex-1 px-4 sm:px-6">
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-semibold text-gray-700">All Clear!</p>
            <p>No overdue or pending payments due this month.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 space-y-2">
            {items.slice(0, 5).map((item, idx) => (
              <div
                key={`${item.client._id}-${item.installment.id}-${idx}`}
                className="pt-2.5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-gray-50/60 p-2 rounded-xl transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/clients/${item.client._id}`}
                      className="font-bold text-gray-900 text-sm hover:text-[#2C8567] transition-colors truncate"
                    >
                      {item.client.name || 'Unnamed Client'}
                    </Link>

                    {item.isOverdue ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>Overdue</span>
                      </span>
                    ) : item.daysDiff === 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        Due Today
                      </span>
                    ) : item.daysDiff > 0 ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        In {item.daysDiff}d
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                    <span className="font-semibold text-gray-700">
                      {item.installment.name}
                    </span>
                    <span>•</span>
                    {item.client.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>
                          {new Date(item.client.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="text-base font-bold font-mono text-gray-900">
                    ₹{item.installment.amount.toLocaleString('en-IN')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {item.client.phone && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendReminder(item)}
                        className="h-7 text-xs text-emerald-800 border-emerald-200 hover:bg-emerald-50 px-2 gap-1"
                        title="Send WhatsApp payment reminder"
                      >
                        <MessageCircle className="w-3 h-3 text-[#2C8567]" />
                        <span className="hidden sm:inline">Remind</span>
                      </Button>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleQuickMarkPaid(item)}
                      className="h-7 text-xs bg-gray-900 hover:bg-black text-white px-2.5 font-semibold"
                      title="Mark installment paid"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      <span>Paid</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
