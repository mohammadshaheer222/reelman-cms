'use client';
import Link from 'next/link';
import { MessageSquare, Calendar, ChevronRight, Phone, MessageCircle } from 'lucide-react';
import { Client } from '@/types';
import { StatusBadge } from './StatusBadge';
import { timeAgo } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { openWhatsApp } from '@/lib/whatsapp';
import { toast } from 'sonner';

interface ClientCardProps {
  client: Client;
}

export function ClientCard({ client }: ClientCardProps) {
  const latestNote = client.notes && client.notes.length > 0 ? client.notes[client.notes.length - 1] : null;

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!client.phone) {
      toast.error('No phone number saved for this client.');
      return;
    }
    openWhatsApp(client.phone, client.name);
  };

  return (
    <Link href={`/clients/${client._id}`}>
      <Card className="p-4 hover:shadow-md hover:border-[#2C8567]/30 transition-all cursor-pointer group flex flex-col h-full justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-[#2C8567] transition-colors">
                {client.name || 'Unnamed Client'}
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{client.clientId}</p>
            </div>
            <StatusBadge status={client.status} />
          </div>

          {/* Phone & Direct WhatsApp Action */}
          <div className="mt-2.5 flex items-center justify-between gap-2 py-1.5 px-2 bg-gray-50/80 rounded-lg border border-gray-100">
            <div className="flex items-center gap-1.5 min-w-0">
              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs font-medium text-gray-700 truncate">
                {client.phone || <span className="text-gray-400 italic">No phone number</span>}
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

          {latestNote ? (
            <p className="text-sm text-gray-600 line-clamp-2 mt-2 bg-gray-50/70 p-2.5 rounded-lg border border-gray-100/60 leading-relaxed">
              {latestNote.content}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic mt-2">No notes recorded yet</p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50 mt-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {client.notes?.length || 0} notes
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {timeAgo(client.createdAt)}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#2C8567] group-hover:translate-x-0.5 transition-all" />
        </div>
      </Card>
    </Link>
  );
}

