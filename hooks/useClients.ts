'use client';
import { useState, useEffect, useCallback } from 'react';
import { Client, Status, StatusStat } from '@/types';

interface UseClientsOptions {
  search?: string;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
  archived?: boolean;
}

export function useClients(options: UseClientsOptions = {}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusStat[]>([]);
  const [totalClientsCount, setTotalClientsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options.search) params.set('search', options.search);
      if (options.status) params.set('status', options.status);
      if (options.sort) params.set('sort', options.sort);
      if (options.archived) params.set('archived', 'true');
      params.set('page', String(options.page || 1));
      params.set('limit', String(options.limit || 20));

      const res = await fetch(`/api/clients?${params}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Failed to fetch clients (HTTP ${res.status})`);
      }

      const json = await res.json();
      setClients(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 0);
      if (Array.isArray(json.statusBreakdown)) {
        setStatusBreakdown(json.statusBreakdown);
      }
      if (typeof json.totalClients === 'number') {
        setTotalClientsCount(json.totalClients);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch clients';
      setError(msg);
      console.error('useClients fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [options.search, options.status, options.sort, options.page, options.limit, options.archived]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    total,
    totalPages,
    statusBreakdown,
    totalClientsCount,
    loading,
    error,
    refetch: fetchClients,
  };
}

export function useStatuses() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/statuses')
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => null);
          throw new Error(err?.error || 'Failed to fetch statuses');
        }
        return r.json();
      })
      .then((d) => setStatuses(d.data || []))
      .catch((err) => console.error('useStatuses error:', err))
      .finally(() => setLoading(false));
  }, []);

  return { statuses, loading };
}
