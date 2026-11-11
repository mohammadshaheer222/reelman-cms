'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Status } from '@/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface QuickAddClientProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormErrors {
  name?: string;
  phone?: string;
  general?: string;
}

export function QuickAddClient({
  open,
  onOpenChange,
  onSuccess,
}: QuickAddClientProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [statusId, setStatusId] = useState('');
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setErrors({});
      fetch('/api/statuses')
        .then((res) => res.json())
        .then((data) => {
          const list: Status[] = data.data || [];
          setStatuses(list);
          const defaultStatus = list.find((s) => s.isDefault) || list[0];
          if (defaultStatus && !statusId) setStatusId(defaultStatus._id);
        })
        .catch(() => {});
    }
  }, [open, statusId]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName && !trimmedPhone) {
      newErrors.name = 'Name or phone required';
      newErrors.phone = 'Name or phone required';
    }
    if (trimmedPhone) {
      const digits = trimmedPhone.replace(/\D/g, '');
      if (digits.length < 10) newErrors.phone = 'Enter a valid phone number';
    }

    setErrors(newErrors);
    if (newErrors.name && nameInputRef.current) nameInputRef.current.focus();
    else if (newErrors.phone && phoneInputRef.current) phoneInputRef.current.focus();
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          date: date.trim() || undefined,
          noteContent: noteContent.trim() || undefined,
          statusId: statusId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create client');

      toast.success('Client added', {
        icon: <CheckCircle2 className="w-4 h-4 text-[#2C8567]" />,
      });
      setName(''); setPhone(''); setDate(''); setNoteContent(''); setErrors({});
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setErrors({ general: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">Add Client</DialogTitle>
          </DialogHeader>

          {errors.general && (
            <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          <div className="space-y-3 py-4">
            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor="clientName" className="text-xs font-medium text-gray-600">Name</Label>
              <Input
                ref={nameInputRef}
                id="clientName"
                placeholder="Rahul Sharma"
                value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                className={errors.name ? 'border-red-400 focus-visible:ring-red-400' : ''}
                autoComplete="name"
              />
              {errors.name && (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />{errors.name}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <Label htmlFor="clientPhone" className="text-xs font-medium text-gray-600">Phone / WhatsApp</Label>
              <Input
                ref={phoneInputRef}
                id="clientPhone"
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors((p) => ({ ...p, phone: undefined })); }}
                className={errors.phone ? 'border-red-400 focus-visible:ring-red-400' : ''}
                autoComplete="tel"
              />
              {errors.phone && (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />{errors.phone}
                </p>
              )}
            </div>

            {/* Date & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="clientDate" className="text-xs font-medium text-gray-600">Event Date</Label>
                <Input
                  id="clientDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="status" className="text-xs font-medium text-gray-600">Status</Label>
                <Select value={statusId} onValueChange={setStatusId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          <span>{s.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label htmlFor="noteContent" className="text-xs font-medium text-gray-600">Notes</Label>
              <Textarea
                id="noteContent"
                placeholder="Requirements, package details..."
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="flex-1 sm:flex-none bg-[#2C8567] hover:bg-[#236d54] text-white"
            >
              {submitting ? 'Adding…' : 'Add Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
