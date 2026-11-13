'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Kanban,
  LayoutGrid,
  List,
  Users,
  MessageCircle,
  Calendar,
  ArrowRight,
  IndianRupee,
  RotateCcw,
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
import { openWhatsApp, formatStatusWhatsAppMessage } from '@/lib/whatsapp';
import { ClientQuickEditModal, EditField } from './ClientQuickEditModal';
import { KanbanBoard } from './KanbanBoard';
import { toast } from 'sonner';

export type ViewMode = 'kanban' | 'grid' | 'table';

interface ClientListProps {
  clients: Client[];
  total: number;
  totalPages: number;
  page: number;
  statuses?: Status[];
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onPageChange: (newPage: number) => void;
  onAddClient: () => void;
  onAddClientForStatus?: (statusId: string) => void;
  onClientUpdated?: (updated: Client) => void;
  onOpenCallIntake?: (statusId?: string) => void;
}

export function ClientList({
  clients: initialClients,
  total,
  totalPages,
  page,
  statuses = [],
  viewMode: controlledViewMode,
  onViewModeChange,
  onPageChange,
  onAddClient,
  onAddClientForStatus,
  onClientUpdated,
  onOpenCallIntake,
}: ClientListProps) {
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('kanban');
  const viewMode = controlledViewMode ?? internalViewMode;

  const setViewMode = (mode: ViewMode) => {
    setInternalViewMode(mode);
    onViewModeChange?.(mode);
  };

  const [overrides, setOverrides] = useState<Record<string, Client>>({});
  const [editTarget, setEditTarget] = useState<{ client: Client; field: EditField } | null>(null);

  const clients = initialClients.map((c) => overrides[c._id] ?? c);

  const handleUpdated = (updated: Client) => {
    setOverrides((prev) => ({ ...prev, [updated._id]: updated }));
    onClientUpdated?.(updated);
  };

  const handleMoveToNew = async (e: React.MouseEvent, client: Client) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus =
      statuses.find((s) => s.name.toLowerCase() === 'new') ||
      statuses.find((s) => s.isDefault) ||
      statuses[0];
    if (!newStatus) return;

    try {
      const res = await fetch(`/api/clients/${client._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: newStatus._id }),
      });
      if (!res.ok) throw new Error('Update failed');
      const { data } = await res.json();
      toast.success(`Moved "${client.name || 'Client'}" → New`);
      handleUpdated(data);
      window.dispatchEvent(new CustomEvent('client-updated', { detail: data }));
    } catch {
      toast.error('Could not move to New');
    }
  };

  const openEdit = (e: React.MouseEvent, client: Client, field: EditField) => {
    e.preventDefault();
    e.stopPropagation();
    setEditTarget({ client: overrides[client._id] ?? client, field });
  };

  // If no clients and NOT in kanban mode, show empty state
  if (clients.length === 0 && viewMode !== 'kanban') {
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

  return (
    <>
      <div className="space-y-4">
        {/* Top bar with count & view switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-gray-500 font-medium">
            Showing <span className="font-semibold text-gray-900">{clients.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{total}</span> clients in pipeline
          </p>

          {/* View mode switcher */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Kanban Pipeline (Zoho CRM Drag & Drop)"
            >
              <Kanban className="w-3.5 h-3.5 text-[#2C8567]" />
              <span>Pipeline (Kanban)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* View Content */}
        {viewMode === 'kanban' ? (
          /* Kanban Drag & Drop Pipeline View */
          <KanbanBoard
            clients={clients}
            statuses={statuses}
            onClientUpdated={handleUpdated}
            onAddClientForStatus={onAddClientForStatus}
            onOpenCallIntake={onOpenCallIntake}
          />
        ) : viewMode === 'grid' ? (
          /* Grid View */
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
          /* Table View */
          <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead>Client</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#2C8567]" />
                      Event Date
                    </div>
                  </TableHead>
                  <TableHead>Work Price & Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => {
                  const latestNote =
                    c.notes && c.notes.length > 0 ? c.notes[c.notes.length - 1] : null;
                  const currentStName =
                    typeof c.status === 'object' && c.status !== null
                      ? c.status.name
                      : (c.status as string);
                  const isNewSt = (currentStName || '').toLowerCase() === 'new';

                  return (
                    <TableRow key={c._id} className="hover:bg-gray-50/60">
                      {/* Name */}
                      <TableCell className="max-w-[200px]">
                        <button
                          type="button"
                          onClick={(e) => openEdit(e, c, 'name')}
                          className="text-left w-full font-semibold text-gray-900 hover:text-[#2C8567] transition-colors truncate block"
                          title="Click to edit name"
                        >
                          {c.name || <span className="text-gray-400 italic font-normal">+ Add name</span>}
                        </button>
                        {latestNote && (
                          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5 font-normal">
                            {latestNote.content}
                          </p>
                        )}
                      </TableCell>

                      {/* Phone */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => openEdit(e, c, 'phone')}
                            className="text-xs text-gray-700 font-mono hover:text-[#2C8567] transition-colors whitespace-nowrap"
                            title="Click to edit phone"
                          >
                            {c.phone || <span className="text-gray-400 italic">+ Add phone</span>}
                          </button>
                          {c.phone && (
                            <button
                              type="button"
                              onClick={() => {
                                const statusObj = typeof c.status === 'object' ? c.status : null;
                                const customMessage = statusObj?.whatsappMessage
                                  ? formatStatusWhatsAppMessage(
                                      statusObj.whatsappMessage,
                                      c.name,
                                      c.date,
                                      statusObj.name
                                    )
                                  : undefined;
                                openWhatsApp(c.phone!, c.name, customMessage);
                              }}
                              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded shrink-0"
                              title="Open WhatsApp with status prefill"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => openEdit(e, c, 'date')}
                          title="Click to set event date"
                          className="transition-colors"
                        >
                          {c.date ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2C8567]/10 text-[#2C8567] font-semibold text-xs border border-[#2C8567]/20 hover:bg-[#2C8567]/20 transition-colors whitespace-nowrap">
                              <Calendar className="w-3 h-3 shrink-0" />
                              {formatDate(c.date)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic hover:text-[#2C8567] transition-colors">
                              + Set date
                            </span>
                          )}
                        </button>
                      </TableCell>

                      {/* Work Price & Payment */}
                      <TableCell className="whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => openEdit(e, c, 'price')}
                          className="text-left group/price"
                          title="Click to edit work price & payment"
                        >
                          <div className="flex items-center gap-1 font-semibold text-gray-900 group-hover/price:text-[#2C8567] font-mono text-xs">
                            <IndianRupee className="w-3 h-3 text-emerald-700" />
                            <span>
                              {c.workPrice ? c.workPrice.toLocaleString('en-IN') : <span className="text-gray-400 italic font-normal">+ Set Price</span>}
                            </span>
                          </div>
                          <div className="text-[10px] mt-0.5">
                            {c.paymentStatus === 'fully-paid' ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">Paid ✅</span>
                            ) : c.advancePaid ? (
                              <span className="text-blue-700 font-semibold font-mono">Adv: ₹{c.advancePaid.toLocaleString('en-IN')}</span>
                            ) : (
                              <span className="text-gray-400">Unpaid</span>
                            )}
                          </div>
                        </button>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <button
                          type="button"
                          onClick={(e) => openEdit(e, c, 'status')}
                          title="Click to change status"
                          className="hover:scale-105 hover:opacity-80 active:scale-95 transition-all"
                        >
                          <StatusBadge status={c.status} />
                        </button>
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

                      {/* Actions: Move to New + View */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isNewSt && (
                            <button
                              type="button"
                              onClick={(e) => handleMoveToNew(e, c)}
                              className="text-[10px] font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 rounded px-1.5 py-1 transition-colors flex items-center gap-0.5 whitespace-nowrap"
                              title="Move back to New column"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>To New</span>
                            </button>
                          )}
                          <Link
                            href={`/clients/${c._id}`}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-[#2C8567] hover:bg-[#2C8567]/8 transition-colors"
                            title="View client"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination (only in grid and table view, kanban shows full pipeline) */}
        {viewMode !== 'kanban' && totalPages > 1 && (
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
