import Link from 'next/link';
import { Users, ArrowRight, Calendar } from 'lucide-react';
import { Client } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/clients/StatusBadge';
import { timeAgo, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface RecentClientsProps {
  clients: Client[];
}

export function RecentClients({ clients }: RecentClientsProps) {
  return (
    <Card className="shadow-sm border-gray-100 flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <CardTitle className="text-base font-semibold text-gray-900">
            Recent Clients
          </CardTitle>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs text-[#2C8567]">
          <Link href="/clients" className="flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        {clients.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            No clients added yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {clients.map((client) => {
              const latestNote = client.notes && client.notes.length > 0 ? client.notes[client.notes.length - 1] : null;
              return (
                <Link
                  key={client._id}
                  href={`/clients/${client._id}`}
                  className="py-3 flex items-center justify-between hover:bg-gray-50/80 -mx-3 px-3 rounded-lg transition-colors group"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-[#2C8567] truncate transition-colors">
                        {client.name || 'Unnamed Client'}
                      </p>
                      {client.date && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-[#2C8567] bg-[#2C8567]/10 px-1.5 py-0.5 rounded border border-[#2C8567]/20 shrink-0">
                          <Calendar className="w-2.5 h-2.5" />
                          {formatDate(client.date)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {latestNote ? latestNote.content : client.clientId}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={client.status} />
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      {timeAgo(client.createdAt)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
