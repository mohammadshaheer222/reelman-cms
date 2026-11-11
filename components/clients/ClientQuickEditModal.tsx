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
import { Client, Status } from '@/types';
import { Check, Loader2, User, Phone, Calendar, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

type EditField = 'name' | 'phone' | 'date' | 'status';

interface ClientQuickEditModalProps {
  client: Client | null;
  field: EditField | null;
  statuses?: Status[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updated: Client) => void;
}

const FIELD_META: Record<EditField, { label: string; icon: React.ElementType; description: string }> = {
  name: {
    label: 'Client Name',
    icon: User,
    description: 'Update the client or lead name.',
  },
  phone: {
    label: 'Phone Number',
    icon: Phone,
    description: 'Enter the WhatsApp-enabled phone number.',
  },
  date: {
    label: 'Event / Shoot Date',
    icon: Calendar,
    description: 'Set the event or shoot date for this client.',
  },
  status: {
    label: 'Pipeline Status',
    icon: Tag,
    description: 'Move this client to a different pipeline stage.',
  },
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
  const [loading, setLoading] = useState(false);

  // Populate current value when modal opens
  useEffect(() => {
    if (!client || !field) return;
    if (field === 'name') setValue(client.name || '');
    if (field === 'phone') setValue(client.phone || '');
    if (field === 'date') setValue(client.date || '');
    if (field === 'status') {
      const currentId = typeof client.status === 'object' ? client.status._id : client.status;
      setSelectedStatusId(currentId || '');
    }
  }, [client, field, open]);

  const handleSave = async () => {
    if (!client || !field) return;
    setLoading(true);

    const body: Record<string, string> = {};
    if (field === 'name') body.name = value.trim();
    if (field === 'phone') body.phone = value.trim();
    if (field === 'date') body.date = value;
    if (field === 'status') body.statusId = selectedStatusId;

    try {
      const res = await fetch(`/api/clients/${client._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Update failed');
      const { data } = await res.json();
      toast.success(`${FIELD_META[field].label} updated`);
      onSuccess(data);
      onOpenChange(false);
    } catch {
      toast.error('Could not save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!field || !client) return null;
  const meta = FIELD_META[field];
  const Icon = meta.icon;

  const currentStatusObj = statuses.find((s) => s._id === selectedStatusId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)] p-5 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#2C8567]/10 flex items-center justify-center shrink-0">
              <Icon className="w-4.5 h-4.5 text-[#2C8567]" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900">
                Edit {meta.label}
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-2 py-1 w-fit">
            {client.clientId} · {client.name || 'Unnamed Client'}
          </p>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* NAME */}
          {field === 'name' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Full Name</label>
              <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter client name"
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSave()}
                className="h-10 text-sm"
              />
            </div>
          )}

          {/* PHONE */}
          {field === 'phone' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Phone Number</label>
              <Input
                autoFocus
                type="tel"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="+91 98765 43210"
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSave()}
                className="h-10 text-sm font-mono"
              />
              <p className="text-[11px] text-gray-400">
                Include country code for WhatsApp (e.g. +91 for India)
              </p>
            </div>
          )}

          {/* DATE */}
          {field === 'date' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Event / Shoot Date</label>
              <Input
                autoFocus
                type="date"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-10 text-sm"
              />
              {value && (
                <p className="text-xs text-[#2C8567] font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(value)}
                </p>
              )}
            </div>
          )}

          {/* STATUS */}
          {field === 'status' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Select Pipeline Status</label>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-0.5">
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
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-sm font-medium text-gray-800 flex-1">{s.name}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#2C8567] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
              {currentStatusObj && (
                <p className="text-xs text-gray-500">
                  Currently:{' '}
                  <span
                    className="font-semibold"
                    style={{ color: currentStatusObj.color }}
                  >
                    {currentStatusObj.name}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2 flex-row justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-9"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading || (field === 'status' && !selectedStatusId)}
            className="h-9 bg-[#2C8567] hover:bg-[#236d54] text-white font-semibold gap-1.5 min-w-[90px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
