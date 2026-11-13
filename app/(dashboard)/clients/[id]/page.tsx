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
  Share2,
  ExternalLink,
  Receipt,
  Clock,
} from 'lucide-react';
import { Client, Status, Activity, DeliverableMilestone, PaymentInstallment } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { NoteItem } from '@/components/clients/NoteItem';
import { DeliverableTracker } from '@/components/clients/DeliverableTracker';
import { PaymentInstallmentsCard } from '@/components/clients/PaymentInstallmentsCard';
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
import { openWhatsApp, formatBookingSummaryWhatsAppMessage } from '@/lib/whatsapp';
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

  // Handle 1-Click WhatsApp Booking Summary
  const handleSendBookingSummary = () => {
    if (!client?.phone) {
      toast.error('No phone number saved for this client.');
      return;
    }
    const portalUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/portal/${client._id}`
        : undefined;

    const message = formatBookingSummaryWhatsAppMessage({
      name: client.name,
      date: client.date,
      workPrice: client.workPrice,
      advancePaid: client.advancePaid,
      portalUrl,
    });

    openWhatsApp(client.phone, client.name, message);
  };

  // Copy Client Portal Link to clipboard
  const handleCopyPortalLink = () => {
    if (typeof window !== 'undefined' && client) {
      const url = `${window.location.origin}/portal/${client._id}`;
      navigator.clipboard.writeText(url);
      toast.success('Client Portal link copied to clipboard!', {
        icon: <Check className="w-4 h-4 text-[#2C8567]" />,
      });
    }
  };

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
    <div className="space-y-4 sm:space-y-6">
      {/* Back button & top bar (Mobile-First Responsive Layout) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/clients');
              }
            }}
            className="-ml-2 text-gray-600 h-8 px-2 text-xs flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Button>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* WhatsApp Quick Chat */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsApp}
              className="text-emerald-800 bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100 text-xs h-8 px-2.5 gap-1 shadow-2xs"
              title="Open WhatsApp chat with client"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#2C8567]" />
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="sm:hidden">Chat</span>
            </Button>

            {/* Portal Link with direct view */}
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-xs bg-white shadow-2xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPortalLink}
                className="h-8 px-2 text-xs text-gray-700 hover:bg-gray-50 border-r border-gray-200 gap-1 rounded-none"
                title="Copy Client Portal Link to clipboard"
              >
                <Share2 className="w-3 h-3 text-blue-600" />
                <span className="hidden sm:inline">Portal</span>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-gray-600 hover:bg-gray-50 rounded-none"
                title="Open Client Portal in new tab"
              >
                <a href={`/portal/${client._id}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </div>

            {/* Proposal PDF */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-purple-700 bg-purple-50/70 border-purple-200 hover:bg-purple-100 text-xs h-8 px-2 hidden sm:inline-flex"
            >
              <Link href="/packages">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>Proposal</span>
              </Link>
            </Button>

            {/* Archive */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleArchive}
              className="text-gray-600 text-xs h-8 px-2 hidden sm:inline-flex"
              title={client.isArchived ? 'Restore' : 'Archive'}
            >
              <Archive className="w-3.5 h-3.5" />
            </Button>

            {/* Delete */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs h-8 px-2"
              title="Delete client"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Full-width on mobile: Prominent WhatsApp Booking Summary Trigger */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSendBookingSummary}
            className="w-full sm:w-auto text-white bg-[#2C8567] hover:bg-[#236d54] font-semibold text-xs h-9 gap-1.5 shadow-xs"
            title="Send WhatsApp booking confirmation with deliverables and payment link"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send WhatsApp Booking Summary</span>
          </Button>

          {/* Proposal shortcut visible on mobile */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="sm:hidden text-purple-700 bg-purple-50/70 border-purple-200 text-xs h-9 px-3 shrink-0"
            title="Proposal PDF"
          >
            <Link href="/packages">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>PDF</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Client Header Card (Clean, Spacious, Uncluttered Studio Overview) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        {/* Top: Client Name, ID, and Pipeline Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="h-8 text-base sm:text-lg font-bold"
                    placeholder="Client Name"
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSaveName}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-gray-400"
                    onClick={() => {
                      setEditingName(false);
                      setNameInput(client.name || '');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
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

              {typeof client.status === 'object' && client.status && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 shadow-2xs"
                  style={{
                    backgroundColor: `${client.status.color}15`,
                    color: client.status.color,
                    borderColor: `${client.status.color}35`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: client.status.color }}
                  />
                  {client.status.name}
                </span>
              )}

              {client.isArchived && (
                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-medium">
                  Archived
                </span>
              )}
            </div>

            <p className="text-xs text-gray-400 font-mono">
              ID: {client.clientId} • Added {formatDate(client.createdAt)}
            </p>
          </div>

          {/* Stage Dropdown & Move to New */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {typeof client.status === 'object' && client.status.name.toLowerCase() !== 'new' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMoveToNew}
                className="text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300 gap-1 h-8 text-xs font-semibold"
                title="Move client back to New column"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Move to New</span>
              </Button>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium">Stage:</span>
              <Select value={currentStatusId} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px] sm:w-[160px] h-8 bg-gray-50 font-medium text-xs">
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

        {/* 4 Clean Metric Cards (2x2 on Mobile, 4-col on Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Event Date & Location */}
          <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100/90 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#2C8567]" />
                <span>Shoot Date</span>
              </span>
              <button
                type="button"
                onClick={() => setEditingDate(true)}
                className="text-gray-400 hover:text-gray-700 p-0.5"
                title="Edit date"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>

            {editingDate ? (
              <div className="flex items-center gap-1 pt-1">
                <Input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="h-7 text-xs flex-1 bg-white"
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={handleSaveDate}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-gray-400"
                  onClick={() => { setEditingDate(false); setDateInput(client.date || ''); }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {client.date ? formatDate(client.date) : <span className="text-gray-400 italic font-normal">Not set</span>}
                </p>
                {client.location && (
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{client.location}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Contact Phone & WhatsApp */}
          <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100/90 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3 h-3 text-blue-600" />
                <span>Contact Phone</span>
              </span>
              <button
                type="button"
                onClick={() => setEditingPhone(true)}
                className="text-gray-400 hover:text-gray-700 p-0.5"
                title="Edit phone"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>

            {editingPhone ? (
              <div className="flex items-center gap-1 pt-1">
                <Input
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="h-7 text-xs flex-1 bg-white"
                  placeholder="+91..."
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={handleSavePhone}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-gray-400"
                  onClick={() => { setEditingPhone(false); setPhoneInput(client.phone || ''); }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-1 pt-0.5">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {client.phone || <span className="text-gray-400 italic font-normal text-xs">No phone</span>}
                </p>
                {client.phone && (
                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="p-1 rounded-md text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200 transition-colors shrink-0"
                    title="Chat on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#2C8567]" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Card 3: Confirmed Work Price */}
          <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100/90 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-[#2C8567]" />
                <span>Confirmed Price</span>
              </span>
              <button
                type="button"
                onClick={() => setEditingPrice(true)}
                className="text-gray-400 hover:text-gray-700 p-0.5"
                title="Edit price & advance"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>

            {editingPrice ? (
              <div className="flex items-center gap-1 pt-1">
                <Input
                  type="number"
                  placeholder="Price"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="h-7 text-xs w-20 font-mono font-bold bg-white"
                />
                <Input
                  type="number"
                  placeholder="Adv"
                  value={advanceInput}
                  onChange={(e) => setAdvanceInput(e.target.value)}
                  className="h-7 text-xs w-16 font-mono bg-white"
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={handleSavePrice}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-gray-400"
                  onClick={() => setEditingPrice(false)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-lg font-bold font-mono text-gray-900 leading-tight">
                  {client.workPrice ? `₹${client.workPrice.toLocaleString('en-IN')}` : '₹0'}
                </p>
                <p className="text-[11px] text-gray-500">Agreed Shoot Package</p>
              </div>
            )}
          </div>

          {/* Card 4: Advance & Balance Status */}
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                Advance & Balance
              </span>
              {client.paymentStatus === 'fully-paid' ? (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                  Paid in Full ✅
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded">
                  Due ⏳
                </span>
              )}
            </div>

            <div>
              <p className="text-sm font-bold font-mono text-emerald-950">
                Adv: ₹{(client.advancePaid || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-amber-900 font-mono font-semibold">
                Balance: ₹{Math.max(0, (client.workPrice || 0) - (client.advancePaid || 0)).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Requirements Pills */}
        {client.requirements && client.requirements.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-semibold text-gray-500 mr-0.5">Requirements:</span>
            {client.requirements.map((req, i) => (
              <span
                key={i}
                className="text-[11px] font-medium text-[#2C8567] bg-[#2C8567]/8 border border-[#2C8567]/20 px-2 py-0.5 rounded-md"
              >
                {req}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs (Mobile-Friendly Horizontal Swipeable Bar) */}
      <Tabs defaultValue="deliverables" className="space-y-4">
        <TabsList className="bg-white border border-gray-100 p-1 rounded-xl shadow-xs flex items-center overflow-x-auto max-w-full modal-scroll scrollbar-none gap-1 justify-start">
          <TabsTrigger value="deliverables" className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span className="sm:hidden">Milestones</span>
            <span className="hidden sm:inline">Post-Production Milestones</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0">
            <IndianRupee className="w-3.5 h-3.5 text-[#2C8567]" />
            <span className="sm:hidden">Payments</span>
            <span className="hidden sm:inline">Payment Installments</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Notes ({client.notes?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="package" className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0">
            <Package className="w-3.5 h-3.5 text-amber-600" />
            <span className="sm:hidden">Package</span>
            <span className="hidden sm:inline">Package Scope {client.packageDetails ? '✓' : ''}</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0">
            <History className="w-3.5 h-3.5 text-gray-500" />
            <span className="sm:hidden">History</span>
            <span className="hidden sm:inline">Audit History</span>
          </TabsTrigger>
        </TabsList>

        {/* Feature 1: Post-Production Deliverables Pipeline */}
        <TabsContent value="deliverables" className="space-y-4">
          <DeliverableTracker
            client={client}
            onUpdate={async (updatedDeliverables) => {
              const res = await fetch(`/api/clients/${client._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deliverables: updatedDeliverables }),
              });
              if (!res.ok) throw new Error('Update failed');
              const json = await res.json();
              setClient(json.data);
            }}
          />
        </TabsContent>

        {/* Feature 3: Payment Installment Schedule */}
        <TabsContent value="payments" className="space-y-4">
          <PaymentInstallmentsCard
            client={client}
            onUpdate={async (updatedInstallments) => {
              const res = await fetch(`/api/clients/${client._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ installments: updatedInstallments }),
              });
              if (!res.ok) throw new Error('Update failed');
              const json = await res.json();
              setClient(json.data);
            }}
          />
        </TabsContent>

        {/* Tab 1: Notes */}
        <TabsContent value="notes" className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm space-y-4">
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

          <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm space-y-3">
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
          <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm space-y-4">
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
