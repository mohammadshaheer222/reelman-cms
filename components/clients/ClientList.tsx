'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutGrid,
  List,
  Users,
  Phone,
  MessageCircle,
  Calendar,
  Pencil,
} from 'lucide-react';
import { Client, Status } from '@/types';
import { ClientCard } from './ClientCard';
import { StatusBadge } from './StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, timeAgo } from '@/lib/utils';
import { openWhatsApp } from '@/lib/whatsapp';
import { ClientQuickEditModal } from './ClientQuickEditModal';

type EditField = 'name' | 'phone' | 'date' | 'status';

interface ClientListProps {
  clients: Client[];
  total: number;
  totalPages: number;
  page: number;
  statuses?: Status[];
  onPageChange: (newPage: number) => void;
  onAddClient: () => void;
  onClientUpdated?: (updated: Client) => void;
}

export function ClientList({
  clients: initialClients,
  total,
  totalPages,
  page,
  statuses = [],
  onPageChange,
  onAddClient,
  onClientUpdated,
}: ClientListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  // Local override map so table updates reflect immediately without full refetch
  const [overrides, setOverrides] = useState<Record<string, Client>>({});
  const [editTarget, setEditTarget] = useState<{ client: Client; field: EditField } | null>(null);

  const clients = initialClients.map((c) => overrides[c._id] ?? c);

  const handleUpdated = (updated: Client) => {
    setOverrides((prev) => ({ ...prev, [updated._id]: updated }));
    onClientUpdated?.(updated);
  };

  const openEdit = (e: React.MouseEvent, client: Client, field: EditField) => {
    e.preventDefault();
    e.stopPropagation();
    setEditTarget({ client: overrides[client._id] ?? client, field });
  };

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No clients found"
        description="Get started by adding your first client or adjust your search filters."
        actionLabel="Add Client"
        onAction={onAddClient}
      />
    );
  }

  // Inline edit button used in table cells
  const EditBtn = ({
    client,
    field,
    label,
  }: {
    client: Client;
    field: EditField;
    label: string;
  }) => (
    <button
      type="button"
      onClick={(e) => openEdit(e, client, field)}
      title={`Edit ${label}`}
      className="ml-1.5 inline-flex p-1 rounded text-gray-400 hover:text-[#2C8567] hover:bg-[#2C8567]/10 transition-colors opacity-0 group-hover/row:opacity-100 focus:opacity-100"
    >
      <Pencil className="w-3 h-3" />
    </button>
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 font-medium">
            Showing <span className="font-semibold text-gray-900">{clients.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{total}</span> clients
          </p>
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <ClientCard
                key={client._id}
                client={overrides[client._id] ?? client}
                statuses={statuses}
                onUpdated={handleUpdated}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Client</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#2C8567]" />
                      <span>Event Date</span>
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => {
                  const latestNote =
                    c.notes && c.notes.length > 0 ? c.notes[c.notes.length - 1] : null;
                  return (
                    <TableRow key={c._id} className="hover:bg-gray-50/80 group/row">
                      {/* Name */}
                      <TableCell className="font-medium text-gray-900 max-w-[180px]">
                        <div className="flex items-center gap-0.5">
                          <Link
                            href={`/clients/${c._id}`}
                            className="hover:text-[#2C8567] font-semibold truncate"
                          >
                            {c.name || (
                              <span className="text-gray-400 italic font-normal">Unnamed</span>
                            )}
                          </Link>
                          <EditBtn client={c} field="name" label="Name" />
                        </div>
                        {latestNote && (
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 font-normal">
                            {latestNote.content}
                          </p>
                        )}
                      </TableCell>

                      {/* ID */}
                      <TableCell className="font-mono text-xs text-gray-400 whitespace-nowrap">
                        {c.clientId}
                      </TableCell>

                      {/* Phone */}
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {c.phone ? (
                            <>
                              <span className="text-xs text-gray-700 font-mono">{c.phone}</span>
                              <button
                                type="button"
                                onClick={() => openWhatsApp(c.phone!, c.name)}
                                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                title="Open WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">—</span>
                          )}
                          <EditBtn client={c} field="phone" label="Phone" />
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-0.5">
                          {c.date ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2C8567]/10 text-[#2C8567] font-semibold text-xs border border-[#2C8567]/20 whitespace-nowrap">
                              <Calendar className="w-3 h-3 shrink-0" />
                              {formatDate(c.date)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No date</span>
                          )}
                          <EditBtn client={c} field="date" label="Date" />
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <StatusBadge status={c.status} />
                          <EditBtn client={c} field="status" label="Status" />
                        </div>
                      </TableCell>

                      {/* Notes count */}
                      <TableCell className="text-xs text-gray-500">
                        {c.notes?.length || 0}
                      </TableCell>

                      {/* Added */}
                      <TableCell
                        className="text-xs text-gray-400 whitespace-nowrap"
                        title={formatDate(c.createdAt)}
                      >
                        {timeAgo(c.createdAt)}
                      </TableCell>

                      {/* View */}
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/clients/${c._id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Shared Quick Edit Modal */}
      {editTarget && (
        <ClientQuickEditModal
          client={editTarget.client}
          field={editTarget.field}
          statuses={statuses}
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          onSuccess={handleUpdated}
        />
      )}
    </>
  );
}
