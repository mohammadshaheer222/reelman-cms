'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Calendar,
  ChevronRight,
  Phone,
  MessageCircle,
  Pencil,
} from 'lucide-react';
import { Client, Status } from '@/types';
import { StatusBadge } from './StatusBadge';
import { timeAgo, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { openWhatsApp } from '@/lib/whatsapp';
import { toast } from 'sonner';
import { ClientQuickEditModal } from './ClientQuickEditModal';

type EditField = 'name' | 'phone' | 'date' | 'status';

interface ClientCardProps {
  client: Client;
  statuses?: Status[];
  onUpdated?: (updated: Client) => void;
}

export function ClientCard({ client: initialClient, statuses = [], onUpdated }: ClientCardProps) {
  const [client, setClient] = useState<Client>(initialClient);
  const [editField, setEditField] = useState<EditField | null>(null);

  const latestNote =
    client.notes && client.notes.length > 0 ? client.notes[client.notes.length - 1] : null;

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!client.phone) {
      toast.error('No phone number saved for this client.');
      return;
    }
    openWhatsApp(client.phone, client.name);
  };

  const openEdit = (e: React.MouseEvent, field: EditField) => {
    e.preventDefault();
    e.stopPropagation();
    setEditField(field);
  };

  const handleUpdated = (updated: Client) => {
    setClient(updated);
    onUpdated?.(updated);
  };

  // Helper: editable field row
  const EditableRow = ({
    field,
    children,
    className = '',
  }: {
    field: EditField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={`group/row relative flex items-center justify-between gap-2 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
      <button
        type="button"
        onClick={(e) => openEdit(e, field)}
        title={`Edit ${field}`}
        className="shrink-0 opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-md text-gray-400 hover:text-[#2C8567] hover:bg-[#2C8567]/10"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );

  return (
    <>
      <div className="block h-full">
        <Card className="p-4 hover:shadow-md hover:border-[#2C8567]/30 transition-all group flex flex-col h-full justify-between">
          {/* Header: Name + Status */}
          <div>
            <EditableRow field="name" className="mb-1">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/clients/${client._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="block"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-[#2C8567] transition-colors truncate">
                    {client.name || (
                      <span className="text-gray-400 italic font-normal">Unnamed Client</span>
                    )}
                  </h3>
                </Link>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{client.clientId}</p>
              </div>
            </EditableRow>

            {/* Status Badge - editable */}
            <EditableRow field="status" className="mt-1">
              <StatusBadge status={client.status} />
            </EditableRow>

            {/* Date Row */}
            <EditableRow
              field="date"
              className="mt-2.5 py-1 px-2 bg-[#2C8567]/5 rounded-lg border border-[#2C8567]/15 text-xs"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Calendar className="w-3.5 h-3.5 text-[#2C8567] shrink-0" />
                <span className="text-gray-500 font-normal shrink-0">Date:</span>
                <span className="font-semibold text-gray-800 truncate">
                  {client.date ? (
                    formatDate(client.date)
                  ) : (
                    <span className="text-gray-400 font-normal italic">No date set</span>
                  )}
                </span>
              </div>
            </EditableRow>

            {/* Phone Row */}
            <EditableRow
              field="phone"
              className="mt-1.5 py-1 px-2 bg-gray-50/80 rounded-lg border border-gray-100"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-xs font-medium text-gray-700 truncate">
                  {client.phone || (
                    <span className="text-gray-400 italic font-normal">No phone</span>
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
            </EditableRow>

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
                Added {timeAgo(client.createdAt)}
              </span>
            </div>
            <Link
              href={`/clients/${client._id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-gray-300 hover:text-[#2C8567] transition-colors"
            >
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Edit Modal */}
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
