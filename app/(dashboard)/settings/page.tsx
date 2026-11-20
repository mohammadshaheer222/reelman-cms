'use client';
import { useState, useEffect } from 'react';
import {
  Plus,
  Sparkles,
  Edit2,
  Trash2,
  Check,
  Layers,
  Info,
  MessageCircle,
  Database,
  Download,
  Calendar,
  Sun,
  Moon,
  Laptop,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Status, Requirement } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TableLoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { toast } from 'sonner';
import { formatStatusWhatsAppMessage } from '@/lib/whatsapp';

const PRESET_COLORS = [
  '#dc2626', // Signature Red
  '#141414', // Carbon Black
  '#6366f1', // Indigo
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#f97316', // Orange
  '#6b7280', // Gray
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme: activeTheme, setTheme } = useTheme();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Form Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#dc2626');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete status
  const [deletingStatus, setDeletingStatus] = useState<Status | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [seeding, setSeeding] = useState(false);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [newReqInput, setNewReqInput] = useState('');
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('reelman_gemini_api_key') || '';
      setGeminiKey(saved);
    } catch {
      // Local storage unavailable
    }
  }, []);

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to download backup');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reelman_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Database backup downloaded successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Backup download failed';
      toast.error(msg);
    } finally {
      setDownloadingBackup(false);
    }
  };

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/statuses');
      if (res.ok) {
        const data = await res.json();
        setStatuses(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchRequirements = async () => {
    try {
      const res = await fetch('/api/requirements');
      if (res.ok) {
        const data = await res.json();
        setRequirements(data.data || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchStatuses();
    fetchRequirements();
  }, []);

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newReqInput.trim();
    if (!trimmed) return;

    setReqSubmitting(true);
    try {
      const res = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add');
      toast.success('Requirement option added');
      setNewReqInput('');
      fetchRequirements();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding requirement';
      toast.error(msg);
    } finally {
      setReqSubmitting(false);
    }
  };

  const handleDeleteRequirement = async (id: string) => {
    try {
      const res = await fetch(`/api/requirements/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Requirement removed');
      fetchRequirements();
    } catch {
      toast.error('Could not delete requirement');
    }
  };

  const handleOpenAdd = () => {
    setEditingStatus(null);
    setName('');
    setColor('#dc2626');
    setWhatsappMessage('');
    setModalOpen(true);
  };

  const handleOpenEdit = (s: Status) => {
    setEditingStatus(s);
    setName(s.name);
    setColor(s.color);
    setWhatsappMessage(s.whatsappMessage || '');
    setModalOpen(true);
  };

  const handleInsertVariable = (variable: string) => {
    setWhatsappMessage((prev) => (prev ? `${prev} ${variable}` : variable));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Status name is required');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingStatus
        ? `/api/statuses/${editingStatus._id}`
        : '/api/statuses';
      const method = editingStatus ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          color,
          whatsappMessage: whatsappMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save status');

      toast.success(editingStatus ? 'Status updated' : 'Status added');
      setModalOpen(false);
      fetchStatuses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving status';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStatus) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/statuses/${deletingStatus._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete status');
      toast.success('Status deleted');
      setDeletingStatus(null);
      fetchStatuses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting status';
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSeed = async (force = false) => {
    setSeeding(true);
    try {
      const res = await fetch(`/api/seed${force ? '?force=true' : ''}`);
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Statuses seeded successfully');
        fetchStatuses();
      } else {
        toast.error(data.error || 'Seed failed');
      }
    } catch {
      toast.error('Could not seed statuses');
    } finally {
      setSeeding(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#14171d] p-5 sm:p-6 rounded-2xl border border-gray-100/90 dark:border-neutral-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-neutral-500">
              System Configuration
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#141414] dark:text-white tracking-tight">
            Pipeline Settings<span className="text-[#dc2626]">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400 font-normal">
            Configure client workflow stages, colors, and automated WhatsApp prefill templates.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSeed(true)}
              disabled={seeding}
              className="text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-xl text-xs font-semibold shadow-2xs"
              title="Populates default 10 statuses and WhatsApp prefill messages"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
              {seeding ? 'Syncing...' : 'Sync Default Templates'}
            </Button>
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-[#141414] hover:bg-black dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white rounded-xl shadow-xs px-4 py-2 font-semibold transition-all hover:shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#dc2626]" />
              New Status
            </Button>
          </div>
        )}
      </div>

      {/* Statuses List Card */}
      <div className="bg-white dark:bg-[#14171d] rounded-2xl border border-gray-100/90 dark:border-neutral-800 shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-[#141414] dark:text-white">
              <Layers className="w-4 h-4 text-[#dc2626]" />
            </div>
            <h2 className="text-base font-bold text-[#141414] dark:text-white">
              Pipeline Statuses & WhatsApp Prefills ({statuses.length})
            </h2>
          </div>
          {!isAdmin && (
            <span className="text-xs text-gray-400">
              (Admin permissions needed to edit statuses)
            </span>
          )}
        </div>

        {loading ? (
          <TableLoadingSkeleton rows={5} cols={5} />
        ) : statuses.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-gray-500">No statuses found in the system.</p>
            {isAdmin && (
              <Button size="sm" onClick={() => handleSeed(false)} disabled={seeding} className="bg-[#141414] hover:bg-black text-white rounded-xl shadow-xs">
                <Sparkles className="w-4 h-4 mr-1.5" />
                Initialize Default 10 Statuses
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Stage Name</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead>WhatsApp Prefill Message</TableHead>
                <TableHead>Order</TableHead>
                {isAdmin && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {statuses.map((s, idx) => (
                <TableRow key={s._id} className="hover:bg-gray-50/80">
                  <TableCell className="font-semibold text-gray-900">
                    {s.name}
                  </TableCell>
                  <TableCell>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${s.color}18`,
                        color: s.color,
                        border: `1px solid ${s.color}35`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mr-1.5"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[320px]">
                    {s.whatsappMessage ? (
                      <div className="flex items-start gap-1.5 text-xs text-gray-600">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed font-sans" title={s.whatsappMessage}>
                          {s.whatsappMessage}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Default intro</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{s.order ?? idx + 1}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(s)}
                          className="h-8 w-8 text-gray-400 hover:text-[#dc2626] rounded-xl"
                          title="Edit status & WhatsApp template"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingStatus(s)}
                          className="h-8 w-8 text-gray-400 hover:text-red-600"
                          title="Delete status"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Requirements & Services Management */}
      <div className="bg-white dark:bg-[#14171d] rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#dc2626]" />
              <span>Client Requirements & Services ({requirements.length})</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
              Options shown in the Add Client requirements dropdown and client profile.
            </p>
          </div>

          {/* Add Requirement Form */}
          <form onSubmit={handleAddRequirement} className="flex items-center gap-2">
            <Input
              placeholder="e.g. Pre-Wedding Shoot"
              value={newReqInput}
              onChange={(e) => setNewReqInput(e.target.value)}
              className="h-8 text-xs w-48 sm:w-56"
            />
            <Button
              type="submit"
              size="sm"
              disabled={reqSubmitting || !newReqInput.trim()}
              className="h-8 text-xs bg-[#141414] hover:bg-black dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white gap-1 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </Button>
          </form>
        </div>

        {/* Requirements Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {requirements.map((req) => (
            <div
              key={req._id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-neutral-800/80 border border-gray-200/80 dark:border-neutral-700 text-xs font-medium text-gray-800 dark:text-neutral-200 shadow-2xs group"
            >
              <span>{req.name}</span>
              {!req.isDefault && (
                <button
                  type="button"
                  onClick={() => handleDeleteRequirement(req._id)}
                  className="opacity-40 group-hover:opacity-100 hover:text-red-600 transition-opacity p-0.5"
                  title="Remove requirement option"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* System info */}
      <div className="bg-white dark:bg-[#14171d] p-6 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#dc2626]" />
          <h3 className="text-sm font-bold text-[#141414] dark:text-white">System Environment & WhatsApp Settings</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
          When team members click the WhatsApp button on a client card or table, the message is automatically tailored to the client&apos;s current status using your custom template with dynamic placeholders for client name and shoot date.
        </p>
      </div>

      {/* Appearance & Theme Setting */}
      <div className="bg-white dark:bg-[#14171d] p-6 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-[#141414] dark:text-white">Appearance & Color Mode</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 leading-relaxed">
            Choose your preferred interface theme. You can switch between Light, Dark, or sync with your system preference.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
              activeTheme === 'light'
                ? 'border-[#dc2626] ring-2 ring-red-400/40 bg-red-50/20 dark:bg-red-950/20 shadow-xs'
                : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 hover:bg-gray-50/60 dark:hover:bg-neutral-800/60'
            }`}
          >
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gray-900 dark:text-white">Light Mode</span>
                {activeTheme === 'light' && <Check className="w-3.5 h-3.5 text-[#dc2626]" />}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-neutral-400 mt-0.5">Clean high-contrast daytime interface</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
              activeTheme === 'dark'
                ? 'border-[#dc2626] ring-2 ring-red-400/40 bg-red-50/20 dark:bg-red-950/20 shadow-xs'
                : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 hover:bg-gray-50/60 dark:hover:bg-neutral-800/60'
            }`}
          >
            <div className="p-2 rounded-xl bg-neutral-800 text-amber-400 shrink-0">
              <Moon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gray-900 dark:text-white">Dark Mode</span>
                {activeTheme === 'dark' && <Check className="w-3.5 h-3.5 text-[#dc2626]" />}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-neutral-400 mt-0.5">Sleek carbon studio palette for low light</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
              activeTheme === 'system'
                ? 'border-[#dc2626] ring-2 ring-red-400/40 bg-red-50/20 dark:bg-red-950/20 shadow-xs'
                : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 hover:bg-gray-50/60 dark:hover:bg-neutral-800/60'
            }`}
          >
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gray-900 dark:text-white">System Sync</span>
                {activeTheme === 'system' && <Check className="w-3.5 h-3.5 text-[#dc2626]" />}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-neutral-400 mt-0.5">Automatically follows your device OS settings</p>
            </div>
          </button>
        </div>
      </div>

      {/* Studio AI Assistant Configuration */}
      <div className="bg-white dark:bg-[#14171d] p-6 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-[#141414] dark:text-white">Studio AI Agent (Google Gemini)</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Power your in-app Studio Copilot with Google Gemini 2.0 Flash. The free tier gives you up to 15 requests/minute without a credit card.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-assistant'))}
              className="border-emerald-300 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold rounded-xl px-4 py-2"
            >
              Open AI Chat
            </Button>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#141414] hover:bg-black dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white rounded-xl shadow-xs px-4 py-2 text-xs font-semibold shrink-0"
            >
              <span>Get Free Key</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end pt-1">
          <div className="flex-1 w-full space-y-1.5">
            <Label htmlFor="geminiApiKey" className="text-xs font-semibold text-gray-700 dark:text-neutral-300">
              Gemini API Key (stored safely in your browser)
            </Label>
            <Input
              id="geminiApiKey"
              type="password"
              placeholder="Paste AI Studio API key (AIzaSy...)"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="h-9 text-xs font-mono"
            />
          </div>
          <Button
            type="button"
            onClick={() => {
              const trimmed = geminiKey.trim();
              if (trimmed) {
                localStorage.setItem('reelman_gemini_api_key', trimmed);
                toast.success('Gemini API key saved successfully!');
              } else {
                localStorage.removeItem('reelman_gemini_api_key');
                toast.info('Gemini API key cleared.');
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs px-4 h-9 font-semibold"
          >
            Save Key
          </Button>
        </div>
      </div>

      {/* Database Backup & Export */}
      <div className="bg-white dark:bg-[#14171d] p-6 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-[#141414] dark:text-white">Database Backup & Disaster Recovery</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Export an instant, complete snapshot of all studio data (clients, packages, statuses, activities, notes, and requirements) in JSON format.
            </p>
          </div>

          <Button
            onClick={handleDownloadBackup}
            disabled={downloadingBackup || user?.role !== 'admin'}
            className="flex items-center gap-2 bg-[#141414] hover:bg-black text-white rounded-xl shadow-xs px-4 py-2 text-xs font-semibold shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{downloadingBackup ? 'Generating Backup...' : 'Download Backup (.json)'}</span>
          </Button>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70 text-xs text-gray-600 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-gray-800">
            <Calendar className="w-3.5 h-3.5 text-[#dc2626]" />
            <span>Scheduled Monthly Backups</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            • <strong>Automated Cloud Backups</strong>: Configured continuously inside MongoDB Atlas (automated snapshots retention).<br />
            • <strong>CLI Command</strong>: Run <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-900 font-mono">npm run backup</code> on your server or set a monthly cron job to save backups into the <code className="font-mono">/backups</code> directory.<br />
            • <strong>1-Click Backup</strong>: Use the download button above anytime to keep an offline copy on your computer or phone.
          </p>
        </div>
      </div>

      {/* Add/Edit Status Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md p-6">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900">
                {editingStatus ? `Edit Status: ${editingStatus.name}` : 'New Pipeline Status'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Customize the status name, color badge, and its automatic WhatsApp prefill message.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="statusName" className="text-xs font-semibold text-gray-700">Status Name</Label>
                <Input
                  id="statusName"
                  placeholder="e.g. Contract Sent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Badge Color</Label>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                        color.toLowerCase() === c.toLowerCase()
                          ? 'scale-110 ring-2 ring-offset-2 ring-[#dc2626]'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color.toLowerCase() === c.toLowerCase() && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp Prefill Message */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="whatsappMessage" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Prefill WhatsApp Message
                  </Label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">Insert:</span>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable('{name}')}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono"
                      title="Insert Client Name"
                    >
                      {'{name}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable('{date}')}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono"
                      title="Insert Event Date"
                    >
                      {'{date}'}
                    </button>
                  </div>
                </div>

                <Textarea
                  id="whatsappMessage"
                  rows={4}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  placeholder="e.g. Hello {name}! 👋 Thank you for choosing Reelman Production for {date}..."
                  className="text-xs sm:text-sm font-sans resize-none leading-relaxed focus-visible:ring-[#dc2626]"
                />
                <p className="text-[10px] text-gray-400">
                  When clicking WhatsApp for a client in this status, this message will open pre-filled.
                </p>

                {whatsappMessage && (
                  <div className="mt-2 p-2.5 bg-gray-50 rounded-xl border border-gray-150 text-xs text-gray-700">
                    <span className="text-[10px] font-semibold text-emerald-700 block mb-1">
                      Live Preview (sample client):
                    </span>
                    <p className="whitespace-pre-line leading-relaxed text-gray-800 text-[11px]">
                      {formatStatusWhatsAppMessage(whatsappMessage, 'Rahul Sharma', '15 Dec 2026', name || 'Status')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#141414] hover:bg-black text-white rounded-xl shadow-xs"
              >
                {submitting ? 'Saving...' : editingStatus ? 'Update Status' : 'Create Status'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deletingStatus}
        onOpenChange={(open) => {
          if (!open) setDeletingStatus(null);
        }}
        title="Delete Status"
        description={`Are you sure you want to delete status "${deletingStatus?.name}"? You can only delete statuses that have 0 active clients.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
