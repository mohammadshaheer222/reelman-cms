'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Calendar, ChevronRight, Phone, MessageCircle } from 'lucide-react';
import { Client, Status } from '@/types';
import { StatusBadge } from './StatusBadge';
import { timeAgo, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { openWhatsApp, formatStatusWhatsAppMessage } from '@/lib/whatsapp';
import { toast } from 'sonner';
import { ClientQuickEditModal } from './ClientQuickEditModal';

type EditField = 'name' | 'phone' | 'date' | 'status';

interface ClientCardProps {
  client: Client;
  statuses?: Status[];
  onUpdated?: (updated: Client) => void;
}

export function ClientCard({ client: initialClient, statuses = [], onUpdated }: ClientCardProps) {
  const router = useRouter();
  const [client, setClient] = useState<Client>(initialClient);
  const [editField, setEditField] = useState<EditField | null>(null);

  const latestNote =
    client.notes && client.notes.length > 0 ? client.notes[client.notes.length - 1] : null;

  const handleCardClick = () => {
    router.push(`/clients/${client._id}`);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!client.phone) {
      toast.error('No phone number saved for this client.');
      return;
    }
    const statusObj = typeof client.status === 'object' ? client.status : null;
    const customMessage = statusObj?.whatsappMessage
      ? formatStatusWhatsAppMessage(statusObj.whatsappMessage, client.name, client.date, statusObj.name)
      : undefined;
    openWhatsApp(client.phone, client.name, customMessage);
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditField('status');
  };

  const handleUpdated = (updated: Client) => {
    setClient(updated);
    onUpdated?.(updated);
  };

  return (
    <>
      <Card
        onClick={handleCardClick}
        className="p-4 hover:shadow-md hover:border-[#2C8567]/40 transition-all group flex flex-col h-full justify-between cursor-pointer select-none"
      >
        <div>
          {/* Header: Name & Status */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-[#2C8567] transition-colors truncate">
                {client.name || (
                  <span className="text-gray-400 italic font-normal">+ Add Name</span>
                )}
              </h3>
            </div>

            {/* Status — click to change stage directly */}
            <button
              type="button"
              onClick={handleStatusClick}
              title="Click to change status"
              className="shrink-0 hover:scale-105 hover:opacity-85 transition-all active:scale-95"
            >
              <StatusBadge status={client.status} />
            </button>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 mt-2.5 py-1.5 px-2 bg-[#2C8567]/5 group-hover:bg-[#2C8567]/10 border border-[#2C8567]/15 rounded-lg text-xs transition-colors">
            <Calendar className="w-3.5 h-3.5 text-[#2C8567] shrink-0" />
            <span className="text-gray-500 font-normal shrink-0">Date:</span>
            <span className="font-semibold text-gray-800 truncate">
              {client.date ? (
                formatDate(client.date)
              ) : (
                <span className="text-gray-400 font-normal italic">Tap to set date</span>
              )}
            </span>
          </div>

          {/* Phone row & WhatsApp action */}
          <div className="flex items-center justify-between gap-2 mt-1.5 py-1.5 px-2 bg-gray-50/80 rounded-lg border border-gray-100 transition-colors">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs font-medium text-gray-700 truncate">
                {client.phone || (
                  <span className="text-gray-400 italic font-normal">+ Add phone</span>
                )}
              </span>
            </div>
            {client.phone && (
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-100 hover:bg-green-200 px-2 py-0.5 rounded-md transition-colors"
                title="Send WhatsApp message"
              >
                <MessageCircle className="w-3 h-3 text-green-600" />
                <span>WhatsApp</span>
              </button>
            )}
          </div>

          {/* Latest Note */}
          {latestNote ? (
            <p className="text-xs text-gray-500 line-clamp-2 mt-2 bg-gray-50/70 p-2 rounded-lg border border-gray-100/60 leading-relaxed">
              {latestNote.content}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic mt-2">No notes yet</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50 mt-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {client.notes?.length || 0} notes
            </span>
            <span title={`Added: ${formatDate(client.createdAt)}`}>
              {timeAgo(client.createdAt)}
            </span>
          </div>
          <div className="text-gray-400 group-hover:text-[#2C8567] transition-colors">
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </Card>

      {/* Quick Edit Modal (for status change) */}
      <ClientQuickEditModal
        client={client}
        field={editField}
        statuses={statuses}
        open={editField !== null}
        onOpenChange={(open) => !open && setEditField(null)}
        onSuccess={handleUpdated}
      />
    </>
  );
}
