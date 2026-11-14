'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useClients, useStatuses } from '@/hooks/useClients';
import { ClientList, ViewMode } from '@/components/clients/ClientList';
import { ClientFilters } from '@/components/clients/ClientFilters';
import { QuickAddClient } from '@/components/clients/QuickAddClient';
import { Button } from '@/components/ui/button';
import { CardLoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function ClientsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);

  // Restore user's preferred view mode from URL search param or localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const urlView = params.get('view') as ViewMode | null;
      if (urlView && ['kanban', 'calendar', 'grid', 'table'].includes(urlView)) {
        setViewMode(urlView);
        localStorage.setItem('reelman_clients_view_mode', urlView);
        return;
      }

      const saved = localStorage.getItem('reelman_clients_view_mode') as ViewMode | null;
      if (saved && ['kanban', 'calendar', 'grid', 'table'].includes(saved)) {
        setViewMode(saved);
        return;
      }

      // Default to 'grid' (cards view) on mobile screens ONLY if no user preference was previously saved
      if (window.innerWidth < 768) {
        setViewMode('grid');
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('reelman_clients_view_mode', mode);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('view', mode);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // Ignore
    }
  }, []);

  // Modal state
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [preselectedStatusId, setPreselectedStatusId] = useState<string | undefined>(undefined);

  const { statuses, loading: statusesLoading } = useStatuses();

  // Load 150 for Kanban, 30 for grid/list so all clients are visible without excessive paging
  const limit = viewMode === 'kanban' ? 150 : 30;

  const { clients, total, totalPages, loading: clientsLoading, refetch } = useClients({
    search,
    status: status === 'all' ? undefined : status,
    sort,
    page: viewMode === 'kanban' ? 1 : page,
    limit,
    archived: showArchived,
  });

  const loading = (clientsLoading || statusesLoading) && clients.length === 0;

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

  // Quick add for specific status column
  const handleAddClientForStatus = useCallback((statusId?: string) => {
    setPreselectedStatusId(statusId);
    setAddClientOpen(true);
  }, []);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100/90 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Pipeline Management
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#141414] tracking-tight">
            Clients & Bookings<span className="text-[#dc2626]">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-normal">
            Manage creator shoots, lead statuses, confirmed proposals, and delivery milestones.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            onClick={() => {
              setPreselectedStatusId(undefined);
              setAddClientOpen(true);
            }}
            className="flex items-center gap-2 bg-[#141414] hover:bg-black text-white rounded-xl shadow-xs px-4 py-2 font-semibold transition-all hover:shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#dc2626]" />
            <span>Add Client</span>
          </Button>
        </div>
      </div>

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
        showArchived={showArchived}
        onShowArchivedChange={(v) => {
          setShowArchived(v);
          setPage(1);
        }}
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
          onViewModeChange={handleViewModeChange}
          onPageChange={setPage}
          onAddClient={() => {
            setPreselectedStatusId(undefined);
            setAddClientOpen(true);
          }}
          onAddClientForStatus={handleAddClientForStatus}
          onClientUpdated={refetch}
          onOpenCallIntake={(statusId) => handleAddClientForStatus(statusId)}
        />
      )}

      {/* Add Client Modal */}
      <QuickAddClient
        open={addClientOpen}
        onOpenChange={setAddClientOpen}
        defaultStatusId={preselectedStatusId}
        onSuccess={refetch}
      />
    </div>
  );
}
