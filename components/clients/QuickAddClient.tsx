'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { AlertCircle, User, Phone, CheckCircle2 } from 'lucide-react';

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
          if (defaultStatus && !statusId) {
            setStatusId(defaultStatus._id);
          }
        })
        .catch(() => {});
    }
  }, [open, statusId]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    // Must have at least a Name or a Phone
    if (!trimmedName && !trimmedPhone) {
      newErrors.name = 'Please provide either a Client Name or a Phone number';
      newErrors.phone = 'Please provide either a Client Name or a Phone number';
    }

    // If phone is provided, validate digits
    if (trimmedPhone) {
      const digits = trimmedPhone.replace(/\D/g, '');
      if (digits.length < 10) {
        newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
      }
    }

    setErrors(newErrors);

    if (newErrors.name && nameInputRef.current) {
      nameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nameInputRef.current.focus();
    } else if (newErrors.phone && phoneInputRef.current) {
      phoneInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      phoneInputRef.current.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          noteContent: noteContent.trim() || undefined,
          statusId: statusId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create client');
      }

      toast.success('Client added successfully', {
        icon: <CheckCircle2 className="w-4 h-4 text-[#2C8567]" />,
      });
      setName('');
      setPhone('');
      setNoteContent('');
      setErrors({});
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Quick Add Client
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Create a client inquiry or booking. Enter either a name or phone number.
            </DialogDescription>
          </DialogHeader>

          {/* General API Error Banner */}
          {errors.general && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to save client</p>
                <p className="text-red-600 mt-0.5">{errors.general}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 py-4">
            {/* Client Name */}
            <div className="space-y-1.5">
              <Label htmlFor="clientName" className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Client Name</span>
                <span className="text-[11px] font-normal text-gray-400">Optional if phone provided</span>
              </Label>
              <div className="relative">
                <Input
                  ref={nameInputRef}
                  id="clientName"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors((prev) => ({ ...prev, name: undefined }));
                    }
                  }}
                  className={errors.name ? 'border-red-400 bg-red-50/20 focus-visible:ring-red-400' : ''}
                  autoComplete="name"
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label htmlFor="clientPhone" className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Phone / WhatsApp Number</span>
                <span className="text-[11px] font-normal text-gray-400">e.g. 98765 43210</span>
              </Label>
              <Input
                ref={phoneInputRef}
                id="clientPhone"
                type="tel"
                placeholder="10-digit number (e.g. 9895943440)"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) {
                    setErrors((prev) => ({ ...prev, phone: undefined }));
                  }
                }}
                className={errors.phone ? 'border-red-400 bg-red-50/20 focus-visible:ring-red-400' : ''}
                autoComplete="tel"
              />
              {errors.phone && (
                <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Initial Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold text-gray-700">Initial Status</Label>
              <Select value={statusId} onValueChange={setStatusId}>
                <SelectTrigger className="h-10 sm:h-9 text-base sm:text-sm">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status._id} value={status._id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span>{status.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Initial Note / Requirements */}
            <div className="space-y-1.5">
              <Label htmlFor="noteContent" className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Initial Requirements / Notes</span>
                <span className="text-[11px] font-normal text-gray-400">Optional</span>
              </Label>
              <Textarea
                id="noteContent"
                placeholder="Event dates, location, requested packages, discussion points..."
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-[#2C8567] hover:bg-[#236d54] text-white"
            >
              {submitting ? 'Creating...' : 'Create Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

