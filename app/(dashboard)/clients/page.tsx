'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { useClients, useStatuses } from '@/hooks/useClients';
import { ClientList, ViewMode } from '@/components/clients/ClientList';
import { ClientFilters } from '@/components/clients/ClientFilters';
import { QuickAddClient } from '@/components/clients/QuickAddClient';
import { CallNotepad } from '@/components/clients/CallNotepad';
import { CallNotepadModal } from '@/components/clients/CallNotepadModal';
import { Button } from '@/components/ui/button';
import { CardLoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function ClientsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  // Modals and notepad states
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [showCallNotepad, setShowCallNotepad] = useState(false);
  const [notepadModalOpen, setNotepadModalOpen] = useState(false);

  const { statuses } = useStatuses();

  // For Kanban mode, load a larger batch (150) so all status columns show pipeline clients properly
  const limit = viewMode === 'kanban' ? 150 : 12;

  const { clients, total, totalPages, loading, refetch } = useClients({
    search,
    status: status === 'all' ? undefined : status,
    sort,
    page: viewMode === 'kanban' ? 1 : page,
    limit,
  });

  // Global event listener for updates and additions
  useEffect(() => {
    const handleCreated = () => refetch();
    const handleUpdated = () => refetch();
    window.addEventListener('client-created', handleCreated);
    window.addEventListener('client-updated', handleUpdated);
    return () => {
      window.removeEventListener('client-created', handleCreated);
      window.removeEventListener('client-updated', handleUpdated);
    };
  }, [refetch]);

  // Keyboard shortcut Alt+N or Alt+C to toggle Live Call Notepad
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C' || e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setShowCallNotepad((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick add for specific status column
  const handleAddClientForStatus = useCallback((_statusId: string) => {
    setShowCallNotepad(true);
  }, []);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clients Pipeline</h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2C8567]/10 text-[#2C8567] border border-[#2C8567]/20">
              Zoho-Style Kanban
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Drag clients across status columns to advance leads, or scribble call notes &amp; Move to New.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Live Call Notepad Toggle Button */}
          <Button
            type="button"
            onClick={() => setShowCallNotepad((prev) => !prev)}
            className={`flex items-center gap-2 shadow-xs transition-all ${
              showCallNotepad
                ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-400'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            <FileText className="w-4 h-4 animate-pulse" />
            <span className="font-semibold">Call Notepad</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.2 bg-amber-700/60 rounded text-[10px] text-amber-100 font-mono">
              Alt+C
            </kbd>
            {showCallNotepad ? (
              <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            )}
          </Button>

          {/* Standard Add Client Button */}
          <Button
            variant="outline"
            onClick={() => setAddClientOpen(true)}
            className="flex items-center gap-1.5 shadow-2xs border-gray-300"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </Button>
        </div>
      </div>

      {/* Immediate Phone Call Notepad Dock (Collapsible right above the board) */}
      {showCallNotepad && (
        <div className="animate-fade-in">
          <CallNotepad
            statuses={statuses}
            isInline={true}
            onClose={() => setShowCallNotepad(false)}
            onSuccess={() => {
              refetch();
            }}
          />
        </div>
      )}

      {/* Filters (Search & Sort) */}
      <ClientFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        sort={sort}
        onSortChange={(v) => {
          setSort(v);
          setPage(1);
        }}
        statuses={statuses}
      />

      {/* Content */}
      {loading ? (
        <CardLoadingSkeleton count={6} />
      ) : (
        <ClientList
          clients={clients}
          total={total}
          totalPages={totalPages}
          page={page}
          statuses={statuses}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onPageChange={setPage}
          onAddClient={() => setAddClientOpen(true)}
          onAddClientForStatus={handleAddClientForStatus}
          onClientUpdated={refetch}
          onOpenCallIntake={() => {
            setShowCallNotepad(true);
          }}
        />
      )}

      {/* Quick Add Client Modal (fallback standard dialog) */}
      <QuickAddClient
        open={addClientOpen}
        onOpenChange={setAddClientOpen}
        onSuccess={refetch}
      />

      {/* Global Call Notepad Modal if triggered elsewhere */}
      <CallNotepadModal
        open={notepadModalOpen}
        onOpenChange={setNotepadModalOpen}
        statuses={statuses}
        onSuccess={refetch}
      />
    </div>
  );
}
