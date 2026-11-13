'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Client, Status } from '@/types';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

export type EditField = 'name' | 'phone' | 'date' | 'status' | 'price';

interface ClientQuickEditModalProps {
  client: Client | null;
  field: EditField | null;
  statuses?: Status[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updated: Client) => void;
}

const FIELD_LABEL: Record<EditField, string> = {
  name: 'Name',
  phone: 'Phone',
  date: 'Event Date',
  status: 'Status',
  price: 'Work Price & Payment',
};

export function ClientQuickEditModal({
  client,
  field,
  statuses = [],
  open,
  onOpenChange,
  onSuccess,
}: ClientQuickEditModalProps) {
  const [value, setValue] = useState('');
  const [selectedStatusId, setSelectedStatusId] = useState('');
  const [workPrice, setWorkPrice] = useState('0');
  const [advancePaid, setAdvancePaid] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'advance-received' | 'partially-paid' | 'fully-paid'>('unpaid');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client || !field) return;
    if (field === 'name') setValue(client.name || '');
    if (field === 'phone') setValue(client.phone || '');
    if (field === 'date') setValue(client.date || '');
    if (field === 'status') {
      const currentId = typeof client.status === 'object' ? client.status._id : client.status;
      setSelectedStatusId(currentId || '');
    }
    if (field === 'price') {
      setWorkPrice(String(client.workPrice || 0));
      setAdvancePaid(String(client.advancePaid || 0));
      setPaymentStatus(client.paymentStatus || (client.advancePaid && client.advancePaid > 0 ? 'advance-received' : 'unpaid'));
    }
  }, [client, field, open]);

  const handleSave = async () => {
    if (!client || !field) return;
    setLoading(true);

    const body: Record<string, unknown> = {};
    if (field === 'name') body.name = value.trim();
    if (field === 'phone') body.phone = value.trim();
    if (field === 'date') body.date = value;
    if (field === 'status') body.statusId = selectedStatusId;
    if (field === 'price') {
      body.workPrice = parseFloat(workPrice) || 0;
      body.advancePaid = parseFloat(advancePaid) || 0;
      body.paymentStatus = paymentStatus;
    }

    try {
      const res = await fetch(`/api/clients/${client._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Update failed');
      const { data } = await res.json();
      toast.success(`${FIELD_LABEL[field]} updated`);
      onSuccess(data);
      onOpenChange(false);
    } catch {
      toast.error('Could not save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!field || !client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900">
            Edit {FIELD_LABEL[field]}
          </DialogTitle>
          <p className="text-xs text-gray-400 mt-0.5">{client.name || 'Unnamed Client'}</p>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {/* NAME */}
          {field === 'name' && (
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Client name"
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSave()}
              className="h-10 text-sm"
            />
          )}

          {/* PHONE */}
          {field === 'phone' && (
            <Input
              autoFocus
              type="tel"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="+91 98765 43210"
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSave()}
              className="h-10 text-sm font-mono"
            />
          )}

          {/* DATE */}
          {field === 'date' && (
            <div className="space-y-2">
              <Input
                autoFocus
                type="date"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-10 text-sm"
              />
              {value && (
                <p className="text-xs text-[#2C8567] font-medium">{formatDate(value)}</p>
              )}
            </div>
          )}

          {/* WORK PRICE & PAYMENT */}
          {field === 'price' && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-gray-700">Confirmed Work Price (₹)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <Input
                    autoFocus
                    type="number"
                    value={workPrice}
                    onChange={(e) => setWorkPrice(e.target.value)}
                    placeholder="Total amount"
                    className="pl-7 h-10 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700">Advance Received (₹)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <Input
                    type="number"
                    value={advancePaid}
                    onChange={(e) => {
                      setAdvancePaid(e.target.value);
                      const adv = parseFloat(e.target.value) || 0;
                      const tot = parseFloat(workPrice) || 0;
                      if (adv > 0 && tot > 0 && adv >= tot) {
                        setPaymentStatus('fully-paid');
                      } else if (adv > 0) {
                        setPaymentStatus('advance-received');
                      }
                    }}
                    placeholder="Advance paid"
                    className="pl-7 h-10 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Payment Status</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'unpaid', label: 'Unpaid', color: 'text-gray-600 bg-gray-50' },
                    { key: 'advance-received', label: 'Advance Paid', color: 'text-amber-700 bg-amber-50' },
                    { key: 'partially-paid', label: 'Partially Paid', color: 'text-blue-700 bg-blue-50' },
                    { key: 'fully-paid', label: 'Fully Paid ✅', color: 'text-emerald-700 bg-emerald-50' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() =>
                        setPaymentStatus(
                          p.key as
                            | 'unpaid'
                            | 'advance-received'
                            | 'partially-paid'
                            | 'fully-paid'
                        )
                      }
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        paymentStatus === p.key
                          ? 'border-[#2C8567] bg-[#2C8567]/10 text-[#2C8567] font-semibold ring-1 ring-[#2C8567]'
                          : `border-gray-200 ${p.color} hover:opacity-80`
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STATUS */}
          {field === 'status' && (
            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto modal-scroll">
              {statuses.map((s) => {
                const isSelected = selectedStatusId === s._id;
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => setSelectedStatusId(s._id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#2C8567] bg-[#2C8567]/5 ring-1 ring-[#2C8567]'
                        : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-sm text-gray-800 flex-1">{s.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#2C8567] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 flex-row justify-end pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-9 text-gray-600"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading || (field === 'status' && !selectedStatusId)}
            className="h-9 bg-[#2C8567] hover:bg-[#236d54] text-white min-w-[80px]"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
