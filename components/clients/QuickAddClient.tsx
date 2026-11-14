'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Status, Requirement, CalendarShootEvent } from '@/types';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Plus,
  X,
  MapPin,
  Upload,
  FileText,
  Loader2,
  Sparkles,
  IndianRupee,
  Check,
  Package,
  Layers,
  Phone,
  Trash2,
  Tag,
  MessageSquare,
  ChevronDown,
  Search,
} from 'lucide-react';

interface QuickAddClientProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatusId?: string;
  onSuccess?: () => void;
}

interface FormErrors {
  name?: string;
  phone?: string;
  general?: string;
}

function formatFriendlyDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return '';
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

export function QuickAddClient({
  open,
  onOpenChange,
  defaultStatusId,
  onSuccess,
}: QuickAddClientProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [dates, setDates] = useState<string[]>(['']);

  // Requirements state: multi-selection dropdown with saved requirements
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);
  const [savedRequirements, setSavedRequirements] = useState<Requirement[]>([]);
  const [reqSearch, setReqSearch] = useState('');
  const [newCustomReq, setNewCustomReq] = useState('');
  const [showReqDropdown, setShowReqDropdown] = useState(false);
  const reqDropdownRef = useRef<HTMLDivElement>(null);

  // Close requirements dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (reqDropdownRef.current && !reqDropdownRef.current.contains(e.target as Node)) {
        setShowReqDropdown(false);
      }
    }
    if (showReqDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showReqDropdown]);

  // Pricing & Commercials
  const [workPrice, setWorkPrice] = useState('');
  const [advancePaid, setAdvancePaid] = useState('');

  // Separate Fields: Notes vs Package Details (Switched via clean tabs to avoid congestion)
  const [activeTab, setActiveTab] = useState<'notes' | 'package'>('notes');
  const [packageDetails, setPackageDetails] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Status & Pipeline (Dropdown)
  const [statusId, setStatusId] = useState('');
  const [statuses, setStatuses] = useState<Status[]>([]);

  // State flags
  const [submitting, setSubmitting] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [pdfSource, setPdfSource] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Availability conflict detector state
  const [existingShootsMap, setExistingShootsMap] = useState<Record<string, CalendarShootEvent[]>>({});

  const getConflictsForDate = (dateStr: string) => {
    if (!dateStr || !dateStr.trim()) return [];
    return existingShootsMap[dateStr.trim()] || [];
  };

  // Fetch statuses and saved requirements when modal opens
  useEffect(() => {
    if (open) {
      setErrors({});
      fetch('/api/statuses')
        .then((res) => res.json())
        .then((data) => {
          const list: Status[] = data.data || [];
          setStatuses(list);
          if (defaultStatusId) {
            setStatusId(defaultStatusId);
          } else {
            const defaultStatus = list.find((s) => s.isDefault) || list[0];
            if (defaultStatus && !statusId) setStatusId(defaultStatus._id);
          }
        })
        .catch(() => {});

      fetch('/api/requirements')
        .then((res) => res.json())
        .then((data) => {
          setSavedRequirements(data.data || []);
        })
        .catch(() => {});

      fetch('/api/calendar')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.dateMap) {
            setExistingShootsMap(data.dateMap);
          }
        })
        .catch(() => {});
    }
  }, [open, defaultStatusId]);

  const handleAddDate = () => {
    setDates((prev) => {
      const lastFilled = [...prev].reverse().find(Boolean);
      if (lastFilled) {
        try {
          const [y, m, d] = lastFilled.split('-').map(Number);
          const nextDate = new Date(y, m - 1, d + 1);
          if (!isNaN(nextDate.getTime())) {
            const yyyy = nextDate.getFullYear();
            const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
            const dd = String(nextDate.getDate()).padStart(2, '0');
            return [...prev, `${yyyy}-${mm}-${dd}`];
          }
        } catch {}
      }
      return [...prev, ''];
    });
  };

  const handleDateChange = (index: number, val: string) => {
    setDates((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemoveDate = (index: number) => {
    setDates((prev) => {
      if (prev.length <= 1) return [''];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleToggleRequirement = (reqName: string) => {
    setSelectedRequirements((prev) =>
      prev.includes(reqName) ? prev.filter((r) => r !== reqName) : [...prev, reqName]
    );
  };

  const handleAddRequirement = async (nameToAdd?: string) => {
    const trimmed = (nameToAdd || reqSearch).trim();
    if (!trimmed) return;

    if (!selectedRequirements.includes(trimmed)) {
      setSelectedRequirements((prev) => [...prev, trimmed]);
    }
    setReqSearch('');

    const alreadySaved = savedRequirements.some(
      (r) => r.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (!alreadySaved) {
      try {
        const res = await fetch('/api/requirements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        });
        const data = await res.json();
        if (res.ok && data.data) {
          setSavedRequirements((prev) => [...prev, data.data]);
        }
      } catch {}
    }
  };

  const handleRemoveRequirement = (reqName: string) => {
    setSelectedRequirements((prev) => prev.filter((r) => r !== reqName));
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a valid PDF file');
      return;
    }

    setExtractingPdf(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/pdf-extract', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract text from PDF');
      }

      const extracted = data.text;
      setPdfSource(file.name);
      setPackageDetails((prev) => (prev ? `${prev}\n\n${extracted}` : extracted));
      setActiveTab('package');
      toast.success(`Converted ${file.name} to package text`, {
        icon: <CheckCircle2 className="w-4 h-4 text-[#dc2626]" />,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error extracting PDF text';
      toast.error(msg);
    } finally {
      setExtractingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName && !trimmedPhone) {
      newErrors.name = 'Please enter client name or phone';
      newErrors.phone = 'Please enter client name or phone';
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

    const validDates = dates.map((d) => d.trim()).filter(Boolean);
    const numericPrice = parseFloat(workPrice) || 0;
    const numericAdvance = parseFloat(advancePaid) || 0;

    let paymentStatus: 'unpaid' | 'advance-received' | 'partially-paid' | 'fully-paid' = 'unpaid';
    if (numericAdvance > 0 && numericPrice > 0 && numericAdvance >= numericPrice) {
      paymentStatus = 'fully-paid';
    } else if (numericAdvance > 0) {
      paymentStatus = 'advance-received';
    }

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          location: location.trim() || undefined,
          date: validDates[0] || undefined,
          dates: validDates,
          requirements: selectedRequirements,
          workPrice: numericPrice,
          advancePaid: numericAdvance,
          paymentStatus,
          packageDetails: packageDetails.trim() || undefined,
          noteContent: noteContent.trim() || undefined,
          statusId: statusId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create client');

      toast.success('Client added successfully', {
        icon: <CheckCircle2 className="w-4 h-4 text-[#dc2626]" />,
      });

      // Reset form
      setName('');
      setPhone('');
      setLocation('');
      setDates(['']);
      setSelectedRequirements([]);
      setReqSearch('');
      setNewCustomReq('');
      setShowReqDropdown(false);
      setWorkPrice('');
      setAdvancePaid('');
      setPackageDetails('');
      setNoteContent('');
      setPdfSource(null);
      setErrors({});

      onOpenChange(false);
      onSuccess?.();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('client-created', { detail: data.data }));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setErrors({ general: message });
    } finally {
      setSubmitting(false);
    }
  };

  const activeStatus = statuses.find((s) => s._id === statusId);

  const filteredSavedReqs = savedRequirements.filter((r) =>
    r.name.toLowerCase().includes(reqSearch.toLowerCase().trim())
  );
  const hasExactReqMatch = savedRequirements.some(
    (r) => r.name.toLowerCase() === reqSearch.toLowerCase().trim()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[calc(100%-1.5rem)] sm:!w-full !max-w-lg !max-h-[85dvh] !p-0 !flex !flex-col !overflow-hidden rounded-2xl shadow-2xl border border-gray-100 bg-white">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full max-h-[85dvh] min-h-0 flex-1 overflow-x-hidden">
          {/* Header */}
          <DialogHeader className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3.5 border-b border-gray-100 flex flex-row items-center justify-between shrink-0">
            <div className="min-w-0 pr-2">
              <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate">
                Add New Client
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                Record inquiry details and client booking info
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeStatus && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5"
                  style={{
                    backgroundColor: `${activeStatus.color}15`,
                    color: activeStatus.color,
                    borderColor: `${activeStatus.color}35`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: activeStatus.color }}
                  />
                  {activeStatus.name}
                </span>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </DialogHeader>

          {/* Clean, Spacious Form Body (Strictly no horizontal scroll, perfectly bounded) */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4 modal-scroll">
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Row 1: Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="clientName" className="text-xs font-semibold text-gray-700">
                  Client Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={nameInputRef}
                  id="clientName"
                  placeholder="e.g. Rahul & Pooja"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                  }}
                  className={`h-9.5 text-sm ${
                    errors.name ? 'border-red-400 focus-visible:ring-red-400' : ''
                  }`}
                  autoComplete="name"
                />
                {errors.name && <p className="text-[11px] text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clientPhone" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span>Phone / WhatsApp</span>
                </Label>
                <Input
                  ref={phoneInputRef}
                  id="clientPhone"
                  type="tel"
                  placeholder="e.g. 98765 43210"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }));
                  }}
                  className={`h-9.5 text-sm ${
                    errors.phone ? 'border-red-400 focus-visible:ring-red-400' : ''
                  }`}
                  autoComplete="tel"
                />
                {errors.phone && <p className="text-[11px] text-red-500">{errors.phone}</p>}
              </div>
            </div>

            {/* Row 2: Client Status & Shoot Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-gray-400" />
                  <span>Client Status</span>
                </Label>
                <Select value={statusId} onValueChange={setStatusId}>
                  <SelectTrigger className="h-9.5 text-sm bg-white">
                    <SelectValue placeholder="Select status">
                      {activeStatus && (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: activeStatus.color }}
                          />
                          <span className="font-medium text-gray-800">{activeStatus.name}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-white border border-gray-100 shadow-xl rounded-xl">
                    {statuses.map((s) => (
                      <SelectItem key={s._id} value={s._id} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="font-medium text-gray-800">{s.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clientLocation" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span>Shoot Location / Venue</span>
                </Label>
                <Input
                  id="clientLocation"
                  placeholder="e.g. Bangalore, Taj West End"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-9.5 text-sm"
                />
              </div>
            </div>

            {/* Row 3: Event Date & Agreed Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Event Date(s) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#2C8567]" />
                    <span>Event Date</span>
                  </Label>
                  {dates.length <= 1 ? (
                    <button
                      type="button"
                      onClick={handleAddDate}
                      className="text-[11px] font-semibold text-[#2C8567] hover:underline"
                    >
                      + Multi-day shoot
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAddDate}
                      className="text-[11px] font-semibold text-[#2C8567] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add day</span>
                    </button>
                  )}
                </div>

                {dates.length === 1 ? (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Input
                        type="date"
                        value={dates[0]}
                        onChange={(e) => handleDateChange(0, e.target.value)}
                        className={`h-9.5 text-xs sm:text-sm bg-white ${
                          dates[0] && getConflictsForDate(dates[0]).length > 0
                            ? 'border-amber-400 focus-visible:ring-amber-400'
                            : ''
                        }`}
                      />
                      {dates[0] && formatFriendlyDate(dates[0]) && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded pointer-events-none border border-emerald-200/60 hidden sm:inline">
                          {formatFriendlyDate(dates[0])}
                        </span>
                      )}
                    </div>

                    {/* Real-time Availability Conflict Alert */}
                    {dates[0] && getConflictsForDate(dates[0]).length > 0 && (
                      <div className="p-2 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs animate-in fade-in slide-in-from-top-1 shadow-2xs">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            Availability Conflict: {getConflictsForDate(dates[0]).length} shoot{getConflictsForDate(dates[0]).length > 1 ? 's' : ''} already scheduled
                          </span>
                        </div>
                        <div className="mt-1 space-y-1">
                          {getConflictsForDate(dates[0]).map((c) => (
                            <div
                              key={c._id}
                              className="flex items-center justify-between text-[11px] bg-white/80 px-2 py-0.5 rounded-md border border-amber-200/60"
                            >
                              <span className="font-medium text-gray-900 truncate">
                                {c.name || 'Unnamed Client'}{c.location ? ` • ${c.location}` : ''}
                              </span>
                              {c.status && (
                                <span
                                  className="text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0"
                                  style={{
                                    backgroundColor: `${c.status.color}20`,
                                    color: c.status.color,
                                  }}
                                >
                                  {c.status.name}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dates.map((d, index) => {
                      const friendly = formatFriendlyDate(d);
                      const dayConflicts = getConflictsForDate(d);
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono font-bold text-gray-400 w-11 shrink-0">
                              Day {index + 1}:
                            </span>
                            <Input
                              type="date"
                              value={d}
                              onChange={(e) => handleDateChange(index, e.target.value)}
                              className={`h-9 text-xs sm:text-sm flex-1 bg-white ${
                                d && dayConflicts.length > 0
                                  ? 'border-amber-400 focus-visible:ring-amber-400'
                                  : ''
                              }`}
                            />
                            {friendly && (
                              <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0 hidden sm:inline">
                                {friendly}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveDate(index)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                              title="Remove day"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {d && dayConflicts.length > 0 && (
                            <div className="ml-12 p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                              <span className="font-semibold text-amber-800">
                                ⚠️ Overlap: {dayConflicts.length} shoot{dayConflicts.length > 1 ? 's' : ''} on this day ({dayConflicts.map((c) => c.name).join(', ')})
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Confirmed Work Price */}
              <div className="space-y-1.5">
                <Label htmlFor="clientWorkPrice" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-gray-400" />
                  <span>Confirmed Price (₹)</span>
                </Label>
                <Input
                  id="clientWorkPrice"
                  type="number"
                  placeholder="e.g. 150000"
                  value={workPrice}
                  onChange={(e) => setWorkPrice(e.target.value)}
                  className="h-9.5 text-sm font-mono"
                />
              </div>
            </div>

            {/* Row 4: Advance Paid & Requirements Tag Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="clientAdvancePaid" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-gray-400" />
                  <span>Advance Paid (₹)</span>
                </Label>
                <Input
                  id="clientAdvancePaid"
                  type="number"
                  placeholder="e.g. 25000"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(e.target.value)}
                  className="h-9.5 text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5" ref={reqDropdownRef}>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Client Requirements</span>
                  </Label>
                  {selectedRequirements.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedRequirements([])}
                      className="text-[11px] font-medium text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Clear ({selectedRequirements.length})
                    </button>
                  )}
                </div>

                <div className="relative">
                  {/* Dropdown Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowReqDropdown((prev) => !prev)}
                    className={`w-full h-9.5 px-3 rounded-xl border text-xs sm:text-sm bg-white flex items-center justify-between transition-colors shadow-2xs ${
                      showReqDropdown
                        ? 'border-[#2C8567] ring-1 ring-[#2C8567]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {selectedRequirements.length === 0 ? (
                        <span className="text-gray-400">Select requirements...</span>
                      ) : (
                        <span className="font-medium text-gray-800 truncate">
                          {selectedRequirements.length === 1
                            ? selectedRequirements[0]
                            : `${selectedRequirements.length} requirements selected`}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-150 ${
                        showReqDropdown ? 'rotate-180 text-[#2C8567]' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {showReqDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      {/* Search & Custom Add Input */}
                      <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <Input
                            placeholder="Search or type new..."
                            value={reqSearch}
                            onChange={(e) => setReqSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (reqSearch.trim()) {
                                  handleAddRequirement(reqSearch.trim());
                                }
                              }
                            }}
                            className="h-8 pl-8 text-xs bg-white rounded-lg"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Requirements List (Multi-Select) */}
                      <div className="max-h-48 overflow-y-auto p-1 space-y-0.5 modal-scroll">
                        {/* Option to create new if typed and no exact match */}
                        {reqSearch.trim() && !hasExactReqMatch && (
                          <button
                            type="button"
                            onClick={() => handleAddRequirement(reqSearch.trim())}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#2C8567] hover:bg-emerald-50 rounded-lg transition-colors font-semibold text-left"
                          >
                            <Plus className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Add & select &ldquo;{reqSearch.trim()}&rdquo;</span>
                          </button>
                        )}

                        {filteredSavedReqs.length === 0 && !reqSearch.trim() && (
                          <div className="py-3 text-center text-xs text-gray-400">
                            No saved requirements found
                          </div>
                        )}

                        {filteredSavedReqs.map((req) => {
                          const isSelected = selectedRequirements.includes(req.name);
                          return (
                            <button
                              key={req._id}
                              type="button"
                              onClick={() => handleToggleRequirement(req.name)}
                              className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors text-left ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-900 font-semibold'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <div
                                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                    isSelected
                                      ? 'bg-[#2C8567] border-[#2C8567] text-white'
                                      : 'border-gray-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                                </div>
                                <span className="truncate">{req.name}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Add New Requirement Option Section */}
                      <div className="p-2 border-t border-gray-100 bg-gray-50/80">
                        <div className="flex items-center gap-1.5">
                          <Input
                            placeholder="Add new requirement option..."
                            value={newCustomReq}
                            onChange={(e) => setNewCustomReq(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newCustomReq.trim()) {
                                  handleAddRequirement(newCustomReq.trim());
                                  setNewCustomReq('');
                                }
                              }
                            }}
                            className="h-8 text-xs bg-white rounded-lg flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={!newCustomReq.trim()}
                            onClick={() => {
                              if (newCustomReq.trim()) {
                                handleAddRequirement(newCustomReq.trim());
                                setNewCustomReq('');
                              }
                            }}
                            className="h-8 px-2.5 text-xs bg-[#2C8567] hover:bg-[#236d54] text-white shrink-0 font-medium disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5 mr-0.5" />
                            Add
                          </Button>
                        </div>
                      </div>

                      {/* Dropdown Footer */}
                      <div className="px-3 py-1.5 bg-white border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                        <span>{selectedRequirements.length} selected</span>
                        <button
                          type="button"
                          onClick={() => setShowReqDropdown(false)}
                          className="font-semibold text-[#2C8567] hover:underline"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Requirements Pills */}
            {selectedRequirements.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {selectedRequirements.map((req) => (
                  <span
                    key={req}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200/80 animate-in fade-in"
                  >
                    <Check className="w-3 h-3 text-[#2C8567]" />
                    <span>{req}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(req)}
                      className="text-gray-400 hover:text-red-500 rounded p-0.5 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Separate Field 1: Discussion Notes */}
            <div className="pt-3 border-t border-gray-100 space-y-1.5">
              <Label htmlFor="clientNotes" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                <span>Notes & Discussion Points</span>
              </Label>
              <Textarea
                id="clientNotes"
                placeholder="Discussion points, client preferences, special requests..."
                rows={2}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="text-xs sm:text-sm font-sans bg-white resize-none"
              />
            </div>

            {/* Separate Field 2: Package Scope & Inclusions (with PDF Upload) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="clientPackageDetails" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>Package Scope & Deliverables</span>
                </Label>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                    id="packagePdfInput"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={extractingPdf}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-xs font-medium text-blue-700 bg-blue-50/60 border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                  >
                    {extractingPdf ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        <span>Extracting…</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 text-blue-600" />
                        <span>Upload Package PDF</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {pdfSource && (
                <div className="flex items-center justify-between px-2.5 py-1 rounded bg-blue-50 text-blue-800 text-[11px] border border-blue-200">
                  <span>Converted from: <strong>{pdfSource}</strong></span>
                  <button
                    type="button"
                    onClick={() => setPdfSource(null)}
                    className="text-blue-500 hover:text-blue-800 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <Textarea
                id="clientPackageDetails"
                placeholder="Deliverables, number of photographers, album size, teaser timeline (or upload PDF above)..."
                rows={2}
                value={packageDetails}
                onChange={(e) => setPackageDetails(e.target.value)}
                className="text-xs sm:text-sm font-sans bg-white border-blue-200 resize-none"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="h-9 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="h-9 bg-[#141414] hover:bg-black text-white font-semibold px-5 text-xs shadow-xs rounded-xl transition-all"
            >
              {submitting ? 'Adding Client…' : 'Add Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
