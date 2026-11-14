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
    <Card className="rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.03)] border-gray-100/90 flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[#141414]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-[#141414]">
              Recent Clients
            </CardTitle>
            <p className="text-[11px] text-gray-400 font-normal">Latest studio inquiries & bookings</p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl">
          <Link href="/clients" className="flex items-center gap-1 font-semibold">
            View All <ArrowRight className="w-3.5 h-3.5 text-[#dc2626]" />
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
                  className="py-3 px-3 flex items-center justify-between hover:bg-gray-50/90 -mx-1.5 rounded-xl transition-all group"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#141414] group-hover:text-[#dc2626] truncate transition-colors">
                        {client.name || 'Unnamed Client'}
                      </p>
                      {client.date && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200/60 shrink-0">
                          <Calendar className="w-2.5 h-2.5 text-[#dc2626]" />
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
