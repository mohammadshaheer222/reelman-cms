'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  StickyNote,
  Copy,
  Check,
  RotateCcw,
  Download,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const STORAGE_KEY = 'reelman_call_notepad_content';

interface CallNotepadProps {
  onClose?: () => void;
  isInline?: boolean;
}

export function CallNotepad({
  onClose,
  isInline = false,
}: CallNotepadProps) {
  const [content, setContent] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [copied, setCopied] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('Saved');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, content);
      setLastSaved('Auto-saved');
    } catch {}
  }, [content]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Copy all content
  const handleCopy = () => {
    if (!content.trim()) {
      toast.info('Notepad is empty');
      return;
    }
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Notes copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear notepad
  const handleClear = () => {
    if (!content.trim()) return;
    setContent('');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    toast.info('Notepad cleared');
    textareaRef.current?.focus();
  };

  // Download as text file
  const handleDownload = () => {
    if (!content.trim()) {
      toast.info('Notepad is empty');
      return;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rough_notes_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded notes as .txt');
  };

  // Word and character counts
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content.trim() ? content.split('\n').length : 0;

  return (
    <div
      className={`w-full transition-all bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col ${
        isInline ? 'min-h-[520px]' : 'max-w-3xl mx-auto min-h-[500px]'
      }`}
    >
      {/* Notepad Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-gray-100 bg-gray-50/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2C8567] text-white flex items-center justify-center shadow-2xs">
            <StickyNote className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-sm tracking-tight">
                Notepad
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {lastSaved}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!content.trim()}
            className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-gray-200 text-gray-700 hover:bg-white hover:text-gray-900 shadow-2xs"
            title="Copy all text to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>Copy</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!content.trim()}
            className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-gray-200 text-gray-700 hover:bg-white hover:text-gray-900 shadow-2xs"
            title="Download notes as .txt"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={!content.trim()}
            className="h-8 px-2.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 border-gray-200 shadow-2xs"
            title="Clear notepad"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Clear</span>
          </Button>
        </div>
      </div>

      {/* Pure Notepad Text Area (No input fields!) */}
      <div className="flex-1 relative p-4 sm:p-6 flex flex-col min-h-[420px] bg-white">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing rough notes, client discussion points, shoot requirements, phone call takeaways, pricing ideas..."
          className="w-full flex-1 min-h-[380px] p-0 border-0 bg-transparent font-sans text-sm sm:text-base text-gray-800 leading-relaxed placeholder:text-gray-400 focus:outline-none resize-none modal-scroll"
          style={{ lineHeight: '1.75' }}
        />
      </div>

      {/* Stats Footer */}
      <div className="px-4 sm:px-6 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-[11px] text-gray-400 font-mono shrink-0">
        <div className="flex items-center gap-3">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span>•</span>
          <span>{charCount} characters</span>
          {lineCount > 1 && (
            <>
              <span>•</span>
              <span>{lineCount} lines</span>
            </>
          )}
        </div>
        <span className="text-gray-400 font-sans hidden sm:inline">
          Notes stay saved on this device continuously
        </span>
      </div>
    </div>
  );
}
