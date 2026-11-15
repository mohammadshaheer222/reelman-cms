'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Plus,
  Send,
  MessageCircle,
  HardDrive,
  Video,
  Image as ImageIcon,
  CheckSquare,
  Film,
  BookOpen,
  Calendar,
  Sparkles,
  Link as LinkIcon,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Client, DeliverableMilestone, DEFAULT_DELIVERABLE_MILESTONES } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { openWhatsApp, formatMilestoneUpdateWhatsAppMessage } from '@/lib/whatsapp';
import { toast } from 'sonner';

interface DeliverableTrackerProps {
  client: Client;
  onUpdate: (updatedDeliverables: DeliverableMilestone[]) => Promise<void>;
  readOnly?: boolean;
}

const MILESTONE_ICONS: Record<string, React.ReactNode> = {
  'raw-backup': <HardDrive className="w-4 h-4 text-slate-700" />,
  'teaser-reel': <Video className="w-4 h-4 text-purple-600" />,
  'photo-gallery': <ImageIcon className="w-4 h-4 text-blue-600" />,
  'photo-selections': <CheckSquare className="w-4 h-4 text-amber-600" />,
  'wedding-film': <Film className="w-4 h-4 text-rose-600" />,
  'album-shipped': <BookOpen className="w-4 h-4 text-emerald-600" />,
};

