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
import { Textarea } from '@/components/ui/textarea';
import {
  MessageCircle,
  Copy,
  ExternalLink,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  openWhatsApp,
  getDefaultWhatsAppMessage,
  WhatsAppTemplateKey,
} from '@/lib/whatsapp';
import { toast } from 'sonner';

interface WhatsAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: {
    name?: string;
    phone?: string;
    date?: string;
  };
}

const TEMPLATE_OPTIONS: { id: WhatsAppTemplateKey; label: string; desc: string }[] = [
  { id: 'inquiry', label: 'Inquiry Intro', desc: 'Warm introduction & package discussion' },
  { id: 'proposal', label: 'Proposal Sent', desc: 'Follow-up on proposal PDF sent' },
  { id: 'dateCheck', label: 'Date Check', desc: 'Reserve crew for event date' },
  { id: 'quick', label: 'Quick Ping', desc: 'Short check-in' },
];

export function WhatsAppModal({ open, onOpenChange, client }: WhatsAppModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateKey>('inquiry');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setMessage(getDefaultWhatsAppMessage(client.name, selectedTemplate, client.date));
    }
  }, [open, selectedTemplate, client.name, client.date]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success('Message copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (preferApp: boolean = true) => {
    if (!client.phone) {
      toast.error('No phone number for this client');
      return;
    }
    openWhatsApp(client.phone, client.name, message, preferApp);
    toast.success(preferApp ? 'Launching WhatsApp...' : 'Opening WhatsApp Web...');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-4 sm:p-6">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-gray-900">
                Send WhatsApp Message
              </DialogTitle>
              <p className="text-xs text-gray-500">
                To <span className="font-medium text-gray-800">{client.name}</span>
                {client.phone && ` (${client.phone})`}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Template Selector */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#2C8567]" />
            Select Message Template:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATE_OPTIONS.map((t) => {
              const active = selectedTemplate === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                    active
                      ? 'border-[#2C8567] bg-[#2C8567]/10 text-[#2C8567] font-semibold ring-1 ring-[#2C8567]'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <p className="font-medium">{t.label}</p>
                  <p className="text-[10px] text-gray-500 font-normal truncate mt-0.5">
                    {t.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Editor */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700">
              Message Preview & Edit:
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-[#2C8567]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy text</span>
                </>
              )}
            </button>
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={7}
            className="text-xs sm:text-sm font-sans resize-none leading-relaxed focus-visible:ring-[#2C8567] focus-visible:border-[#2C8567]"
            placeholder="Type your WhatsApp message..."
          />
          <p className="text-[10px] text-gray-400 text-right">
            {message.length} characters • WhatsApp formatting (*bold*, _italic_) supported
          </p>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSend(false)}
            className="w-full sm:w-auto text-gray-700 order-2 sm:order-1"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            WhatsApp Web
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleSend(true)}
            className="w-full sm:w-auto bg-[#2C8567] hover:bg-[#236d54] text-white font-medium order-1 sm:order-2 shadow-sm"
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
            Open WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
