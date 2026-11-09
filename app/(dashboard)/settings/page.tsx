'use client';
import { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Sparkles,
  Edit2,
  Trash2,
  Check,
  Palette,
  Shield,
  Layers,
  Info,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Status } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const PRESET_COLORS = [
  '#6366f1', // Purple
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f97316', // Orange
  '#ef4444', // Red
  '#6b7280', // Gray
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Form Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [submitting, setSubmitting] = useState(false);

  // Delete status
  const [deletingStatus, setDeletingStatus] = useState<Status | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [seeding, setSeeding] = useState(false);

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

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleOpenAdd = () => {
    setEditingStatus(null);
    setName('');
    setColor('#6366f1');
    setModalOpen(true);
  };

  const handleOpenEdit = (s: Status) => {
    setEditingStatus(s);
    setName(s.name);
    setColor(s.color);
    setModalOpen(true);
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
        body: JSON.stringify({ name: name.trim(), color }),
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

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed');
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || '10 default statuses seeded successfully');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure client workflow stages, colors, and system parameters.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seeding}
              className="text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              {seeding ? 'Seeding...' : 'Seed Default 10'}
            </Button>
            <Button size="sm" onClick={handleOpenAdd} className="flex items-center gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />
              New Status
            </Button>
          </div>
        )}
      </div>

      {/* Statuses List Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Client Pipeline Statuses ({statuses.length})
            </h2>
          </div>
          {!isAdmin && (
            <span className="text-xs text-gray-400">
              (Admin permissions needed to edit statuses)
            </span>
          )}
        </div>

        {loading ? (
          <TableLoadingSkeleton rows={5} cols={4} />
        ) : statuses.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-gray-500">No statuses found in the system.</p>
            {isAdmin && (
              <Button size="sm" onClick={handleSeed} disabled={seeding}>
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
                <TableHead>Preview Badge</TableHead>
                <TableHead>Color Code</TableHead>
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
                  <TableCell className="font-mono text-xs text-gray-500">
                    {s.color}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{s.order ?? idx + 1}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(s)}
                          className="h-8 w-8 text-gray-400 hover:text-gray-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingStatus(s)}
                          className="h-8 w-8 text-gray-400 hover:text-red-600"
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

      {/* System info */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">System Environment</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-gray-600">
          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="font-semibold text-gray-900 block mb-0.5">Framework</span>
            Next.js 14 / App Router + TypeScript
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="font-semibold text-gray-900 block mb-0.5">Database</span>
            MongoDB + Mongoose ODM
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="font-semibold text-gray-900 block mb-0.5">Current User</span>
            {user?.name} ({user?.role})
          </div>
        </div>
      </div>

      {/* Add/Edit Status Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingStatus ? 'Edit Status' : 'New Status'}</DialogTitle>
              <DialogDescription>
                Define a client pipeline stage and custom color code.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="statusName">Status Label</Label>
                <Input
                  id="statusName"
                  placeholder="e.g. In Negotiation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Choose Color</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        color.toLowerCase() === c.toLowerCase()
                          ? 'scale-110 ring-2 ring-offset-2 ring-blue-500'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color.toLowerCase() === c.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#6366f1"
                    className="font-mono text-xs h-8"
                  />
                  <div
                    className="w-8 h-8 rounded-lg border border-gray-200 shrink-0"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editingStatus ? 'Update' : 'Create Status'}
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
