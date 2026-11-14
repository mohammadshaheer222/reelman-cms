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
  Copy,
  Info,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Client, Status, Activity } from '@/types';
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

  // Edit location state
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');

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
  const [portalCopied, setPortalCopied] = useState(false);

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
      setLocationInput(clientData.data.location || '');
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
      toast.success('Pipeline stage updated');
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
      toast.success('Shoot date updated');
      setEditingDate(false);
      fetchClientData();
    } catch {
      toast.error('Could not update shoot date');
    }
  };

  const handleSaveLocation = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: locationInput.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update location');
      toast.success('Shoot location updated');
      setEditingLocation(false);
      fetchClientData();
    } catch {
      toast.error('Could not update shoot location');
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
      toast.success('Confirmed price & advance updated');
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
      toast.success('Package scope updated');
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
      toast.error('Please upload a valid PDF quotation');
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
      toast.success(`Converted ${file.name} to package scope text`);
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
      toast.success('Moved client back to New');
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
      toast.success(client.isArchived ? 'Client restored from archive' : 'Client moved to archive');
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
      setPortalCopied(true);
      toast.success('Client Portal link copied to clipboard!');
      setTimeout(() => setPortalCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#2C8567] mx-auto" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Loading client profile...
        </p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4 px-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
          <Package className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Client not found</h2>
        <p className="text-xs text-gray-500">
          This client record might have been deleted or does not exist in your workspace.
        </p>
        <Button asChild variant="outline" className="mt-2 text-xs">
          <Link href="/clients">Return to Client Directory</Link>
        </Button>
      </div>
    );
  }

  const currentStatusId =
    typeof client.status === 'object' ? client.status._id : client.status;
  const balanceDue = Math.max(0, (client.workPrice || 0) - (client.advancePaid || 0));

  return (
    <div className="w-full max-w-full overflow-x-hidden min-w-0 space-y-4 sm:space-y-6 pb-12">
      {/* 1. Mobile-First Navigation & Quick Actions Topbar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        {/* Row 1: Breadcrumbs & Management Actions (Archive, Delete) */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
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
              className="text-gray-600 hover:text-gray-900 h-8 px-2 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Button>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-bold text-gray-900 truncate">
              {client.name || 'Client'}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleArchive}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer"
              title={client.isArchived ? 'Restore client' : 'Archive client'}
            >
              <Archive className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
              title="Delete client record"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Row 2: Communication Actions (WhatsApp Chat & Proposal PDF) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 pt-1 border-t border-gray-100/80">
          <Button
            variant="outline"
            size="sm"
            onClick={handleWhatsApp}
            className="text-emerald-800 bg-emerald-50/90 border-emerald-200 hover:bg-emerald-100 text-xs h-8.5 px-3 gap-1.5 font-semibold rounded-xl cursor-pointer w-full sm:w-auto"
            title="Open WhatsApp chat with client"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">WhatsApp Chat</span>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-purple-700 bg-purple-50/80 border-purple-200 hover:bg-purple-100 text-xs h-8.5 px-3 gap-1.5 font-semibold rounded-xl cursor-pointer w-full sm:w-auto"
            title="Create or view proposal PDF"
          >
            <Link href="/packages">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">PDF Proposal</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Client Hero Overview Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4 sm:space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          {/* Client Name & Identity */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {editingName ? (
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="h-8 text-base font-bold flex-1 sm:w-64"
                    placeholder="Couple or Client Name"
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 shrink-0" onClick={handleSaveName}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-gray-400 shrink-0"
                    onClick={() => {
                      setEditingName(false);
                      setNameInput(client.name || '');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">
                    {client.name || 'Unnamed Client'}
                  </h1>
                  <button
                    onClick={() => setEditingName(true)}
                    className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                    title="Edit Name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {typeof client.status === 'object' && client.status && (
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1.5 shadow-2xs shrink-0"
                  style={{
                    backgroundColor: `${client.status.color}15`,
                    color: client.status.color,
                    borderColor: `${client.status.color}35`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: client.status.color }}
                  />
                  <span>{client.status.name}</span>
                </span>
              )}

              {client.isArchived && (
                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase shrink-0">
                  Archived
                </span>
              )}
            </div>

            <p className="text-xs text-gray-400 font-mono flex items-center gap-2 flex-wrap">
              <span>ID: <strong className="text-gray-700 font-semibold">{client.clientId}</strong></span>
              <span>•</span>
              <span>Booked {formatDate(client.createdAt)}</span>
            </p>
          </div>

          {/* Pipeline Stage Selector (Mobile Full-Width Responsive) */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap pt-1 md:pt-0">
            {typeof client.status === 'object' && client.status.name.toLowerCase() !== 'new' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMoveToNew}
                className="text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-300 gap-1.5 h-8 text-xs font-semibold rounded-xl shrink-0"
                title="Reset status back to initial inquiry"
              >
                <RotateCcw className="w-3 h-3 text-amber-700" />
                <span>Move to New</span>
              </Button>
            )}

            <div className="flex items-center gap-2 bg-gray-50/80 px-2.5 py-1 rounded-xl border border-gray-200/80 flex-1 sm:flex-initial">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Stage:</span>
              <Select value={currentStatusId} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full sm:w-[150px] h-7 bg-white font-semibold text-xs border-gray-200 shadow-2xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="truncate">{s.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 4 Booking Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Shoot Date & Venue */}
          <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 hover:border-gray-200 transition-colors space-y-1.5 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-[#2C8567] shrink-0" />
                <span className="truncate">Shoot Date & Venue</span>
              </span>
              <button
                type="button"
                onClick={() => setEditingDate(true)}
                className="text-gray-400 hover:text-gray-700 p-0.5 rounded hover:bg-gray-200/60 shrink-0"
                title="Edit shoot date"
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
                  className="h-7 text-xs flex-1 bg-white min-w-0"
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 shrink-0" onClick={handleSaveDate}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-gray-400 shrink-0"
                  onClick={() => { setEditingDate(false); setDateInput(client.date || ''); }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {client.date ? formatDate(client.date) : <span className="text-gray-400 italic font-normal">Date not set</span>}
                </p>
                {editingLocation ? (
                  <div className="flex items-center gap-1 mt-1">
                    <Input
                      placeholder="Venue / City"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      className="h-6 text-xs bg-white min-w-0 flex-1"
                    />
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-600 shrink-0" onClick={handleSaveLocation}>
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-gray-400 shrink-0"
                      onClick={() => { setEditingLocation(false); setLocationInput(client.location || ''); }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-0.5 min-w-0">
                    <span className="truncate flex items-center gap-1 min-w-0">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate">{client.location || 'Location not added'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingLocation(true)}
                      className="text-gray-400 hover:text-gray-600 ml-1 shrink-0"
                      title="Edit location"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Contact Phone & Quick Chat */}
          <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 hover:border-gray-200 transition-colors space-y-1.5 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Contact Phone</span>
              </span>
              <button
                type="button"
                onClick={() => setEditingPhone(true)}
                className="text-gray-400 hover:text-gray-700 p-0.5 rounded hover:bg-gray-200/60 shrink-0"
                title="Edit phone number"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>

            {editingPhone ? (
              <div className="flex items-center gap-1 pt-1">
                <Input
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="h-7 text-xs flex-1 bg-white font-mono min-w-0"
                  placeholder="+91..."
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 shrink-0" onClick={handleSavePhone}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-gray-400 shrink-0"
                  onClick={() => { setEditingPhone(false); setPhoneInput(client.phone || ''); }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-1.5 pt-0.5 min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold font-mono text-gray-900 truncate">
                    {client.phone || <span className="text-gray-400 italic font-normal text-xs font-sans">No phone</span>}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">Primary phone / WhatsApp</p>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`tel:${client.phone}`}
                      className="p-1.5 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                      title="Call client"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={handleWhatsApp}
                      className="p-1.5 rounded-lg text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 transition-colors cursor-pointer"
                      title="Open WhatsApp chat"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 3: Confirmed Work Price */}
          <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 hover:border-gray-200 transition-colors space-y-1.5 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <IndianRupee className="w-3.5 h-3.5 text-gray-800 shrink-0" />
                <span className="truncate">Confirmed Price</span>
              </span>
              <button
                type="button"
                onClick={() => setEditingPrice(true)}
                className="text-gray-400 hover:text-gray-700 p-0.5 rounded hover:bg-gray-200/60 shrink-0"
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
                  className="h-7 text-xs flex-1 font-mono font-bold bg-white min-w-0"
                />
                <Input
                  type="number"
                  placeholder="Adv"
                  value={advanceInput}
                  onChange={(e) => setAdvanceInput(e.target.value)}
                  className="h-7 text-xs flex-1 font-mono bg-white min-w-0"
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 shrink-0" onClick={handleSavePrice}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-gray-400 shrink-0"
                  onClick={() => setEditingPrice(false)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-xl font-bold font-mono text-gray-900 leading-tight">
                  {client.workPrice ? `₹${client.workPrice.toLocaleString('en-IN')}` : '₹0'}
                </p>
                <p className="text-[11px] text-gray-500 truncate">Agreed Shoot Package</p>
              </div>
            )}
          </div>

          {/* Card 4: Advance Paid & Remaining Balance */}
          <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-100 hover:border-emerald-200 transition-colors space-y-1.5 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1 truncate">
                <Receipt className="w-3.5 h-3.5 text-[#2C8567] shrink-0" />
                <span className="truncate">Payment Status</span>
              </span>
              {client.paymentStatus === 'fully-paid' ? (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 shrink-0">
                  Paid in Full ✅
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 shrink-0">
                  Balance Due ⏳
                </span>
              )}
            </div>

            <div>
              <p className="text-sm font-bold font-mono text-emerald-950 truncate">
                Adv: ₹{(client.advancePaid || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-amber-900 font-mono font-bold mt-0.5 truncate">
                Balance: ₹{balanceDue.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Requirements Pills */}
        {client.requirements && client.requirements.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100">
            <span className="text-xs font-bold text-gray-500 mr-1 shrink-0">Inclusions:</span>
            {client.requirements.map((req, i) => (
              <span
                key={i}
                className="text-[11px] font-medium text-gray-700 bg-gray-100/90 border border-gray-200 px-2.5 py-0.5 rounded-lg truncate"
              >
                {req}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. Studio Communication & Client Sharing Hub (Clean, Minimal, Luminous Studio Card) */}
      <div className="bg-gradient-to-br from-emerald-50/60 via-white to-gray-50/80 p-4 sm:p-5 rounded-2xl shadow-xs border border-emerald-100/80 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#2C8567] text-white text-[10px] font-bold uppercase tracking-wider shrink-0">
                Client Hub
              </span>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                Live Client Portal & WhatsApp Summary
              </h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Clients can view their real-time editing milestones, Google Drive deliverables, and invoice receipts through their dedicated link without logging in.
            </p>
          </div>

          {/* Responsive Action Buttons (Stacked on Mobile, Clean row on Desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-auto shrink-0 pt-1 md:pt-0">
            {/* Copy & View Portal Link */}
            <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden text-xs bg-white shadow-2xs w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPortalLink}
                className="h-9 px-3 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-50 border-r border-gray-200 gap-1.5 rounded-none font-semibold cursor-pointer flex-1 justify-center"
                title="Copy client portal link to clipboard"
              >
                {portalCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#2C8567] shrink-0" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Copy Portal Link</span>
                  </>
                )}
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-9 px-3 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-none cursor-pointer shrink-0"
                title="Preview client portal in a new tab"
              >
                <a href={`/portal/${client._id}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            </div>

            {/* Send WhatsApp Booking Confirmation */}
            <Button
              onClick={handleSendBookingSummary}
              className="bg-[#2C8567] hover:bg-[#236d54] text-white font-bold text-xs h-9 px-3.5 gap-2 rounded-xl shadow-xs cursor-pointer w-full sm:w-auto justify-center"
              title="Send WhatsApp booking confirmation with deliverables and payment link"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>Send WhatsApp Summary</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Feature Navigation Tabs (Mobile-Safe Horizontal Scrollable Bar) */}
      <Tabs defaultValue="deliverables" className="w-full max-w-full space-y-4 min-w-0">
        <div className="w-full max-w-full overflow-hidden bg-white p-1.5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="w-full overflow-x-auto scrollbar-none flex items-center">
            <TabsList className="bg-transparent p-0 flex items-center gap-1.5 justify-start w-max min-w-full">
              <TabsTrigger
                value="deliverables"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl data-[state=active]:bg-[#2C8567] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Milestones</span>
              </TabsTrigger>

              <TabsTrigger
                value="payments"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl data-[state=active]:bg-[#2C8567] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                <span>Payments</span>
              </TabsTrigger>

              <TabsTrigger
                value="notes"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl data-[state=active]:bg-[#2C8567] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>Studio Notes ({client.notes?.length || 0})</span>
              </TabsTrigger>

              <TabsTrigger
                value="package"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl data-[state=active]:bg-[#2C8567] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Package className="w-3.5 h-3.5 shrink-0" />
                <span>Package Scope {client.packageDetails ? '✓' : ''}</span>
              </TabsTrigger>

              <TabsTrigger
                value="activity"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl data-[state=active]:bg-[#2C8567] data-[state=active]:text-white data-[state=active]:shadow-xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <History className="w-3.5 h-3.5 shrink-0" />
                <span>Audit History</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Tab 1: Post-Production Deliverables Pipeline */}
        <TabsContent value="deliverables" className="w-full min-w-0 space-y-4">
          <div className="bg-purple-50/50 border border-purple-100 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-purple-900">
            <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <p className="font-bold">Post-Production Milestone Tracker</p>
              <p className="text-purple-700 leading-relaxed">
                Track every stage from Raw Backup to Final Album delivery. Attach your Google Drive or Pixieset link to each deliverable, and tap <strong>Notify Client</strong> to instantly send an update via WhatsApp.
              </p>
            </div>
          </div>

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

        {/* Tab 2: Payment Installment Schedule */}
        <TabsContent value="payments" className="w-full min-w-0 space-y-4">
          <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-emerald-950">
            <Info className="w-4 h-4 text-[#2C8567] shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <p className="font-bold">Milestone Payment Schedule</p>
              <p className="text-emerald-800 leading-relaxed">
                Manage 3-tier payments (Advance Booking, Event Day, and Final Delivery). Record UPI/bank receipts and click <strong>Send Receipt</strong> to generate a formatted WhatsApp receipt for the client.
              </p>
            </div>
          </div>

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

        {/* Tab 3: Studio Notes & Logs */}
        <TabsContent value="notes" className="w-full min-w-0 space-y-4">
          <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <p className="font-bold">Private Studio Notes & Discussion Logs</p>
              <p className="text-blue-700 leading-relaxed">
                Log phone discussions, couple preferences, song requests, and shoot directions. These notes are completely private and only visible to your studio team.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Add New Note</h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <Textarea
                placeholder="Log discussion points, couple song choices, venue contact, or shoot reminders..."
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="text-xs sm:text-sm font-sans"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingNote || !newNote.trim()}
                  className="bg-[#2C8567] hover:bg-[#236d54] text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {submittingNote ? 'Saving...' : 'Post Note'}
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-gray-900">Notes Timeline</h3>
            {(!client.notes || client.notes.length === 0) ? (
              <p className="text-xs text-gray-400 py-6 text-center">No notes recorded yet. Add your first note above.</p>
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

        {/* Tab 4: Package Deliverables & PDF Conversion */}
        <TabsContent value="package" className="w-full min-w-0 space-y-4">
          <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <p className="font-bold">Agreed Scope & PDF Quotation Extraction</p>
              <p className="text-amber-800 leading-relaxed">
                Document agreed hours of coverage, camera crew, teaser lengths, and album specifications. You can type directly or upload an existing quotation PDF to extract text automatically.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#2C8567]" />
                  <span>Contracted Deliverables & Inclusions</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Package scope, hours of coverage, deliverables (converted from PDF or edited).
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
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
                  className="text-blue-700 bg-blue-50/80 border-blue-200 hover:bg-blue-100 h-8 text-xs gap-1.5 rounded-xl font-semibold cursor-pointer"
                >
                  {extractingPdfClient ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Extracting…</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Upload Quotation PDF</span>
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
                    className="h-8 text-xs gap-1.5 rounded-xl font-semibold cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Scope</span>
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
                  placeholder="Detail agreed deliverables, e.g. 2 Traditional Cameras, 1 Candid Photographer, 1 Cinematic Teaser (1 min), 1 Full Wedding Film (30-45 mins), 35-page Flush Mount Album..."
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
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingPackage}
                    onClick={handleSavePackage}
                    className="bg-[#2C8567] hover:bg-[#236d54] text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    {savingPackage ? 'Saving…' : 'Save Package Scope'}
                  </Button>
                </div>
              </div>
            ) : client.packageDetails ? (
              <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 text-xs sm:text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                {client.packageDetails}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 space-y-3">
                <Package className="w-9 h-9 mx-auto text-gray-300" />
                <p className="text-xs text-gray-500">No package scope recorded yet for this client.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPackage(true)}
                  className="text-xs font-semibold rounded-xl"
                >
                  + Add Package Scope
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 5: Activity & Status History */}
        <TabsContent value="activity" className="w-full min-w-0 space-y-4">
          <div className="bg-gray-50 border border-gray-200/60 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-gray-700">
            <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0">
              <p className="font-bold text-gray-900">Audit & Timeline Log</p>
              <p className="text-gray-600 leading-relaxed">
                Full chronological history of status changes, client updates, and interactions recorded for this booking.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Pipeline Stage Transitions</h3>
            {(!client.statusHistory || client.statusHistory.length === 0) ? (
              <p className="text-xs text-gray-400 py-3">No status changes recorded yet.</p>
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
                        <span className="font-bold text-[#2C8567]">{sh.statusName}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDateTime(sh.changedAt)} ({timeAgo(sh.changedAt)})
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Client Activity Log</h3>
            {activities.length === 0 ? (
              <p className="text-xs text-gray-400 py-3">No activity logged yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {activities.map((act) => (
                  <div key={act._id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 font-medium break-words">{act.description}</p>
                      <span className="text-xs text-gray-400 capitalize">{act.action}</span>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
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
        title="Delete Client Profile"
        description="Are you sure you want to delete this client? All notes, deliverable milestones, and payment records for this client will be permanently removed. This action cannot be undone."
        confirmLabel="Delete Client"
        variant="destructive"
        loading={deleteLoading}
        onConfirm={handleDeleteClient}
      />
    </div>
  );
}