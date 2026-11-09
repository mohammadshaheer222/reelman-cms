'use client';
import { useState, useEffect, useCallback } from 'react';
import { Client, Status } from '@/types';

interface UseClientsOptions {
  search?: string;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export function useClients(options: UseClientsOptions = {}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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
      params.set('page', String(options.page || 1));
      params.set('limit', String(options.limit || 20));
      const res = await fetch(`/api/clients?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setClients(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 0);
    } catch {
      setError('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, [options.search, options.status, options.sort, options.page, options.limit]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return { clients, total, totalPages, loading, error, refetch: fetchClients };
}

export function useStatuses() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/statuses')
      .then((r) => r.json())
      .then((d) => setStatuses(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  return { statuses, loading };
}

