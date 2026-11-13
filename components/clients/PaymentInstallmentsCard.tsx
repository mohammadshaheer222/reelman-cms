'use client';

import React, { useState } from 'react';
import {
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageCircle,
  Receipt,
  Sparkles,
  ChevronRight,
  Edit2,
  Check,
  X,
  CreditCard,
  Building,
  Banknote,
  Send,
} from 'lucide-react';
import { Client, PaymentInstallment, createDefaultInstallments } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  openWhatsApp,
  formatPaymentReceiptWhatsAppMessage,
} from '@/lib/whatsapp';
import { toast } from 'sonner';

interface PaymentInstallmentsCardProps {
  client: Client;
  onUpdate: (updatedInstallments: PaymentInstallment[]) => Promise<void>;
  readOnly?: boolean;
}

export function PaymentInstallmentsCard({
  client,
  onUpdate,
  readOnly = false,
}: PaymentInstallmentsCardProps) {
  const [installments, setInstallments] = useState<PaymentInstallment[]>(
    client.installments && client.installments.length > 0
      ? client.installments
      : createDefaultInstallments(client.workPrice || 0, client.advancePaid || 0)
  );

  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'bank-transfer' | 'cheque'>('upi');
  const [saving, setSaving] = useState(false);

  // Edit installment amount
  const [editingInstallmentId, setEditingInstallmentId] = useState<string | null>(null);
  const [editAmountVal, setEditAmountVal] = useState('');

  const workPrice = client.workPrice || 0;
  const totalCollected = installments.reduce((sum, inst) => {
    return sum + (inst.status === 'paid' ? (inst.paidAmount || inst.amount || 0) : (inst.paidAmount || 0));
  }, 0);
  const remainingBalance = Math.max(0, workPrice - totalCollected);
  const percentCollected = workPrice > 0 ? Math.min(100, Math.round((totalCollected / workPrice) * 100)) : 0;

  const handleOpenMarkPaid = (inst: PaymentInstallment) => {
    setMarkingPaidId(inst.id);
    setPaidAmountInput(String(inst.amount));
    setPaymentMethod((inst.paymentMethod as 'upi' | 'cash' | 'bank-transfer' | 'cheque') || 'upi');
  };

  const handleConfirmMarkPaid = async () => {
    if (!markingPaidId) return;
    const numericPaid = parseFloat(paidAmountInput) || 0;
    const updated = installments.map((inst) => {
      if (inst.id === markingPaidId) {
        return {
          ...inst,
          status: 'paid' as const,
          paidAmount: numericPaid,
          paidAt: new Date().toISOString(),
          paymentMethod,
        };
      }
      return inst;
    });

    setInstallments(updated);
    setMarkingPaidId(null);
    setSaving(true);
    try {
      await onUpdate(updated);
      toast.success('Installment marked as Paid ✅');
    } catch {
      toast.error('Failed to update installment');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePending = async (instId: string) => {
    const updated = installments.map((inst) => {
      if (inst.id === instId) {
        return {
          ...inst,
          status: 'pending' as const,
          paidAmount: 0,
          paidAt: undefined,
        };
      }
      return inst;
    });

    setInstallments(updated);
    setSaving(true);
    try {
      await onUpdate(updated);
      toast.success('Installment reverted to Pending');
    } catch {
      toast.error('Failed to update installment');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustomAmount = async (instId: string) => {
    const numeric = parseFloat(editAmountVal) || 0;
    const updated = installments.map((inst) => {
      if (inst.id === instId) {
        return {
          ...inst,
          amount: numeric,
          percentage: workPrice > 0 ? Math.round((numeric / workPrice) * 100) : inst.percentage,
        };
      }
      return inst;
    });

    setInstallments(updated);
    setEditingInstallmentId(null);
    setSaving(true);
    try {
      await onUpdate(updated);
      toast.success('Amount updated');
    } catch {
      toast.error('Failed to save amount');
    } finally {
      setSaving(false);
    }
  };

  const handleSendReceipt = (inst: PaymentInstallment) => {
    if (!client.phone) {
      toast.error('No phone number saved for this client.');
      return;
    }
    const portalUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/portal/${client._id}`
        : undefined;

    const message = formatPaymentReceiptWhatsAppMessage({
      name: client.name,
      amountPaid: inst.paidAmount || inst.amount,
      paymentMethod: inst.paymentMethod || 'UPI',
      remainingBalance,
      stageName: inst.name,
      portalUrl,
    });

    openWhatsApp(client.phone, client.name, message);
  };

  const handleSendReminder = (inst: PaymentInstallment) => {
    if (!client.phone) {
      toast.error('No phone number saved for this client.');
      return;
    }
    const portalUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/portal/${client._id}`
        : undefined;

    const msg = `Hi ${client.name || 'there'}! 👋 Gentle reminder from *Reelman Production* regarding your upcoming installment payment of *₹${inst.amount.toLocaleString(
      'en-IN'
    )}* for *${inst.name}* (Due: ${inst.dueDate || 'On Shoot Day'}).\n\nYou can view your booking details & invoice here:\n${portalUrl}`;

    openWhatsApp(client.phone, client.name, msg);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Financial Summary & Collection Progress */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-[#2C8567]">
                <IndianRupee className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-gray-900">
                Payment Installment Schedule
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Structured 3-tier milestone schedule: Advance, Event Day, and Final Delivery.
            </p>
          </div>

          {/* Quick Stats Pill (Responsive 2-col on mobile) */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 text-xs font-semibold w-full sm:w-auto">
            <span className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-center sm:text-left">
              Collected: <strong className="font-mono text-sm block sm:inline">₹{totalCollected.toLocaleString('en-IN')}</strong>
            </span>
            <span className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-center sm:text-left">
              Balance: <strong className="font-mono text-sm block sm:inline">₹{remainingBalance.toLocaleString('en-IN')}</strong>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
            <span>Payment Progress ({percentCollected}%)</span>
            <span className="font-mono font-bold text-gray-900">
              ₹{totalCollected.toLocaleString('en-IN')} / ₹{workPrice.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200/60">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                percentCollected === 100
                  ? 'bg-emerald-600'
                  : percentCollected > 50
                  ? 'bg-[#2C8567]'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${percentCollected}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3 Milestone Installment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {installments.map((inst, index) => {
          const isPaid = inst.status === 'paid';
          const isEditing = editingInstallmentId === inst.id;

          return (
            <div
              key={inst.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isPaid
                  ? 'bg-emerald-50/40 border-emerald-200 shadow-2xs'
                  : 'bg-white border-gray-100 hover:border-gray-200 shadow-xs'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Stage badge & Status Flag */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Stage {index + 1}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      isPaid
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {isPaid ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-[#2C8567]" />
                        <span>Paid ✅</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Due ⏳</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Title & Trigger Due */}
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{inst.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{inst.dueDate}</p>
                </div>

                {/* Amount display or editing */}
                {isEditing ? (
                  <div className="flex items-center gap-1.5 pt-1">
                    <Input
                      type="number"
                      value={editAmountVal}
                      onChange={(e) => setEditAmountVal(e.target.value)}
                      className="h-8 text-sm font-bold font-mono"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-600"
                      onClick={() => handleSaveCustomAmount(inst.id)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-400"
                      onClick={() => setEditingInstallmentId(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <p className="text-2xl font-bold font-mono text-gray-900">
                        ₹{inst.amount.toLocaleString('en-IN')}
                      </p>
                      {isPaid && inst.paidAmount && inst.paidAmount !== inst.amount && (
                        <p className="text-[11px] text-emerald-700 font-medium">
                          Paid: ₹{inst.paidAmount.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>

                    {!readOnly && !isPaid && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingInstallmentId(inst.id);
                          setEditAmountVal(String(inst.amount));
                        }}
                        className="text-gray-400 hover:text-gray-700 p-1"
                        title="Edit Amount"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Paid Details if Paid */}
                {isPaid && (
                  <div className="text-[11px] text-gray-600 bg-emerald-100/40 p-2 rounded-lg border border-emerald-200/60 flex items-center justify-between">
                    <span>Mode: <strong className="uppercase">{inst.paymentMethod || 'UPI'}</strong></span>
                    {inst.paidAt && (
                      <span className="text-gray-500">
                        {new Date(inst.paidAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!readOnly && (
                <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between gap-2">
                  {isPaid ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePending(inst.id)}
                        className="h-7 text-xs text-gray-500 hover:text-gray-800"
                      >
                        Undo
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSendReceipt(inst)}
                        className="h-7 text-xs bg-[#2C8567] hover:bg-[#236d54] text-white gap-1 px-2.5"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Send Receipt</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendReminder(inst)}
                        className="h-7 text-xs text-gray-600 hover:text-gray-900 gap-1"
                      >
                        <MessageCircle className="w-3 h-3 text-[#2C8567]" />
                        <span>Reminder</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleOpenMarkPaid(inst)}
                        className="h-7 text-xs bg-gray-900 hover:bg-black text-white px-3 font-semibold"
                      >
                        Mark Paid ✅
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mark as Paid Dialog */}
      <Dialog open={!!markingPaidId} onOpenChange={(open) => !open && setMarkingPaidId(null)}>
        <DialogContent className="!w-[calc(100%-1.5rem)] sm:!w-full !max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">
              Record Payment Received
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-700">
                Amount Received (₹)
              </label>
              <Input
                type="number"
                value={paidAmountInput}
                onChange={(e) => setPaidAmountInput(e.target.value)}
                className="mt-1 font-mono text-base font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['upi', 'cash', 'bank-transfer', 'cheque'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold uppercase border transition-all text-center ${
                      paymentMethod === method
                        ? 'bg-[#2C8567] text-white border-[#2C8567] shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {method === 'bank-transfer' ? 'Bank' : method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMarkingPaidId(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmMarkPaid}
              disabled={saving}
              className="text-xs bg-[#2C8567] hover:bg-[#236d54] text-white font-semibold"
            >
              Confirm Received ✅
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
