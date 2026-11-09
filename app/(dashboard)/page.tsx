'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
  Activity as ActivityIcon,
  ArrowRight,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentClients } from '@/components/dashboard/RecentClients';
import { QuickAddClient } from '@/components/clients/QuickAddClient';
import { Button } from '@/components/ui/button';
import { CardLoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from '@/types';
import { timeAgo } from '@/lib/utils';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user } = useAuth();
  const { stats, recentClients, loading, refetch } = useDashboard();
  const [activities, setActivities] = useState<Activity[]>([]);

  const [addClientOpen, setAddClientOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [needsSeed, setNeedsSeed] = useState(false);

  useEffect(() => {
    fetch('/api/statuses')
      .then((r) => r.json())
      .then((d) => {
        if (!d.data || d.data.length === 0) {
          setNeedsSeed(true);
        }
      })
      .catch(() => {});

    fetch('/api/activity?limit=6')
      .then((r) => r.json())
      .then((d) => setActivities(d.data || []))
      .catch(() => {});
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed');
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Default statuses initialized');
        setNeedsSeed(false);
        refetch();
      } else {
        toast.error(data.error || 'Failed to seed');
      }
    } catch {
      toast.error('Failed to seed statuses');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back, {user?.name || 'Producer'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Client relationship & lead pipeline overview for Reelman Production.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {needsSeed && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seeding}
              className="text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              {seeding ? 'Seeding...' : 'Seed 10 Statuses'}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setAddClientOpen(true)}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Client
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <CardLoadingSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            title="Total Clients"
            value={stats?.totalClients ?? 0}
            icon={Users}
            color="text-blue-600 bg-blue-50"
            description="All clients registered"
          />
          <StatsCard
            title="Active Clients"
            value={stats?.activeClients ?? 0}
            icon={Clock}
            color="text-emerald-600 bg-emerald-50"
            description="Clients currently in pipeline"
          />
          <StatsCard
            title="Pending Follow-ups"
            value={stats?.pendingClients ?? 0}
            icon={CheckCircle2}
            color="text-amber-600 bg-amber-50"
            description="Pending follow-ups or replies"
          />
        </div>
      )}

      {/* Recent Clients & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentClients clients={recentClients} />

        {/* Recent Activity card */}
        <Card className="shadow-sm border-gray-100 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-gray-500" />
              <CardTitle className="text-base font-semibold text-gray-900">
                Recent Activity
              </CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-blue-600">
              <Link href="/activity" className="flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0 flex-1">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No recent activity logged.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activities.map((act) => (
                  <div
                    key={act._id}
                    className="py-3 flex items-start justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {act.description}
                      </p>
                      <span className="text-xs text-gray-400 capitalize">
                        {act.action}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {timeAgo(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Client Modal */}
      <QuickAddClient
        open={addClientOpen}
        onOpenChange={setAddClientOpen}
        onSuccess={() => {
          refetch();
          fetch('/api/activity?limit=6')
            .then((r) => r.json())
            .then((d) => setActivities(d.data || []))
            .catch(() => {});
        }}
      />
    </div>
  );
}
