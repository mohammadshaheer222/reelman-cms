'use client';
import { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import { useClients, useStatuses } from '@/hooks/useClients';
import { ClientList } from '@/components/clients/ClientList';
import { ClientFilters } from '@/components/clients/ClientFilters';
import { QuickAddClient } from '@/components/clients/QuickAddClient';
import { Button } from '@/components/ui/button';
import { CardLoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [addClientOpen, setAddClientOpen] = useState(false);

  const { statuses } = useStatuses();
  const { clients, total, totalPages, loading, refetch } = useClients({
    search,
    status: status === 'all' ? undefined : status,
    sort,
    page,
    limit: 12,
  });

  useEffect(() => {
    const handleCreated = () => refetch();
    window.addEventListener('client-created', handleCreated);
    return () => window.removeEventListener('client-created', handleCreated);
  }, [refetch]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your leads, client profiles, status progression, and notes.
          </p>
        </div>
        <Button
          onClick={() => setAddClientOpen(true)}
          className="flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
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
          onPageChange={setPage}
          onAddClient={() => setAddClientOpen(true)}
        />
      )}

      {/* Quick Add Client Modal */}
      <QuickAddClient
        open={addClientOpen}
        onOpenChange={setAddClientOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
