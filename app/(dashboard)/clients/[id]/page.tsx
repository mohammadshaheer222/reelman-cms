'use client';
import { useState, useEffect, use, useRef } from 'react';
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
  Calendar,
  IndianRupee,
  RotateCcw,
  MapPin,
  Upload,
  Loader2,
  Package,
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
import { WhatsAppModal } from '@/components/clients/WhatsAppModal';
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

  // Edit date state
  const [editingDate, setEditingDate] = useState(false);
  const [dateInput, setDateInput] = useState('');

  // Edit price state
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [advanceInput, setAdvanceInput] = useState('');

  // Package details state
  const [editingPackage, setEditingPackage] = useState(false);
  const [packageInput, setPackageInput] = useState('');
  const [savingPackage, setSavingPackage] = useState(false);
  const [extractingPdfClient, setExtractingPdfClient] = useState(false);
  const clientPdfInputRef = useRef<HTMLInputElement>(null);

  // Delete modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // WhatsApp modal
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

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
      setDateInput(clientData.data.date || '');
      setPriceInput(String(clientData.data.workPrice || 0));
      setAdvanceInput(String(clientData.data.advancePaid || 0));
      setPackageInput(clientData.data.packageDetails || '');
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

  const handleSaveDate = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateInput.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update date');
      toast.success('Event date updated');
      setEditingDate(false);
      fetchClientData();
    } catch {
      toast.error('Could not update event date');
    }
  };

  const handleSavePrice = async () => {
    const p = parseFloat(priceInput) || 0;
    const a = parseFloat(advanceInput) || 0;
    let st = 'unpaid';
    if (a > 0 && p > 0 && a >= p) st = 'fully-paid';
    else if (a > 0) st = 'advance-received';
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workPrice: p, advancePaid: a, paymentStatus: st }),
      });
      if (!res.ok) throw new Error('Failed to update price');
      toast.success('Confirmed work price & payment updated');
      setEditingPrice(false);
      fetchClientData();
    } catch {
      toast.error('Could not update price');
    }
  };

  const handleSavePackage = async () => {
    setSavingPackage(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageDetails: packageInput.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update package details');
      toast.success('Package details updated');
      setEditingPackage(false);
      fetchClientData();
    } catch {
      toast.error('Could not update package details');
    } finally {
      setSavingPackage(false);
    }
  };

  const handleClientPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a valid PDF file');
      return;
    }

    setExtractingPdfClient(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/pdf-extract', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract text from PDF');
      }

      const extracted = data.text;
      setPackageInput((prev) => (prev ? `${prev}\n\n${extracted}` : extracted));
      setEditingPackage(true);
      toast.success(`Converted ${file.name} to package text`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error extracting PDF';
      toast.error(msg);
    } finally {
      setExtractingPdfClient(false);
      if (clientPdfInputRef.current) clientPdfInputRef.current.value = '';
    }
  };

  const handleMoveToNew = async () => {
    const newStatus =
      statuses.find((s) => s.name.toLowerCase() === 'new') ||
      statuses.find((s) => s.isDefault) ||
      statuses[0];
    if (!newStatus) return;
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: newStatus._id }),
      });
      if (!res.ok) throw new Error('Failed to move to New');
      toast.success('Moved to New status');
      fetchClientData();
    } catch {
      toast.error('Could not move to New');
    }
  };

  const handleWhatsApp = () => {
    if (!client?.phone) {
      toast.error('No phone number saved. Please add a phone number first.');
      return;
    }
    setWhatsAppModalOpen(true);
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

            {/* Event / Shoot Date */}
            {editingDate ? (
              <div className="flex items-center gap-2 mt-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <Input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="h-7 text-xs w-44"
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveDate}>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => { setEditingDate(false); setDateInput(client.date || ''); }}
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-600">
                  {client.date ? (
                    <span>Event Date: <span className="font-medium text-gray-800">{formatDate(client.date)}</span></span>
                  ) : (
                    <span className="text-gray-400 italic text-xs">No event date — click to set</span>
                  )}
                </span>
                {client.dates && client.dates.length > 1 && (
                  <span className="text-xs font-semibold text-[#2C8567] bg-[#2C8567]/10 px-2 py-0.5 rounded">
                    {client.dates.length} Days Shoot
                  </span>
                )}
                <button
                  onClick={() => setEditingDate(true)}
                  className="p-0.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Edit Event Date"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Location */}
            {client.location && (
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Shoot Location: <span className="font-medium text-gray-800">{client.location}</span></span>
              </div>
            )}

            {/* Requirements */}
            {client.requirements && client.requirements.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-xs font-medium text-gray-500 mr-1">Requirements:</span>
                {client.requirements.map((req, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium text-[#2C8567] bg-[#2C8567]/8 border border-[#2C8567]/20 px-2 py-0.5 rounded-md"
                  >
                    {req}
                  </span>
                ))}
              </div>
            )}

            {/* Confirmed Work Price & Payment */}
            {editingPrice ? (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <Input
                  type="number"
                  placeholder="Work Price (₹)"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="h-7 text-xs w-32 font-semibold"
                />
                <Input
                  type="number"
                  placeholder="Advance Paid (₹)"
                  value={advanceInput}
                  onChange={(e) => setAdvanceInput(e.target.value)}
                  className="h-7 text-xs w-32 font-semibold"
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSavePrice}>
                  <Check className="w-3.5 h-3.5 text-green-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditingPrice(false);
                    setPriceInput(String(client.workPrice || 0));
                    setAdvanceInput(String(client.advancePaid || 0));
                  }}
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="text-sm text-gray-700">
                  Confirmed Work Price:{' '}
                  <span className="font-bold text-gray-900 font-mono">
                    {client.workPrice ? `₹${client.workPrice.toLocaleString('en-IN')}` : '₹0'}
                  </span>
                  {client.advancePaid ? (
                    <span className="ml-2 text-xs text-blue-700 font-semibold font-mono">
                      (Adv Paid: ₹{client.advancePaid.toLocaleString('en-IN')})
                    </span>
                  ) : null}
                  {client.paymentStatus === 'fully-paid' && (
                    <span className="ml-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Paid in Full ✅
                    </span>
                  )}
                </span>
                <button
                  onClick={() => setEditingPrice(true)}
                  className="p-0.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  title="Edit Work Price & Payment"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Status selector & Move to New button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
            {typeof client.status === 'object' && client.status.name.toLowerCase() !== 'new' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMoveToNew}
                className="text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300 gap-1 h-9 text-xs font-semibold"
                title="Move client back to New column"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Move to New</span>
              </Button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Status:</span>
              <Select value={currentStatusId} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[170px] h-9 bg-gray-50 font-medium">
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notes" className="space-y-4">
        <TabsList className="bg-white border border-gray-100 p-1 rounded-xl shadow-sm">
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Notes & Requirements ({client.notes?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="package" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Package Deliverables {client.packageDetails ? '✓' : ''}
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

        {/* Tab 2: Package Deliverables & PDF Conversion */}
        <TabsContent value="package" className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#2C8567]" />
                  <span>Package Deliverables & Inclusions</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Package scope, hours of coverage, deliverables (converted from PDF or edited).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={clientPdfInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleClientPdfUpload}
                  className="hidden"
                  id="clientPdfInput"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={extractingPdfClient}
                  onClick={() => clientPdfInputRef.current?.click()}
                  className="text-blue-700 bg-blue-50/70 border-blue-200 hover:bg-blue-100 h-8 text-xs gap-1.5"
                >
                  {extractingPdfClient ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Extracting…</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Upload Package PDF</span>
                    </>
                  )}
                </Button>

                {!editingPackage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPackageInput(client.packageDetails || '');
                      setEditingPackage(true);
                    }}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </Button>
                )}
              </div>
            </div>

            {editingPackage ? (
              <div className="space-y-3">
                <Textarea
                  rows={8}
                  value={packageInput}
                  onChange={(e) => setPackageInput(e.target.value)}
                  placeholder="Package deliverables, album size, shoot hours, deliverable timeline..."
                  className="text-xs sm:text-sm font-sans"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={savingPackage}
                    onClick={() => {
                      setEditingPackage(false);
                      setPackageInput(client.packageDetails || '');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingPackage}
                    onClick={handleSavePackage}
                    className="bg-[#2C8567] hover:bg-[#236d54] text-white"
                  >
                    {savingPackage ? 'Saving…' : 'Save Deliverables'}
                  </Button>
                </div>
              </div>
            ) : client.packageDetails ? (
              <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100 text-xs sm:text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                {client.packageDetails}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 space-y-2">
                <Package className="w-8 h-8 mx-auto text-gray-300" />
                <p className="text-xs">No package details recorded yet.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPackage(true)}
                  className="text-xs"
                >
                  + Add Package Details
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Activity & Status History */}
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
                      <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#2C8567] border-2 border-white ring-2 ring-[#2C8567]/20" />
                      <p className="text-sm font-medium text-gray-900">
                        Status changed to{' '}
                        <span className="font-semibold text-[#2C8567]">{sh.statusName}</span>
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

      {/* WhatsApp Modal */}
      {client && (
        <WhatsAppModal
          open={whatsAppModalOpen}
          onOpenChange={setWhatsAppModalOpen}
          client={{
            name: client.name,
            phone: client.phone,
            date: client.date,
            status: client.status,
          }}
        />
      )}

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
