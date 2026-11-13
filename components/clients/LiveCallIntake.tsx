'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  PhoneCall,
  X,
  Check,
  AlertCircle,
  MessageCircle,
  Plus,
  Building2,
  Maximize2,
  Minimize2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Status, Client } from '@/types';
import { toast } from 'sonner';
import { openWhatsApp, formatStatusWhatsAppMessage } from '@/lib/whatsapp';
import { formatDate } from '@/lib/utils';

const EVENT_TYPE_CHIPS = [
  { label: '💍 Wedding', value: 'Wedding' },
  { label: '👰 Pre-Wedding', value: 'Pre-Wedding' },
  { label: '🎉 Reception', value: 'Reception' },
  { label: '🎂 Birthday', value: 'Birthday' },
  { label: '🎬 Reels & Social', value: 'Reels Creation' },
  { label: '🏢 Corporate', value: 'Corporate Event' },
  { label: '✨ Other', value: 'Other' },
];

const QUICK_NOTE_PHRASES = [
  '2-Day Shoot',
  'Candid & Traditional',
  'Drone Coverage',
  'Teaser + 3 Reels',
  'Full 4K Documentary',
  'Premium Album',
  'Send Package Booklet',
  'Budget Discussed',
  'Callback Tomorrow',
  'High Priority Lead',
];

const BUDGET_PRESETS = ['₹50,000', '₹1,00,000', '₹1,50,000', '₹2,50,000+'];

interface LiveCallIntakeProps {
  statuses: Status[];
  existingClients?: Client[];
  initialStatusId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: (createdClient: Client) => void;
  isInlineDock?: boolean; // When rendered right above Kanban board
}

