'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useClients, useStatuses } from '@/hooks/useClients';
import { ClientMapTracker } from '@/components/clients/ClientMapTracker';
import { QuickAddClient } from '@/components/clients/QuickAddClient';
import { Button } from '@/components/ui/button';
import { CardLoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function MapPage() {
  const [addClientOpen, setAddClientOpen] = useState(false);

  // Fetch up to 250 clients to map regional distribution across Kerala and India
  const { clients, loading: clientsLoading, refetch } = useClients({
    limit: 250,
    sort: 'newest',
  });
  const { statuses, loading: statusesLoading } = useStatuses();

  const loading = (clientsLoading || statusesLoading) && clients.length === 0;

  // Global listeners for client updates
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>Client Geo Tracking</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Interactive Map
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visual client tracker across Kerala districts (default) and Indian states with shoot locations and real-time contact actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            onClick={() => setAddClientOpen(true)}
            className="flex items-center gap-2 bg-[#141414] hover:bg-black text-white rounded-xl shadow-xs px-4 py-2 font-semibold transition-all hover:shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#dc2626]" />
            <span>Add Client</span>
          </Button>
        </div>
      </div>

      {/* Main Map Tracker */}
      {loading ? (
        <CardLoadingSkeleton count={6} />
      ) : (
        <ClientMapTracker
          clients={clients}
          statuses={statuses}
          onClientUpdated={() => refetch()}
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
