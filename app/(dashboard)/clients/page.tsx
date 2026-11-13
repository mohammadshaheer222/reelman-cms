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

  // Modal state
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [preselectedStatusId, setPreselectedStatusId] = useState<string | undefined>(undefined);

  const { statuses, loading: statusesLoading } = useStatuses();

  // For Board mode, load a larger batch (150) so all status columns show pipeline clients properly
  const limit = viewMode === 'kanban' ? 150 : 12;

  const { clients, total, totalPages, loading: clientsLoading, refetch } = useClients({
    search,
    status: status === 'all' ? undefined : status,
    sort,
    page: viewMode === 'kanban' ? 1 : page,
    limit,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your client pipeline, track shooting stages, and view bookings.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            onClick={() => {
              setPreselectedStatusId(undefined);
              setAddClientOpen(true);
            }}
            className="flex items-center gap-1.5 shadow-sm bg-[#2C8567] hover:bg-[#236d54] text-white"
          >
            <Plus className="w-4 h-4" />
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