export function LiveCallIntake({
  statuses,
  existingClients = [],
  initialStatusId,
  isOpen = true,
  onClose,
  onSuccess,
  isInlineDock = false,
}: LiveCallIntakeProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const defaultStatusId = useMemo(() => {
    if (initialStatusId) return initialStatusId;
    const def = statuses.find((s) => s.isDefault) || statuses[0];
    return def ? def._id : '';
  }, [initialStatusId, statuses]);

  const [statusIdState, setStatusIdState] = useState<string | null>(null);
  const statusId = statusIdState ?? defaultStatusId;
  const setStatusId = (id: string) => setStatusIdState(id);
  const [submitting, setSubmitting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Autofocus name on open
  useEffect(() => {
    if (isOpen && !isMinimized && nameInputRef.current) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMinimized]);

  // Duplicate Phone Detection
  const duplicateClient = useMemo(() => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 7) return null;
    return existingClients.find((c) => {
      const cPhone = (c.phone || '').replace(/\D/g, '');
      return cPhone.includes(cleanPhone) || cleanPhone.includes(cPhone);
    });
  }, [phone, existingClients]);

  // Date conflict checker: Check if another client has an event on the same date
  const dateConflict = useMemo(() => {
    if (!date) return null;
    return existingClients.filter((c) => c.date && c.date === date);
  }, [date, existingClients]);

  // Append a quick phrase to call notes
  const handleAddPhrase = (phrase: string) => {
    setCallNotes((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return `• ${phrase}`;
      return `${trimmed}\n• ${phrase}`;
    });
  };

  // Keyboard shortcut Ctrl+Enter to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setName('');
    setPhone('');
    setEventType('');
    setDate('');
    setLocation('');
    setBudget('');
    setCallNotes('');
    if (statuses.length > 0) {
      const def = statuses.find((s) => s.isDefault) || statuses[0];
      setStatusId(def._id);
    }
  };

  // Save Client function
  const handleSave = async (openWhatsAppAfter: boolean = false) => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName && !trimmedPhone) {
      toast.error('Please enter at least a Client Name or Phone Number');
      nameInputRef.current?.focus();
      return;
    }

    setSubmitting(true);

    // Build structured note content
    const noteParts: string[] = [];
    if (eventType) noteParts.push(`📸 Event Type: ${eventType}`);
    if (location.trim()) noteParts.push(`📍 Venue/Location: ${location.trim()}`);
    if (budget.trim()) noteParts.push(`💰 Budget: ${budget.trim()}`);
    if (callNotes.trim()) noteParts.push(`📝 Discussion:\n${callNotes.trim()}`);

    const structuredNote = noteParts.join('\n');

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName || undefined,
          phone: trimmedPhone || undefined,
          date: date.trim() || undefined,
          noteContent: structuredNote || undefined,
          statusId: statusId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save client');

      const newClient: Client = data.data;

      toast.success(
        <span>
          Client <b>{newClient.name || 'New Client'}</b> added to CRM!
        </span>,
        {
          icon: <CheckCircle2 className="w-4 h-4 text-[#2C8567]" />,
        }
      );

      // Trigger global event so all lists/boards refresh immediately
      window.dispatchEvent(new CustomEvent('client-created', { detail: newClient }));
      onSuccess?.(newClient);

      // If requested, immediately open WhatsApp with welcome template
      if (openWhatsAppAfter && trimmedPhone) {
        const selectedStatus = statuses.find((s) => s._id === statusId);
        const customMessage = selectedStatus?.whatsappMessage
          ? formatStatusWhatsAppMessage(
              selectedStatus.whatsappMessage,
              trimmedName,
              date,
              selectedStatus.name
            )
          : undefined;

        openWhatsApp(trimmedPhone, trimmedName, customMessage);
      }

      handleReset();
      if (!isInlineDock) {
        onClose?.();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onKeyDown={handleKeyDown}
      className={`transition-all duration-300 ${
        isInlineDock
          ? 'w-full bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/60 rounded-2xl border-2 border-[#2C8567]/30 shadow-md p-4 sm:p-5'
          : 'bg-white rounded-2xl border border-gray-200 shadow-2xl p-5 max-w-2xl w-full mx-auto'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2C8567] text-white flex items-center justify-center shadow-sm shadow-[#2C8567]/30">
            <PhoneCall className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">
                Live Phone Call Intake
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Call Mode
              </span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              Take down client inquiry details smoothly during the phone call.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400 font-mono hidden md:inline-block mr-2">
            Save: <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-[10px]">Ctrl+Enter</kbd>
          </span>

          <button
            type="button"
            onClick={() => setIsMinimized((prev) => !prev)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={isMinimized ? 'Expand panel' : 'Minimize panel'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Minimized Bar */}
      {isMinimized ? (
        <div className="py-2.5 flex items-center justify-between text-xs text-gray-600">
          <span>Intake panel minimized. Click expand or start typing details.</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsMinimized(false)}
            className="h-7 text-xs gap-1 text-[#2C8567]"
          >
            <Maximize2 className="w-3 h-3" /> Expand
          </Button>
        </div>
      ) : (
        /* Full Intake Form */
        <div className="space-y-4 pt-4">
          {/* Row 1: Name, Phone, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Client Name */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Client / Couple Name *</span>
              </Label>
              <Input
                ref={nameInputRef}
                placeholder="e.g. Rahul & Priya"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9.5 text-sm font-medium bg-white border-gray-200 focus-visible:ring-[#2C8567]"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>Phone / WhatsApp *</span>
              </Label>
              <Input
                type="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`h-9.5 text-sm font-mono bg-white border-gray-200 focus-visible:ring-[#2C8567] ${
                  duplicateClient ? 'border-amber-400 bg-amber-50/30' : ''
                }`}
              />
            </div>

            {/* Target Status */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Initial Stage</Label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full h-9.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2C8567]"
              >
                {statuses.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duplicate phone warning alert if matched */}
          {duplicateClient && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Notice: A client with this number already exists:{' '}
                  <b>{duplicateClient.name || 'Unnamed Client'}</b>
                </span>
              </div>
              <a
                href={`/clients/${duplicateClient._id}`}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-amber-900 underline hover:text-black shrink-0 ml-2"
              >
                View Existing Profile
              </a>
            </div>
          )}

          {/* Row 2: Event Type Chips */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Shoot / Event Type (1-Tap Selection)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPE_CHIPS.map((chip) => {
                const isSelected = eventType === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setEventType(isSelected ? '' : chip.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#2C8567] text-white shadow-xs font-semibold scale-102 ring-1 ring-[#2C8567]'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Event Date, Location, Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Event Date */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-700">Event Date</Label>
                {date && dateConflict && dateConflict.length > 0 && (
                  <span className="text-[10px] text-amber-600 font-semibold">
                    ⚠️ {dateConflict.length} shoot booked
                  </span>
                )}
                {date && dateConflict && dateConflict.length === 0 && (
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    ✅ Date is open
                  </span>
                )}
              </div>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`h-9 text-sm bg-white border-gray-200 ${
                  date && dateConflict && dateConflict.length > 0
                    ? 'border-amber-400 bg-amber-50/20'
                    : ''
                }`}
              />
              {date && (
                <p className="text-[11px] text-[#2C8567] font-medium">{formatDate(date)}</p>
              )}
            </div>

            {/* Venue / Location */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Venue / Location</Label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="e.g. Taj West End, Bangalore"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-9 text-sm pl-8 bg-white border-gray-200"
                />
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Estimated Budget</Label>
              <div className="relative">
                <span className="text-xs text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2">
                  ₹
                </span>
                <Input
                  placeholder="e.g. 1,50,000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="h-9 text-sm pl-6 bg-white border-gray-200"
                />
              </div>
              {/* Quick Budget Chips */}
              <div className="flex gap-1 pt-0.5">
                {BUDGET_PRESETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudget(b)}
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 hover:bg-[#2C8567]/10 hover:text-[#2C8567] text-gray-600 transition-colors"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: Call Notes Scratchpad & Quick Append Phrases */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-700">
                Call Discussion Notes / Client Requirements
              </Label>
              <span className="text-[11px] text-gray-400">
                Click pills below to append quickly
              </span>
            </div>

            <Textarea
              placeholder="e.g. Bride requested cinematic teaser + reels within 24h. Wants both photo + video crew. Need to send package booklet on WhatsApp."
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              rows={3}
              className="text-sm bg-white border-gray-200 resize-none font-normal leading-relaxed"
            />

            {/* Quick Note Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_NOTE_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => handleAddPhrase(phrase)}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-gray-200 hover:border-[#2C8567] hover:bg-[#2C8567]/5 text-gray-600 hover:text-[#2C8567] transition-all flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-2.5 h-2.5 text-gray-400" />
                  <span>{phrase}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={submitting}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                Clear Form
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* Save & Open WhatsApp */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSave(true)}
                disabled={submitting}
                className="flex-1 sm:flex-none text-xs border-green-300 text-green-700 hover:bg-green-50 gap-1.5 h-9"
              >
                <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                <span>Save & WhatsApp</span>
              </Button>

              {/* Primary Save Button */}
              <Button
                type="button"
                size="sm"
                onClick={() => handleSave(false)}
                disabled={submitting}
                className="flex-1 sm:flex-none text-xs bg-[#2C8567] hover:bg-[#236d54] text-white gap-1.5 h-9 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{submitting ? 'Saving Lead…' : 'Save Client'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
