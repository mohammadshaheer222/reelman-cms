'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageSquare,
  History,
  Archive,
  Trash2,
  Send,
  Edit2,
  Check,
  X,
  Sparkles,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { Client, Status, Activity } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { NoteItem } from '@/components/clients/NoteItem';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate, formatDateTime, timeAgo } from '@/lib/utils';
import { openWhatsApp } from '@/lib/whatsapp';
import { toast } from 'sonner';

export default function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Edit name state
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Edit phone state
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');

  // Delete modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch client details
  const fetchClientData = async () => {
    try {
      const [clientRes, statusesRes, actRes] = await Promise.all([
        fetch(`/api/clients/${id}`),
        fetch('/api/statuses'),
        fetch(`/api/activity?clientId=${id}`),
      ]);

      if (!clientRes.ok) {
        throw new Error('Client not found');
      }

      const clientData = await clientRes.json();
      const statusData = await statusesRes.json();

      setClient(clientData.data);
      setNameInput(clientData.data.name || '');
      setPhoneInput(clientData.data.phone || '');
      setStatuses(statusData.data || []);

      if (actRes.ok) {
        const ad = await actRes.json();
        setActivities(ad.data || []);
      }
    } catch {
      toast.error('Failed to load client profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const handleStatusChange = async (newStatusId: string) => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: newStatusId }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success('Status updated');
      fetchClientData();
    } catch {
      toast.error('Could not update status');
    }
  };

  const handleSaveName = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update name');
      toast.success('Name updated');
      setEditingName(false);
      fetchClientData();
    } catch {
      toast.error('Could not update name');
    }
  };

  const handleSavePhone = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update phone');
      toast.success('Phone number updated');
      setEditingPhone(false);
      fetchClientData();
    } catch {
      toast.error('Could not update phone number');
    }
  };

  const handleWhatsApp = () => {
    if (!client?.phone) {
      toast.error('No phone number saved. Please add a phone number first.');
      return;
    }
    openWhatsApp(client.phone, client.name);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/clients/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      });
      if (!res.ok) throw new Error('Failed to add note');
      toast.success('Note added');
      setNewNote('');
      fetchClientData();
    } catch {
      toast.error('Could not add note');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/clients/${id}/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete note');
      toast.success('Note deleted');
      fetchClientData();
    } catch {
      toast.error('Could not delete note');
    }
  };

  const handleToggleArchive = async () => {
    if (!client) return;
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !client.isArchived }),
      });
      if (!res.ok) throw new Error('Failed to toggle archive');
      toast.success(client.isArchived ? 'Client restored' : 'Client archived');
      fetchClientData();
    } catch {
      toast.error('Could not update archive status');
    }
  };

  const handleDeleteClient = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete client');
      toast.success('Client deleted');
      router.push('/clients');
    } catch {
      toast.error('Could not delete client');
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">
        Loading client profile...
      </div>
    );
  }

  if (!client) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-lg font-semibold text-gray-900">Client not found</h2>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/clients">Return to Clients</Link>
        </Button>
      </div>
    );
  }

  const currentStatusId =
    typeof client.status === 'object' ? client.status._id : client.status;

  return (
    <div className="space-y-6">
      {/* Back button & top bar */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-gray-600">
          <Link href="/clients" className="flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsApp}
            className="text-green-700 bg-green-50 border-green-200 hover:bg-green-100"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
            WhatsApp
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100"
          >
            <Link href="/packages">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Package / Proposal PDF
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleArchive}
            className="text-gray-600"
          >
            <Archive className="w-3.5 h-3.5 mr-1.5" />
            {client.isArchived ? 'Restore' : 'Archive'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Client Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="h-8 text-lg font-bold"
                    placeholder="Client Name"
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveName}>
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingName(false);
                      setNameInput(client.name || '');
                    }}
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    {client.name || 'Unnamed Client'}
                  </h1>
                  <button
                    onClick={() => setEditingName(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    title="Edit Name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {client.isArchived && (
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                  Archived
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono">
              ID: {client.clientId} • Created {formatDate(client.createdAt)}
            </p>

            {/* Phone / WhatsApp */}
            {editingPhone ? (
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <Input
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="h-7 text-sm w-44"
                  placeholder="+91 98765 43210"
                  type="tel"
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSavePhone}>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => { setEditingPhone(false); setPhoneInput(client.phone || ''); }}
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-600">
                  {client.phone || <span className="text-gray-400 italic text-xs">No phone number — click to add</span>}
                </span>
                <button
                  onClick={() => setEditingPhone(true)}
                  className="p-0.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Edit Phone Number"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Current Status:</span>
            <Select value={currentStatusId} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px] h-9 bg-gray-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span>{s.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notes" className="space-y-4">
        <TabsList className="bg-white border border-gray-100 p-1 rounded-xl shadow-sm">
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Notes & Requirements ({client.notes?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Status History & Logs
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Notes */}
        <TabsContent value="notes" className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Add Note</h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <Textarea
                placeholder="Log discussion points, preferences, follow-up updates, requirements..."
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={submittingNote || !newNote.trim()}>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {submittingNote ? 'Saving...' : 'Post Note'}
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Notes Timeline</h3>
            {(!client.notes || client.notes.length === 0) ? (
              <p className="text-sm text-gray-400 py-4 text-center">No notes recorded yet.</p>
            ) : (
              <div className="space-y-3 pt-1">
                {client.notes
                  .slice()
                  .reverse()
                  .map((note) => (
                    <NoteItem
                      key={note._id}
                      note={note}
                      currentUser={user}
                      onDelete={handleDeleteNote}
                    />
                  ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Activity & Status History */}
        <TabsContent value="activity" className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Status History</h3>
            {(!client.statusHistory || client.statusHistory.length === 0) ? (
              <p className="text-sm text-gray-400 py-3">No status changes recorded yet.</p>
            ) : (
              <div className="relative pl-6 space-y-4 border-l-2 border-gray-100">
                {client.statusHistory
                  .slice()
                  .reverse()
                  .map((sh, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-100" />
                      <p className="text-sm font-medium text-gray-900">
                        Status changed to{' '}
                        <span className="font-semibold text-blue-600">{sh.statusName}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDateTime(sh.changedAt)} ({timeAgo(sh.changedAt)})
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Client Activity Log</h3>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 py-3">No activity logged.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {activities.map((act) => (
                  <div key={act._id} className="py-3 flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-800 font-medium">{act.description}</p>
                      <span className="text-xs text-gray-400 capitalize">{act.action}</span>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {timeAgo(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Client"
        description="Are you sure you want to delete this client? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleDeleteClient}
      />
    </div>
  );
}
