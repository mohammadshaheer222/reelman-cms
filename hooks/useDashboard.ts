'use client';
import { useState, useEffect, useCallback } from 'react';
import { DashboardStats, Client } from '@/types';

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, clientsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/recent-clients'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data || statsData);
      }
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setRecentClients(clientsData.data || []);
      }
    } catch {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    recentClients,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}