export function DeliverableTracker({ client, onUpdate, readOnly = false }: DeliverableTrackerProps) {
  const [deliverables, setDeliverables] = useState<DeliverableMilestone[]>(
    client.deliverables && client.deliverables.length > 0
      ? client.deliverables
      : DEFAULT_DELIVERABLE_MILESTONES
  );
  const [saving, setSaving] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState('');

  // Calculate days elapsed since shoot
  const shootDate = client.date ? new Date(client.date) : null;
  const now = new Date();
  let daysElapsed = 0;
  let isShootPast = false;
  let isShootToday = false;
  let daysUntilShoot = 0;

  if (shootDate && !isNaN(shootDate.getTime())) {
    const diffTime = now.getTime() - shootDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      isShootPast = true;
      daysElapsed = diffDays;
    } else if (diffDays === 0) {
      isShootToday = true;
      daysElapsed = 0;
    } else {
      daysUntilShoot = Math.abs(diffDays);
    }
  }

  // Progress metrics
  const completedCount = deliverables.filter((m) => m.status === 'completed').length;
  const inProgressCount = deliverables.filter((m) => m.status === 'in-progress').length;
  const totalCount = deliverables.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleStatusChange = async (
    milestoneId: string,
    newStatus: 'pending' | 'in-progress' | 'completed'
  ) => {
    if (readOnly) return;
    const updated = deliverables.map((m) => {
      if (m.id === milestoneId) {
        return {
          ...m,
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
        };
      }
      return m;
    });

    setDeliverables(updated);
    setSaving(true);
    try {
      await onUpdate(updated);
      toast.success(
        `Updated "${deliverables.find((m) => m.id === milestoneId)?.title}" to ${newStatus}`
      );
    } catch {
      toast.error('Failed to update milestone');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLink = async (milestoneId: string) => {
    if (readOnly) return;
    const updated = deliverables.map((m) => {
      if (m.id === milestoneId) {
        return {
          ...m,
          link: linkInput.trim() || undefined,
        };
      }
      return m;
    });

    setDeliverables(updated);
    setEditingLinkId(null);
    setLinkInput('');
    setSaving(true);
    try {
      await onUpdate(updated);
      toast.success('Deliverable link saved');
    } catch {
      toast.error('Failed to save link');
    } finally {
      setSaving(false);
    }
  };

  const handleNotifyClient = (milestone: DeliverableMilestone) => {
    if (!client.phone) {
      toast.error('No phone number saved for this client.');
      return;
    }
    const portalUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/portal/${client._id}`
        : undefined;

    const message = formatMilestoneUpdateWhatsAppMessage({
      name: client.name,
      milestoneTitle: milestone.title,
      link: milestone.link,
      portalUrl,
    });

    openWhatsApp(client.phone, client.name, message);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Shoot Days Counter & Overall Progress Meter */}
      <div className="bg-gradient-to-br from-white to-gray-50/80 dark:from-[#14171d] dark:to-[#101216] p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#2C8567]/10 text-[#2C8567]">
                <Clock className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Post-Production Pipeline
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
              Deliverable milestones and turnaround tracking for raw files, teasers, films, and albums.
            </p>
          </div>

          {/* Days Elapsed Badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap w-full sm:w-auto justify-between sm:justify-end">
            {shootDate ? (
              isShootPast ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 text-xs font-semibold shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>
                    <strong className="font-mono text-sm">{daysElapsed}</strong>{' '}
                    {daysElapsed === 1 ? 'day' : 'days'} elapsed
                  </span>
                </div>
              ) : isShootToday ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Shoot is Today! 📸</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>In {daysUntilShoot} days</span>
                </div>
              )
            ) : (
              <span className="text-xs text-gray-400 dark:text-neutral-500 italic">No shoot date set</span>
            )}

            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 text-xs font-semibold">
              <span>{completedCount}/{totalCount} Done</span>
              <span className="font-mono">({progressPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#2C8567] h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="hidden sm:flex justify-between text-[11px] text-gray-500 dark:text-neutral-400 font-medium">
            <span>Raw Capture</span>
            <span>72h Teaser</span>
            <span>Gallery</span>
            <span>Final Film</span>
            <span>Album Shipped</span>
          </div>
        </div>
      </div>

      {/* Deliverables Checklist Cards */}
      <div className="space-y-2.5">
        {deliverables.map((milestone, idx) => {
          const isCompleted = milestone.status === 'completed';
          const isInProgress = milestone.status === 'in-progress';
          const icon = MILESTONE_ICONS[milestone.id] || <Sparkles className="w-4 h-4 text-[#2C8567]" />;

          // Calculate urgency / deadline
          let targetLabel = '';
          let isOverdue = false;
          let daysRemaining = 0;

          if (isShootPast && milestone.targetDays !== undefined && !isCompleted) {
            if (daysElapsed > milestone.targetDays) {
              isOverdue = true;
              targetLabel = `Overdue by ${daysElapsed - milestone.targetDays}d`;
            } else {
              daysRemaining = milestone.targetDays - daysElapsed;
              targetLabel = daysRemaining === 0 ? 'Due Today' : `${daysRemaining}d remaining`;
            }
          } else if (milestone.targetDays) {
            targetLabel = `Target: Day ${milestone.targetDays}`;
          }

          return (
            <div
              key={milestone.id}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                isCompleted
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60'
                  : isInProgress
                  ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-800/60 shadow-2xs'
                  : isOverdue
                  ? 'bg-red-50/25 dark:bg-red-950/20 border-red-200/80 dark:border-red-800/60'
                  : 'bg-white dark:bg-[#14171d] border-gray-100 dark:border-neutral-800 hover:border-gray-200 dark:hover:border-neutral-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Milestone Info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isCompleted
                        ? 'bg-emerald-100/70 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : isInProgress
                        ? 'bg-blue-100/70 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-neutral-800 border-gray-200/80 dark:border-neutral-700 text-gray-600 dark:text-neutral-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5 text-[#2C8567]" /> : icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm font-bold truncate ${
                          isCompleted ? 'text-emerald-950 dark:text-emerald-300 line-through opacity-85' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {milestone.title}
                      </h4>

                      {/* Deadline / Target Badge */}
                      {targetLabel && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isCompleted
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : isOverdue
                              ? 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800 animate-pulse'
                              : isInProgress
                              ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                              : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 border-gray-200 dark:border-neutral-700'
                          }`}
                        >
                          {isCompleted ? 'Delivered ✅' : targetLabel}
                        </span>
                      )}
                    </div>

                    {milestone.description && (
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 truncate">
                        {milestone.description}
                      </p>
                    )}

                    {/* Link display if exists */}
                    {milestone.link && (
                      <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
                        <LinkIcon className="w-3 h-3 text-[#2C8567] shrink-0" />
                        <a
                          href={milestone.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#2C8567] hover:underline font-medium truncate max-w-[190px] xs:max-w-[240px] sm:max-w-md inline-block"
                        >
                          {milestone.link}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions & Status Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto pt-2.5 sm:pt-0 border-t border-gray-100 dark:border-neutral-800 sm:border-0 min-w-0">
                  {/* Status Toggle Buttons (Full-width grid on mobile, inline on desktop) */}
                  {!readOnly && (
                    <div className="grid grid-cols-3 sm:flex p-0.5 rounded-lg bg-gray-100 dark:bg-neutral-800 border border-gray-200/80 dark:border-neutral-700 text-xs w-full sm:w-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(milestone.id, 'pending')}
                        className={`py-1.5 px-2 rounded-md transition-all font-medium text-center truncate ${
                          milestone.status === 'pending'
                            ? 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-2xs font-semibold'
                            : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(milestone.id, 'in-progress')}
                        className={`py-1.5 px-2 rounded-md transition-all font-medium text-center truncate ${
                          milestone.status === 'in-progress'
                            ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                            : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(milestone.id, 'completed')}
                        className={`py-1.5 px-2 rounded-md transition-all font-medium text-center truncate ${
                          milestone.status === 'completed'
                            ? 'bg-[#2C8567] text-white shadow-2xs font-semibold'
                            : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Done ✅
                      </button>
                    </div>
                  )}

                  {/* Actions row: Link & WhatsApp */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0">
                    {/* Add / Edit Link Button */}
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingLinkId(milestone.id);
                          setLinkInput(milestone.link || '');
                        }}
                        className="h-8 text-xs text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white gap-1 px-2.5 bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 sm:bg-transparent flex-1 sm:flex-initial justify-center cursor-pointer"
                        title="Attach Drive/Gallery link for couple"
                      >
                        <LinkIcon className="w-3 h-3 text-gray-500 shrink-0" />
                        <span>{milestone.link ? 'Edit Link' : 'Add Link'}</span>
                      </Button>
                    )}

                    {/* Send WhatsApp Celebration / Update Button */}
                    {client.phone && !readOnly && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleNotifyClient(milestone)}
                        className="h-8 text-xs text-[#2C8567] border-emerald-200 hover:bg-emerald-50 gap-1 px-2.5 font-semibold shrink-0 flex-1 sm:flex-initial justify-center cursor-pointer"
                        title="Send WhatsApp update to client"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#2C8567] shrink-0" />
                        <span>Notify Client</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* In-place Link Editor */}
              {editingLinkId === milestone.id && !readOnly && (
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    placeholder="Paste Google Drive, Pixieset, or gallery URL..."
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    className="h-8 text-xs flex-1 min-w-0"
                  />
                  <div className="flex items-center gap-2 justify-end shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingLinkId(null)}
                      className="h-8 text-xs px-2.5"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSaveLink(milestone.id)}
                      className="h-8 text-xs bg-[#2C8567] hover:bg-[#236d54] text-white px-3 font-semibold"
                    >
                      Save Link
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
