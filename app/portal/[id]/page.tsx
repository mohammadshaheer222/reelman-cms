'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Camera,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  IndianRupee,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Phone,
  HardDrive,
  Video,
  Image as ImageIcon,
  CheckSquare,
  Film,
  BookOpen,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeliverableMilestone, PaymentInstallment } from '@/types';
import { openWhatsApp } from '@/lib/whatsapp';

const MILESTONE_ICONS: Record<string, React.ReactNode> = {
  'raw-backup': <HardDrive className="w-5 h-5 text-slate-700" />,
  'teaser-reel': <Video className="w-5 h-5 text-purple-600" />,
  'photo-gallery': <ImageIcon className="w-5 h-5 text-blue-600" />,
  'photo-selections': <CheckSquare className="w-5 h-5 text-amber-600" />,
  'wedding-film': <Film className="w-5 h-5 text-rose-600" />,
  'album-shipped': <BookOpen className="w-5 h-5 text-emerald-600" />,
};

interface PortalData {
  _id: string;
  clientId: string;
  name: string;
  date?: string;
  dates?: string[];
  location?: string;
  requirements?: string[];
  packageDetails?: string;
  workPrice: number;
  advancePaid: number;
  paymentStatus: string;
  deliverables: DeliverableMilestone[];
  installments: PaymentInstallment[];
}

export default function ClientPortalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/portal/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Booking not found');
        return res.json();
      })
      .then((json) => {
        setData(json.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Could not load booking');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-[#2C8567]/10 flex items-center justify-center text-[#2C8567] animate-pulse">
          <Camera className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-gray-600 mt-3">Loading your booking portal...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <Camera className="w-10 h-10 text-gray-400 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900">Booking Record Not Found</h2>
          <p className="text-xs text-gray-500">
            Please check the link provided by Reelman Production or reach out directly to the studio.
          </p>
        </div>
      </div>
    );
  }

  const completedCount = data.deliverables.filter((d) => d.status === 'completed').length;
  const totalDeliverables = data.deliverables.length;
  const progressPercent = totalDeliverables > 0 ? Math.round((completedCount / totalDeliverables) * 100) : 0;

  const totalCollected = data.installments.reduce((sum, inst) => {
    return sum + (inst.status === 'paid' ? (inst.paidAmount || inst.amount || 0) : 0);
  }, 0);
  const remainingBalance = Math.max(0, data.workPrice - totalCollected);

  const formattedDate = data.date
    ? new Date(data.date).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Date to be finalized';

  return (
    <div className="min-h-screen bg-slate-50/70 pb-12 font-sans selection:bg-[#2C8567] selection:text-white">
      {/* Studio Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 py-3 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2C8567] flex items-center justify-center text-white font-bold shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight leading-none">
                Reelman Production
              </h1>
              <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-[#2C8567]" />
                <span>Verified Client Booking Portal</span>
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() =>
              openWhatsApp(
                '919876543210',
                data.name,
                `Hi Reelman Production! Inquiring about our booking (${data.name}).`
              )
            }
            className="bg-[#2C8567] hover:bg-[#236d54] text-white text-xs gap-1.5 h-8 shadow-2xs"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat with Studio</span>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Card: Booking Confirmation */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Booking Confirmed</span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {data.name}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-xs sm:text-sm text-gray-300 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>{formattedDate}</span>
                </span>
                {data.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>{data.location}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Requirements pills */}
            {data.requirements && data.requirements.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {data.requirements.map((req) => (
                  <span
                    key={req}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white/10 text-emerald-100 border border-white/10 backdrop-blur-xs"
                  >
                    {req}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Feature 1: Live Deliverables Pipeline Tracker */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2C8567]" />
                <span>Post-Production Deliverables Progress</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Track your raw photo backups, 72h teaser reel, proofing gallery, wedding film, and album.
              </p>
            </div>
            <div className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full self-start sm:self-auto">
              {completedCount} of {totalDeliverables} Delivered ({progressPercent}%)
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#2C8567] h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Milestones list */}
          <div className="space-y-3 pt-2">
            {data.deliverables.map((m) => {
              const isDone = m.status === 'completed';
              const isInProgress = m.status === 'in-progress';
              const icon = MILESTONE_ICONS[m.id] || <Sparkles className="w-5 h-5 text-[#2C8567]" />;

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : isInProgress
                      ? 'bg-blue-50/40 border-blue-200'
                      : 'bg-white border-gray-200/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isDone
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : isInProgress
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-gray-100 border-gray-200 text-gray-500'
                      }`}
                    >
                      {icon}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`text-sm font-bold ${
                            isDone ? 'text-emerald-950 line-through opacity-80' : 'text-gray-900'
                          }`}
                        >
                          {m.title}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isInProgress
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {isDone ? 'Completed ✅' : isInProgress ? 'In Editing / Review 🔄' : 'Scheduled ⏳'}
                        </span>
                      </div>
                      {m.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Link action if available */}
                  {m.link && (
                    <a
                      href={m.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C8567] hover:bg-[#236d54] text-white text-xs font-semibold shadow-2xs self-start sm:self-auto"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature 3: Payment Installment Schedule & Official Receipt */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-[#2C8567]" />
                <span>Payment Schedule & Receipts</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Official studio billing breakdown with transparent installment milestones.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                Paid: ₹{totalCollected.toLocaleString('en-IN')}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                Balance Due: ₹{remainingBalance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.installments.map((inst, idx) => {
              const isPaid = inst.status === 'paid';
              return (
                <div
                  key={inst.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isPaid
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-white border-gray-200/80'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Milestone {idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {isPaid ? 'Received ✅' : 'Due ⏳'}
                      </span>
                    </div>
                    <h5 className="font-bold text-gray-900 text-sm">{inst.name}</h5>
                    <p className="text-xs text-gray-500">{inst.dueDate}</p>
                    <p className="text-xl font-bold font-mono text-gray-900 pt-1">
                      ₹{inst.amount.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {isPaid && inst.paidAt && (
                    <p className="text-[11px] text-emerald-700 font-medium pt-2 border-t border-emerald-100/60 mt-3">
                      Receipt on{' '}
                      {new Date(inst.paidAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Package Scope & Deliverables Details if available */}
        {data.packageDetails && (
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#2C8567]" />
              <span>Confirmed Package Details</span>
            </h3>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
              {data.packageDetails}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <footer className="text-center pt-6 text-xs text-gray-400 space-y-1">
          <p>© {new Date().getFullYear()} Reelman Production. All rights reserved.</p>
          <p>Cinematic Wedding Films & Photography • Dedicated to timeless memories</p>
        </footer>
      </main>
    </div>
  );
}
