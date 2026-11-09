'use client';
import Link from 'next/link';
import { MessageSquare, Calendar, ChevronRight, Phone } from 'lucide-react';
import { Client } from '@/types';
import { StatusBadge } from './StatusBadge';
import { timeAgo } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface ClientCardProps {
  client: Client;
}

export function ClientCard({ client }: ClientCardProps) {
  const latestNote = client.notes && client.notes.length > 0 ? client.notes[client.notes.length - 1] : null;

  return (
    <Link href={`/clients/${client._id}`}>
      <Card className="p-4 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group flex flex-col h-full justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {client.name || 'Unnamed Client'}
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{client.clientId}</p>
            </div>
            <StatusBadge status={client.status} />
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
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </Card>
    </Link>
  );
}
