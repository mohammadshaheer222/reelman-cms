'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Calendar,
  ChevronRight,
  Phone,
  MessageCircle,
  IndianRupee,
  RotateCcw,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Client, Status } from '@/types';
import { StatusBadge } from './StatusBadge';
import { timeAgo, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { openWhatsApp, formatStatusWhatsAppMessage } from '@/lib/whatsapp';
import { toast } from 'sonner';
import { ClientQuickEditModal, EditField } from './ClientQuickEditModal';

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

  const currentStatusName =
    typeof client.status === 'object' && client.status !== null
      ? client.status.name
      : (client.status as string);
  const isNewStatus = (currentStatusName || '').toLowerCase() === 'new';

  const hasWorkPrice = typeof client.workPrice === 'number' && client.workPrice > 0;
  const hasAdvance = typeof client.advancePaid === 'number' && client.advancePaid > 0;

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

  const handleMoveToNew = async (e: React.MouseEvent) => {
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

  const openEdit = (e: React.MouseEvent, field: EditField) => {
    e.preventDefault();
    e.stopPropagation();
    setEditField(field);
  };

  const handleUpdated = (updated: Client) => {
    setClient(updated);
    onUpdated?.(updated);
  };

  return (
    <>
      <Card
        onClick={() => router.push(`/clients/${client._id}`)}
        className="rounded-2xl border border-gray-100/90 bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)] hover:border-gray-200 transition-all group flex flex-col h-full justify-between cursor-pointer"
      >
        <div>
          {/* Name — click to edit */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={(e) => openEdit(e, 'name')}
                className="text-left w-full hover:text-[#dc2626] transition-colors"
                title="Click to edit name"
              >
                <h3 className="font-bold text-base text-[#141414] hover:text-[#dc2626] transition-colors truncate">
                  {client.name || (
                    <span className="text-gray-400 italic font-normal">+ Add Name</span>
                  )}
                </h3>
              </button>
            </div>

            {/* Status — click to change */}
            <button
              type="button"
              onClick={(e) => openEdit(e, 'status')}
              title="Click to change status"
              className="shrink-0 hover:scale-105 hover:opacity-90 transition-all active:scale-95"
            >
              <StatusBadge status={client.status} />
            </button>
          </div>

          {/* Date — click to edit */}
          <button
            type="button"
            onClick={(e) => openEdit(e, 'date')}
            title="Click to set event date"
            className="w-full text-left flex items-center justify-between gap-1.5 mt-2 py-1.5 px-2.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-200/60 rounded-xl text-xs transition-colors group/date"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-[#dc2626] shrink-0" />
              <span className="font-semibold text-[#141414] truncate">
                {client.date ? (
                  formatDate(client.date)
                ) : (
                  <span className="text-gray-400 font-normal italic">Tap to set date</span>
                )}
              </span>
            </div>
            {client.dates && client.dates.length > 1 && (
              <span className="text-[10px] font-bold text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded-full shrink-0">
                +{client.dates.length - 1} days
              </span>
            )}
          </button>

          {/* Location */}
          {client.location && (
            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400 truncate px-1">
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">{client.location}</span>
            </div>
          )}

          {/* Requirements */}
          {client.requirements && client.requirements.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {client.requirements.map((req, i) => (
                <span
                  key={i}
                  className="text-[10px] font-semibold text-gray-700 bg-gray-100 border border-gray-200/60 px-2 py-0.5 rounded-full truncate max-w-[130px]"
                >
                  {req}
                </span>
              ))}
            </div>
          )}

          {/* Confirmed Work Price & Payment — click to edit */}
          <div
            onClick={(e) => openEdit(e, 'price')}
            className="flex items-center justify-between gap-1.5 mt-2 py-1.5 px-2.5 bg-gray-50 hover:bg-gray-100/70 border border-gray-200/60 rounded-xl text-xs cursor-pointer transition-colors"
            title="Click to edit confirmed work price & payment"
          >
            <div className="flex items-center gap-1 min-w-0">
              <IndianRupee className="w-3.5 h-3.5 text-[#141414] shrink-0" />
              <span className="font-bold text-[#141414] truncate font-mono">
                {hasWorkPrice
                  ? `₹${client.workPrice!.toLocaleString('en-IN')}`
                  : '+ Add Work Price'}
              </span>
            </div>

            <div className="shrink-0 flex items-center gap-1 text-[10px]">
              {client.paymentStatus === 'fully-paid' ? (
                <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                  Paid ✅
                </span>
              ) : hasAdvance ? (
                <span className="font-semibold text-blue-700 bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-full font-mono">
                  Adv: ₹{client.advancePaid!.toLocaleString('en-IN')}
                </span>
              ) : (
                <span className="text-gray-400 font-medium">Unpaid</span>
              )}
            </div>
          </div>

          {/* Phone — click to edit, WhatsApp button separate */}
          <div
            className="flex items-center justify-between gap-2 mt-2 py-1.5 px-2.5 bg-gray-50/70 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100/60 hover:border-gray-200 transition-colors"
            onClick={(e) => openEdit(e, 'phone')}
            title="Click to edit phone number"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs font-mono font-medium text-gray-700 truncate">
                {client.phone || (
                  <span className="text-gray-400 italic font-sans">+ Add phone</span>
                )}
              </span>
            </div>
            {client.phone && (
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-2 py-0.5 rounded-full transition-colors"
                title="Send WhatsApp message"
              >
                <MessageCircle className="w-3 h-3 text-emerald-600" />
                <span>WhatsApp</span>
              </button>
            )}
          </div>

          {/* Latest Note */}
          {latestNote ? (
            <p className="text-xs text-gray-500 line-clamp-2 mt-2.5 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100/70 leading-relaxed font-normal">
              {latestNote.content}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic mt-2.5">No notes yet</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100 mt-3">
          <div className="flex items-center gap-2">
            {!isNewStatus && (
              <button
                type="button"
                onClick={handleMoveToNew}
                className="text-[10px] font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 rounded-full px-2 py-0.5 transition-colors flex items-center gap-0.5"
                title="1-click Move back to New column"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Move to New</span>
              </button>
            )}

            <span className="flex items-center gap-1 font-medium">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              {client.notes?.length || 0}
            </span>
            <span title={`Added: ${formatDate(client.createdAt)}`}>
              {timeAgo(client.createdAt)}
            </span>
          </div>

          <Link
            href={`/clients/${client._id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-gray-300 hover:text-[#dc2626] transition-colors p-1"
          >
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </Card>

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
