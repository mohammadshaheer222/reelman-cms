'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Clock,
  CheckCircle2,
  Activity as ActivityIcon,
  ArrowRight,
  IndianRupee,
  StickyNote,
  Package,
  Layers,
  Sparkles,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/hooks/useAuth';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentClients } from '@/components/dashboard/RecentClients';
import { PaymentsDueWidget } from '@/components/dashboard/PaymentsDueWidget';
import { QuickAddClient } from '@/components/clients/QuickAddClient';
import { Button } from '@/components/ui/button';
import { CardLoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from '@/types';
import { timeAgo } from '@/lib/utils';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { stats, recentClients, loading, refetch } = useDashboard();
  const [activities, setActivities] = useState<Activity[]>([]);

  // If user does not have permission to view Home, redirect immediately
  const allowed = user?.allowedNavItems;
  const isHomeBlocked = Boolean(user && Array.isArray(allowed) && allowed.length > 0 && !allowed.includes('/'));

  useEffect(() => {
    if (isHomeBlocked && allowed) {
      const fallback = allowed.find((item) => item !== '/') || allowed[0] || '/clients';
      router.replace(fallback);
    }
  }, [isHomeBlocked, allowed, router]);

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

  const formattedRevenue = `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`;
  const formattedAdvance = `₹${(stats?.totalAdvance || 0).toLocaleString('en-IN')}`;

  if (isHomeBlocked) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100/90 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] animate-pulse" />
              Creator Studio CRM
            </span>
            <span className="text-xs text-gray-300">•</span>
            <span className="text-xs text-gray-500 font-medium">Real-time pipeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#141414] tracking-tight">
            Welcome back, {user?.name || 'Producer'}
            <span className="text-[#dc2626]">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-normal leading-relaxed">
            Monitor creator bookings, shoot schedules, deliverable milestones, and payment collections.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {needsSeed && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seeding}
              className="text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100 text-xs rounded-xl font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              {seeding ? 'Initializing...' : 'Initialize Pipeline'}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setAddClientOpen(true)}
            className="flex items-center gap-2 bg-[#141414] hover:bg-black text-white rounded-xl shadow-xs px-4 py-2 font-semibold transition-all hover:shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#dc2626]" />
            <span>New Client</span>
          </Button>
        </div>
      </div>

      {/* 4 Clean Metric Cards */}
      {loading ? (
        <CardLoadingSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <StatsCard
            title="Total Clients"
            value={stats?.totalClients ?? 0}
            icon={Users}
            color="text-[#141414] bg-gray-100"
            description="Registered studio clients"
          />
          <StatsCard
            title="Active Pipeline"
            value={stats?.activeClients ?? 0}
            icon={Clock}
            color="text-[#dc2626] bg-red-50 border border-red-100/60"
            description="Leads currently in pipeline"
          />
          <StatsCard
            title="Confirmed Bookings"
            value={formattedRevenue}
            icon={IndianRupee}
            color="text-emerald-700 bg-emerald-50 border border-emerald-100/60"
            description="Agreed shoot value"
          />
          <StatsCard
            title="Advance Received"
            value={formattedAdvance}
            icon={CheckCircle2}
            color="text-blue-700 bg-blue-50 border border-blue-100/60"
            description="Advance payments collected"
          />
        </div>
      )}

      {/* Studio Quick Shortcuts (Smooth, intuitive 1-click navigation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/clients"
          className="p-4 rounded-2xl bg-white border border-gray-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)] hover:border-gray-200 transition-all duration-300 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-[#141414] flex items-center justify-center font-bold group-hover:bg-[#141414] group-hover:text-white transition-colors duration-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#141414] group-hover:text-black transition-colors">
                Clients & Pipeline
              </p>
              <p className="text-xs text-gray-400 font-normal">Track client stages & bookings</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#dc2626] group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/calendar"
          className="p-4 rounded-2xl bg-white border border-gray-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)] hover:border-gray-200 transition-all duration-300 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#141414] group-hover:text-blue-600 transition-colors">
                Shoot Calendar
              </p>
              <p className="text-xs text-gray-400 font-normal">Schedule & conflict detector</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/notepad"
          className="p-4 rounded-2xl bg-white border border-gray-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)] hover:border-gray-200 transition-all duration-300 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
              <StickyNote className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#141414] group-hover:text-amber-600 transition-colors">
                Call Notepad
              </p>
              <p className="text-xs text-gray-400 font-normal">Quick notes during inquiries</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/packages"
          className="p-4 rounded-2xl bg-white border border-gray-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.05)] hover:border-gray-200 transition-all duration-300 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#dc2626] flex items-center justify-center font-bold group-hover:bg-[#dc2626] group-hover:text-white transition-colors duration-300">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#141414] group-hover:text-[#dc2626] transition-colors">
                Proposals & PDF
              </p>
              <p className="text-xs text-gray-400 font-normal">Client booklets & packages</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#dc2626] group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Payments Due This Month (Pending Collections & 1-Click Reminders) */}
      <PaymentsDueWidget />

      {/* Recent Clients & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentClients clients={recentClients} />

        {/* Recent Activity card */}
        <Card className="shadow-xs border-gray-100 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-gray-500" />
              <CardTitle className="text-base font-semibold text-gray-900">
                Recent Activity
              </CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl">
              <Link href="/activity" className="flex items-center gap-1 font-semibold">
                View All <ArrowRight className="w-3.5 h-3.5 text-[#dc2626]" />
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
