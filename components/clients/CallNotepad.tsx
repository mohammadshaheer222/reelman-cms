'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Phone,
  RotateCcw,
  CheckCircle2,
  X,
  MessageCircle,
  ArrowRightCircle,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Status, Client } from '@/types';
import { toast } from 'sonner';
import { openWhatsApp, formatStatusWhatsAppMessage } from '@/lib/whatsapp';

const STORAGE_KEY = 'reelman_call_notepad_content';
const STORAGE_META_KEY = 'reelman_call_notepad_meta';

function getStoredMeta() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

interface CallNotepadProps {
  statuses: Status[];
  onSuccess?: (createdClient: Client) => void;
  onClose?: () => void;
  isInline?: boolean;
}

export function CallNotepad({
  statuses,
  onSuccess,
  onClose,
  isInline = false,
}: CallNotepadProps) {
  const [name, setName] = useState(() => getStoredMeta().name || '');
  const [phone, setPhone] = useState(() => getStoredMeta().phone || '');
  const [date, setDate] = useState(() => getStoredMeta().date || '');
  const [workPrice, setWorkPrice] = useState(() => getStoredMeta().workPrice || '');
  const [advancePaid, setAdvancePaid] = useState(() => getStoredMeta().advancePaid || '');
  const [noteContent, setNoteContent] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, noteContent);
      localStorage.setItem(
        STORAGE_META_KEY,
        JSON.stringify({ name, phone, date, workPrice, advancePaid })
      );
    } catch {}
  }, [noteContent, name, phone, date, workPrice, advancePaid]);

  // Insert a quick snippet into the notepad at current cursor position
  const handleInsertSnippet = (snippet: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setNoteContent((prev) => (prev ? `${prev}\n${snippet}` : snippet));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = noteContent.substring(0, start);
    const after = noteContent.substring(end);
    const prefix = before.endsWith('\n') || !before ? '' : '\n';
    const newContent = `${before}${prefix}${snippet}${after}`;
    setNoteContent(newContent);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length + snippet.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  // Clear notepad
  const handleClear = () => {
    setName('');
    setPhone('');
    setDate('');
    setWorkPrice('');
    setAdvancePaid('');
    setNoteContent('');
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_META_KEY);
    } catch {}
    toast.info('Notepad cleared');
  };

  // Copy notes to clipboard
  const handleCopy = () => {
    if (!noteContent) return;
    navigator.clipboard.writeText(noteContent);
    setCopied(true);
    toast.success('Notes copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Move to New status column!
  const handleMoveToNew = async (openWhatsAppChat: boolean = false) => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedNotes = noteContent.trim();

    if (!trimmedName && !trimmedPhone && !trimmedNotes) {
      toast.error('Notepad is empty. Write notes or caller name first.');
      textareaRef.current?.focus();
      return;
    }

    setSaving(true);

    // Find the "New" status doc
    const newStatus =
      statuses.find((s) => s.name.toLowerCase() === 'new') ||
      statuses.find((s) => s.isDefault) ||
      statuses[0];

    const numericPrice = parseFloat(workPrice) || 0;
    const numericAdvance = parseFloat(advancePaid) || 0;

    let paymentStatus: 'unpaid' | 'advance-received' | 'fully-paid' = 'unpaid';
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
          name: trimmedName || undefined,
          phone: trimmedPhone || undefined,
          date: date.trim() || undefined,
          workPrice: numericPrice,
          advancePaid: numericAdvance,
          paymentStatus,
          statusId: newStatus ? newStatus._id : undefined,
          noteContent: trimmedNotes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to move to New');

      const created: Client = data.data;

      toast.success(
        <span>
          Moved to <b>New</b> status column! (Client #{created.clientId})
        </span>,
        {
          icon: <CheckCircle2 className="w-4 h-4 text-[#2C8567]" />,
        }
      );

      // Trigger global event
      window.dispatchEvent(new CustomEvent('client-created', { detail: created }));
      onSuccess?.(created);

      // Open WhatsApp if requested
      if (openWhatsAppChat && trimmedPhone) {
        const customMessage = newStatus?.whatsappMessage
          ? formatStatusWhatsAppMessage(
              newStatus.whatsappMessage,
              trimmedName,
              date,
              newStatus.name
            )
          : undefined;
        openWhatsApp(trimmedPhone, trimmedName, customMessage);
      }

      // Reset notepad
      handleClear();
      if (!isInline) {
        onClose?.();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`relative w-full rounded-2xl transition-all ${
        isInline
          ? 'bg-amber-50/50 border-2 border-amber-200/80 shadow-md p-4 sm:p-5'
          : 'bg-white rounded-2xl border border-gray-200 shadow-2xl p-5 max-w-2xl w-full mx-auto'
      }`}
    >
      {/* Top Bar: Title & Quick Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base tracking-tight">
                Live Call Notepad
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Auto-saving
              </span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              Type naturally during the phone call. Click &quot;Move to New&quot; anytime.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {noteContent && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-amber-100/60 rounded-lg transition-colors"
              title="Copy notes"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-amber-100/60 rounded-lg transition-colors"
            title="Clear notepad"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-amber-100/60 rounded-lg transition-colors"
              title="Close notepad"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Caller & Work Price Details Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3.5 pb-2">
        {/* Name */}
        <div className="col-span-2 sm:col-span-1">
          <Input
            placeholder="Caller name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 text-xs sm:text-sm bg-white border-amber-200/80 font-medium placeholder:text-gray-400"
          />
        </div>

        {/* Phone */}
        <div className="col-span-2 sm:col-span-1">
          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-8 h-9 text-xs sm:text-sm font-mono bg-white border-amber-200/80 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Date */}
        <div className="col-span-1">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 text-xs bg-white border-amber-200/80"
          />
        </div>

        {/* Work Price (Confirmed Work Price) */}
        <div className="col-span-1">
          <div className="relative">
            <span className="text-xs text-gray-500 font-semibold absolute left-2.5 top-1/2 -translate-y-1/2">
              ₹
            </span>
            <Input
              type="number"
              placeholder="Work Price"
              value={workPrice}
              onChange={(e) => setWorkPrice(e.target.value)}
              className="pl-6 h-9 text-xs font-semibold bg-white border-amber-200/80 text-emerald-800 placeholder:text-gray-400"
              title="Confirmed Work Price / Total Amount"
            />
          </div>
        </div>

        {/* Advance Received */}
        <div className="col-span-1">
          <div className="relative">
            <span className="text-xs text-gray-500 font-semibold absolute left-2.5 top-1/2 -translate-y-1/2">
              ₹
            </span>
            <Input
              type="number"
              placeholder="Advance"
              value={advancePaid}
              onChange={(e) => setAdvancePaid(e.target.value)}
              className="pl-6 h-9 text-xs font-semibold bg-white border-amber-200/80 text-blue-800 placeholder:text-gray-400"
              title="Advance Payment Received"
            />
          </div>
        </div>
      </div>

      {/* Snippet Insert Bar */}
      <div className="flex flex-wrap items-center gap-1.5 py-1 text-xs">
        <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1 mr-1">
          <Zap className="w-3 h-3 text-amber-500" /> Quick Insert:
        </span>
        <button
          type="button"
          onClick={() => handleInsertSnippet('• Event Type: Wedding')}
          className="px-2 py-0.5 rounded-md bg-white border border-amber-200 hover:bg-amber-100 text-gray-700 text-[11px] transition-colors"
        >
          💍 Wedding
        </button>
        <button
          type="button"
          onClick={() => handleInsertSnippet('• Event Type: Pre-Wedding')}
          className="px-2 py-0.5 rounded-md bg-white border border-amber-200 hover:bg-amber-100 text-gray-700 text-[11px] transition-colors"
        >
          👰 Pre-Wedding
        </button>
        <button
          type="button"
          onClick={() => handleInsertSnippet('• Event Type: Reels & Social')}
          className="px-2 py-0.5 rounded-md bg-white border border-amber-200 hover:bg-amber-100 text-gray-700 text-[11px] transition-colors"
        >
          🎬 Reels
        </button>
        <button
          type="button"
          onClick={() => handleInsertSnippet('• Requirements: Candid Photo + 4K Cinema + Drone + Teaser')}
          className="px-2 py-0.5 rounded-md bg-white border border-amber-200 hover:bg-amber-100 text-gray-700 text-[11px] transition-colors"
        >
          📸 Photo+Video+Drone
        </button>
        <button
          type="button"
          onClick={() => handleInsertSnippet('• Venue: ')}
          className="px-2 py-0.5 rounded-md bg-white border border-amber-200 hover:bg-amber-100 text-gray-700 text-[11px] transition-colors"
        >
          📍 Venue
        </button>
        <button
          type="button"
          onClick={() => handleInsertSnippet(`• Call Time: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)}
          className="px-2 py-0.5 rounded-md bg-white border border-amber-200 hover:bg-amber-100 text-gray-700 text-[11px] transition-colors"
        >
          🕒 Time
        </button>
      </div>

      {/* Main Smooth Notepad Textarea */}
      <div className="relative mt-2">
        <textarea
          ref={textareaRef}
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="✍️ Start typing phone call notes freely here...
e.g.
Rahul called inquiring for wedding on 15 Dec 2026 in Bangalore.
Wants 2 days coverage, traditional + candid, drone.
Quoted ₹1,20,000. Client agreed to send advance ₹25,000 tomorrow.
Follow up on WhatsApp with package booklet."
          rows={6}
          className="w-full p-3.5 rounded-xl border border-amber-200/90 bg-white font-sans text-sm text-gray-800 leading-relaxed shadow-inner placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2C8567] focus:border-transparent resize-y modal-scroll"
          style={{
            minHeight: '140px',
            backgroundImage:
              'linear-gradient(transparent, transparent 27px, #fbf7ee 28px)',
            backgroundSize: '100% 28px',
            lineHeight: '28px',
          }}
        />
      </div>

      {/* Bottom Actions: Move to New */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-amber-200/60 mt-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Notes stay saved automatically until you move them.</span>
        </div>

        <div className="flex items-center gap-2">
          {phone && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleMoveToNew(true)}
              disabled={saving}
              className="text-xs border-green-300 text-green-700 hover:bg-green-50 gap-1.5 h-9"
              title="Save to New column and open WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-green-600" />
              <span>Move to New & WhatsApp</span>
            </Button>
          )}

          {/* Primary "Move to New" button */}
          <Button
            type="button"
            size="sm"
            onClick={() => handleMoveToNew(false)}
            disabled={saving}
            className="bg-[#2C8567] hover:bg-[#236d54] text-white text-xs font-semibold gap-2 h-9 px-4 shadow-sm"
          >
            <ArrowRightCircle className="w-4 h-4" />
            <span>{saving ? 'Moving to New…' : 'Move to New'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
