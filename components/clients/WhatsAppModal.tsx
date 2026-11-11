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
import { MessageCircle, Copy, ExternalLink, Check } from 'lucide-react';
import {
  openWhatsApp,
  getDefaultWhatsAppMessage,
  WhatsAppTemplateKey,
} from '@/lib/whatsapp';
import { Status } from '@/types';
import { toast } from 'sonner';

interface WhatsAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: {
    name?: string;
    phone?: string;
    date?: string;
    status?: Status | string;
  };
}

const BASE_TEMPLATES: { id: WhatsAppTemplateKey; label: string }[] = [
  { id: 'inquiry', label: 'Inquiry' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'dateCheck', label: 'Date Check' },
  { id: 'quick', label: 'Quick Ping' },
];

export function WhatsAppModal({ open, onOpenChange, client }: WhatsAppModalProps) {
  const statusObj = typeof client.status === 'object' ? client.status : null;
  const hasStatusTemplate = Boolean(statusObj?.whatsappMessage);

  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplateKey>(
    hasStatusTemplate ? 'status' : 'inquiry'
  );
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      const initialTemplate: WhatsAppTemplateKey = hasStatusTemplate ? 'status' : 'inquiry';
      setSelectedTemplate(initialTemplate);
      setMessage(
        getDefaultWhatsAppMessage(
          client.name,
          initialTemplate,
          client.date,
          statusObj?.whatsappMessage,
          statusObj?.name
        )
      );
    }
  }, [open, hasStatusTemplate, client.name, client.date, statusObj?.whatsappMessage, statusObj?.name]);

  const handleSelectTemplate = (templateKey: WhatsAppTemplateKey) => {
    setSelectedTemplate(templateKey);
    setMessage(
      getDefaultWhatsAppMessage(
        client.name,
        templateKey,
        client.date,
        statusObj?.whatsappMessage,
        statusObj?.name
      )
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success('Copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (preferApp = true) => {
    if (!client.phone) {
      toast.error('No phone number');
      return;
    }
    openWhatsApp(client.phone, client.name, message, preferApp);
    onOpenChange(false);
  };

  const templateOptions = hasStatusTemplate
    ? [{ id: 'status' as WhatsAppTemplateKey, label: `Stage: ${statusObj?.name}` }, ...BASE_TEMPLATES]
    : BASE_TEMPLATES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-5">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-gray-900">WhatsApp</DialogTitle>
              <p className="text-xs text-gray-400 mt-0.5">
                {client.name}
                {client.phone && ` · ${client.phone}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Template pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {templateOptions.map((t) => {
            const active = selectedTemplate === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTemplate(t.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? 'border-[#2C8567] bg-[#2C8567] text-white shadow-xs'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Message box */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Message</span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-[#2C8567]" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy
                </>
              )}
            </button>
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="text-sm font-sans resize-none leading-relaxed focus-visible:ring-[#2C8567]"
          />
        </div>

        <DialogFooter className="gap-2 pt-1 flex-row">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSend(false)}
            className="flex-1 text-gray-600"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Web
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => handleSend(true)}
            className="flex-1 bg-[#2C8567] hover:bg-[#236d54] text-white"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
            Open WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
