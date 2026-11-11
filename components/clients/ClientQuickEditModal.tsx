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
import { Check, Loader2 } from 'lucide-react';
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

const FIELD_LABEL: Record<EditField, string> = {
  name: 'Name',
  phone: 'Phone',
  date: 'Event Date',
  status: 'Status',
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
      <DialogContent className="max-w-xs p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900">
            Edit {FIELD_LABEL[field]}
          </DialogTitle>
          <p className="text-xs text-gray-400 mt-0.5">{client.name || 'Unnamed Client'}</p>
        </DialogHeader>

        <div className="py-2">
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
