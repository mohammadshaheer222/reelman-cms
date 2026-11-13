'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import {
  GripVertical,
  Plus,
  Calendar,
  Phone,
  MessageCircle,
  MessageSquare,
  ExternalLink,
  ChevronDown,
  RotateCcw,
  IndianRupee,
} from 'lucide-react';
import { Client, Status } from '@/types';
import { formatDate, timeAgo } from '@/lib/utils';
import { openWhatsApp, formatStatusWhatsAppMessage } from '@/lib/whatsapp';
import { toast } from 'sonner';
import { ClientQuickEditModal, EditField } from './ClientQuickEditModal';
import { StatusBadge } from './StatusBadge';

interface KanbanBoardProps {
  clients: Client[];
  statuses: Status[];
  onClientUpdated?: (updated: Client) => void;
  onAddClientForStatus?: (statusId: string) => void;
  onOpenCallIntake?: (statusId?: string) => void;
}

export function KanbanBoard({
  clients: initialClients,
  statuses,
  onClientUpdated,
  onAddClientForStatus,
  onOpenCallIntake,
}: KanbanBoardProps) {
  const [, startTransition] = useTransition();

  // Local overrides for optimistic updates
  const [overrides, setOverrides] = useState<Record<string, Client>>({});
  const [draggingClientId, setDraggingClientId] = useState<string | null>(null);
  const [dragOverStatusId, setDragOverStatusId] = useState<string | null>(null);

  // Quick edit modal target
  const [editTarget, setEditTarget] = useState<{ client: Client; field: EditField } | null>(null);

  // Merge initial clients with local overrides
  const effectiveClients = useMemo(() => {
    return initialClients.map((c) => overrides[c._id] ?? c);
  }, [initialClients, overrides]);

  // Group clients by status ID
  const columns = useMemo(() => {
    const map: Record<string, Client[]> = {};
    statuses.forEach((s) => {
      map[s._id] = [];
    });

    effectiveClients.forEach((client) => {
      const statusId =
        typeof client.status === 'object' && client.status !== null
          ? client.status._id
          : (client.status as string);

      if (statusId && map[statusId]) {
        map[statusId].push(client);
      } else if (statuses.length > 0) {
        // Fallback to first status if not matched
        const fallbackId = statuses[0]._id;
        if (!map[fallbackId]) map[fallbackId] = [];
        map[fallbackId].push(client);
      }
    });

    return map;
  }, [effectiveClients, statuses]);

  // Total work price value per column
  const columnTotalValues = useMemo(() => {
    const map: Record<string, number> = {};
    statuses.forEach((s) => {
      const cls = columns[s._id] || [];
      map[s._id] = cls.reduce((sum, c) => sum + (c.workPrice || 0), 0);
    });
    return map;
  }, [columns, statuses]);

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, client: Client) => {
    e.dataTransfer.setData('text/plain', client._id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingClientId(client._id);
  };

  // Handle Drag End
  const handleDragEnd = () => {
    setDraggingClientId(null);
    setDragOverStatusId(null);
  };

  // Handle Drag Over Column
  const handleDragOverColumn = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatusId !== statusId) {
      setDragOverStatusId(statusId);
    }
  };

  // Handle Drag Leave Column
  const handleDragLeaveColumn = (e: React.DragEvent, statusId: string) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverStatusId === statusId) {
        setDragOverStatusId(null);
      }
    }
  };

  // Handle Drop onto a Status Column
  const handleDrop = async (e: React.DragEvent, targetStatus: Status) => {
    e.preventDefault();
    setDragOverStatusId(null);

    const clientId = e.dataTransfer.getData('text/plain') || draggingClientId;
    setDraggingClientId(null);

    if (!clientId) return;

    const client = effectiveClients.find((c) => c._id === clientId);
    if (!client) return;

    const currentStatusId =
      typeof client.status === 'object' && client.status !== null
        ? client.status._id
        : (client.status as string);

    // If dropped onto the same status, do nothing
    if (currentStatusId === targetStatus._id) return;

    // Optimistic Update
    const prevClient = { ...client };
    const updatedClient: Client = {
      ...client,
      status: targetStatus,
      statusHistory: [
        ...(client.statusHistory || []),
        {
          status: targetStatus._id,
          statusName: targetStatus.name,
          changedBy: 'You',
          changedAt: new Date().toISOString(),
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    startTransition(() => {
      setOverrides((prev) => ({ ...prev, [clientId]: updatedClient }));
    });

    toast.success(
      `Moved "${client.name || 'Client'}" → ${targetStatus.name}`,
      {
        icon: (
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: targetStatus.color }}
          />
        ),
      }
    );

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: targetStatus._id }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      const json = await res.json();
      const serverUpdated: Client = json.data || updatedClient;

      setOverrides((prev) => ({ ...prev, [clientId]: serverUpdated }));
      onClientUpdated?.(serverUpdated);
      window.dispatchEvent(new CustomEvent('client-updated', { detail: serverUpdated }));
    } catch {
      // Revert optimistic update on failure
      setOverrides((prev) => ({ ...prev, [clientId]: prevClient }));
      toast.error(`Could not move to "${targetStatus.name}". Reverted.`);
    }
  };

  // 1-Click "Move to New" option
  const handleMoveToNew = async (e: React.MouseEvent, client: Client) => {
    e.preventDefault();
    e.stopPropagation();

    const newStatus =
      statuses.find((s) => s.name.toLowerCase() === 'new') ||
      statuses.find((s) => s.isDefault) ||
      statuses[0];

    if (!newStatus) return;

    const prevClient = { ...client };
    const updatedClient: Client = {
      ...client,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    setOverrides((prev) => ({ ...prev, [client._id]: updatedClient }));
    toast.success(
      `Moved "${client.name || 'Client'}" → New`,
      {
        icon: <RotateCcw className="w-3.5 h-3.5 text-[#2C8567]" />,
      }
    );

    try {
      const res = await fetch(`/api/clients/${client._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: newStatus._id }),
      });
      if (!res.ok) throw new Error('Update failed');
      const json = await res.json();
      setOverrides((prev) => ({ ...prev, [client._id]: json.data }));
      onClientUpdated?.(json.data);
      window.dispatchEvent(new CustomEvent('client-updated', { detail: json.data }));
    } catch {
      setOverrides((prev) => ({ ...prev, [client._id]: prevClient }));
      toast.error('Could not move to New');
    }
  };

  // Open Quick Edit
  const openEdit = (e: React.MouseEvent, client: Client, field: EditField) => {
    e.preventDefault();
    e.stopPropagation();
    setEditTarget({ client: overrides[client._id] ?? client, field });
  };

  // WhatsApp click handler
  const handleWhatsAppClick = (e: React.MouseEvent, client: Client) => {
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

  return (
    <>
      <div className="relative w-full">
        {/* Kanban Board Container with smooth horizontal scrolling */}
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 px-0.5 modal-scroll snap-x">
          {statuses.map((status) => {
            const columnClients = columns[status._id] || [];
            const isDragOver = dragOverStatusId === status._id;
            const totalStageValue = columnTotalValues[status._id] || 0;
            const isNewColumn = status.name.toLowerCase() === 'new';

            return (
              <div
                key={status._id}
                onDragOver={(e) => handleDragOverColumn(e, status._id)}
                onDragLeave={(e) => handleDragLeaveColumn(e, status._id)}
                onDrop={(e) => handleDrop(e, status)}
                className={`flex-shrink-0 w-80 flex flex-col rounded-2xl transition-all duration-200 border ${
                  isDragOver
                    ? 'bg-[#2C8567]/5 border-[#2C8567] ring-2 ring-[#2C8567]/30 shadow-lg scale-[1.01]'
                    : 'bg-gray-50/90 border-gray-200/80 shadow-sm'
                }`}
                style={{
                  minHeight: '520px',
                }}
              >
                {/* Column Header */}
                <div className="p-3.5 pb-2.5 border-b border-gray-200/60 bg-white/80 backdrop-blur-xs rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: status.color }}
                      />
                      <h3 className="font-semibold text-sm text-gray-800 truncate" title={status.name}>
                        {status.name}
                      </h3>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${status.color}18`,
                          color: status.color,
                        }}
                      >
                        {columnClients.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (onAddClientForStatus) {
                            onAddClientForStatus(status._id);
                          } else if (onOpenCallIntake) {
                            onOpenCallIntake(status._id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        title={`Add client to "${status.name}"`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Confirmed Work Price / Pipeline total for this column */}
                  {totalStageValue > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-1 mt-1 border-t border-gray-100/70">
                      <span>Confirmed Work:</span>
                      <span className="font-bold text-gray-900 font-mono">
                        ₹{totalStageValue.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Column Droppable Body */}
                <div className="flex-1 p-2.5 flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-250px)] modal-scroll">
                  {columnClients.length === 0 ? (
                    <div
                      className={`flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed rounded-xl transition-colors ${
                        isDragOver
                          ? 'border-[#2C8567] bg-[#2C8567]/10 text-[#2C8567]'
                          : 'border-gray-200/70 text-gray-400'
                      }`}
                    >
                      <p className="text-xs font-medium">
                        {isDragOver ? 'Drop here to change status' : 'No clients in this stage'}
                      </p>
                      <button
                        type="button"
                        onClick={() => onAddClientForStatus?.(status._id)}
                        className="mt-2 text-[11px] font-semibold text-[#2C8567] hover:underline inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add client
                      </button>
                    </div>
                  ) : (
                    columnClients.map((client) => {
                      const isDragging = draggingClientId === client._id;
                      const latestNote =
                        client.notes && client.notes.length > 0
                          ? client.notes[client.notes.length - 1]
                          : null;

                      const hasWorkPrice = typeof client.workPrice === 'number' && client.workPrice > 0;
                      const hasAdvance = typeof client.advancePaid === 'number' && client.advancePaid > 0;

                      return (
                        <div
                          key={client._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, client)}
                          onDragEnd={handleDragEnd}
                          className={`group relative bg-white rounded-xl border border-gray-200/80 p-3 shadow-xs hover:shadow-md hover:border-[#2C8567]/40 transition-all cursor-grab active:cursor-grabbing select-none ${
                            isDragging
                              ? 'opacity-40 scale-95 ring-2 ring-[#2C8567] shadow-xl rotate-1'
                              : ''
                          }`}
                        >
                          {/* Card Top: Drag handle + Name + View link */}
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
                              <button
                                type="button"
                                onClick={(e) => openEdit(e, client, 'name')}
                                className="font-semibold text-xs sm:text-sm text-gray-900 hover:text-[#2C8567] transition-colors truncate text-left"
                                title="Click to edit name"
                              >
                                {client.name || (
                                  <span className="text-gray-400 italic font-normal">
                                    + Add Name
                                  </span>
                                )}
                              </button>
                            </div>

                            <Link
                              href={`/clients/${client._id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-300 hover:text-[#2C8567] p-0.5 rounded transition-colors shrink-0"
                              title="Open client details"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>

                          {/* Event Date badge */}
                          <div className="mb-2">
                            <button
                              type="button"
                              onClick={(e) => openEdit(e, client, 'date')}
                              title="Click to set/change event date"
                              className="w-full text-left inline-flex items-center gap-1.5 py-1 px-2 rounded-md bg-[#2C8567]/6 hover:bg-[#2C8567]/12 border border-[#2C8567]/15 text-[11px] font-medium text-gray-800 transition-colors"
                            >
                              <Calendar className="w-3 h-3 text-[#2C8567] shrink-0" />
                              <span className="text-gray-500 font-normal">Date:</span>
                              <span className="font-semibold truncate">
                                {client.date ? (
                                  formatDate(client.date)
                                ) : (
                                  <span className="text-gray-400 font-normal italic">
                                    + Set date
                                  </span>
                                )}
                              </span>
                            </button>
                          </div>

                          {/* Confirmed Work Price & Payment details */}
                          <div className="mb-2">
                            <button
                              type="button"
                              onClick={(e) => openEdit(e, client, 'price')}
                              className="w-full text-left flex items-center justify-between gap-1 py-1 px-2 rounded-md bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/80 text-[11px] transition-colors"
                              title="Click to edit work price & payment"
                            >
                              <div className="flex items-center gap-1 min-w-0">
                                <IndianRupee className="w-3 h-3 text-emerald-700 shrink-0" />
                                <span className="font-bold text-emerald-900 truncate font-mono">
                                  {hasWorkPrice
                                    ? `₹${client.workPrice!.toLocaleString('en-IN')}`
                                    : '+ Work Price'}
                                </span>
                              </div>

                              <div className="shrink-0 flex items-center gap-1 text-[10px]">
                                {client.paymentStatus === 'fully-paid' ? (
                                  <span className="font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.2 rounded">
                                    Paid ✅
                                  </span>
                                ) : hasAdvance ? (
                                  <span className="font-semibold text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded font-mono">
                                    Adv: ₹{client.advancePaid!.toLocaleString('en-IN')}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">Unpaid</span>
                                )}
                              </div>
                            </button>
                          </div>

                          {/* Phone & WhatsApp row */}
                          <div className="flex items-center justify-between gap-1 py-1 px-2 bg-gray-50/90 rounded-md border border-gray-100 text-[11px] mb-2">
                            <button
                              type="button"
                              onClick={(e) => openEdit(e, client, 'phone')}
                              className="flex items-center gap-1.5 text-gray-700 hover:text-[#2C8567] truncate font-mono text-[11px]"
                              title="Click to edit phone"
                            >
                              <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate">
                                {client.phone || (
                                  <span className="text-gray-400 italic font-sans">+ Add phone</span>
                                )}
                              </span>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              {client.phone && (
                                <>
                                  <a
                                    href={`tel:${client.phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 text-gray-500 hover:text-[#2C8567] hover:bg-white rounded transition-colors"
                                    title="Call client"
                                  >
                                    <Phone className="w-3 h-3" />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={(e) => handleWhatsAppClick(e, client)}
                                    className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                                    title="Chat on WhatsApp"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Latest Note Snippet */}
                          {latestNote ? (
                            <p className="text-[11px] text-gray-600 line-clamp-2 bg-gray-50/70 p-1.5 rounded border border-gray-100/60 leading-relaxed mb-2 font-normal">
                              {latestNote.content}
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-300 italic mb-2">No notes added</p>
                          )}

                          {/* Card Footer: Status button + Notes count + Move to New button */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 text-[11px] text-gray-400">
                            {/* Tap status button for mobile or non-drag users */}
                            <button
                              type="button"
                              onClick={(e) => openEdit(e, client, 'status')}
                              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                              title="Click to change status"
                            >
                              <StatusBadge status={client.status} size="sm" />
                              <ChevronDown className="w-3 h-3 text-gray-400" />
                            </button>

                            <div className="flex items-center gap-1.5">
                              {/* 1-Click "Move to New" button (only for cards not currently in New column) */}
                              {!isNewColumn && (
                                <button
                                  type="button"
                                  onClick={(e) => handleMoveToNew(e, client)}
                                  className="text-[10px] font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 rounded px-1.5 py-0.5 transition-colors flex items-center gap-0.5"
                                  title="1-click Move back to New column"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  <span>Move to New</span>
                                </button>
                              )}

                              <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                                <span className="flex items-center gap-0.5">
                                  <MessageSquare className="w-2.5 h-2.5" />
                                  {client.notes?.length || 0}
                                </span>
                                <span>{timeAgo(client.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Column Quick Add Footer */}
                <div className="p-2 pt-1 border-t border-gray-200/40 bg-gray-50/50 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      if (onAddClientForStatus) {
                        onAddClientForStatus(status._id);
                      } else if (onOpenCallIntake) {
                        onOpenCallIntake(status._id);
                      }
                    }}
                    className="w-full py-1.5 px-3 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-white rounded-lg transition-all border border-dashed border-gray-200 hover:border-gray-300 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to {status.name}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shared Quick Edit Modal (supports name, phone, date, status, and price) */}
      {editTarget && (
        <ClientQuickEditModal
          client={editTarget.client}
          field={editTarget.field}
          statuses={statuses}
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          onSuccess={(updated) => {
            setOverrides((prev) => ({ ...prev, [updated._id]: updated }));
            onClientUpdated?.(updated);
          }}
        />
      )}
    </>
  );
}
