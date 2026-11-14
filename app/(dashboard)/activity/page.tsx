'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity as ActivityIcon,
  User,
  PlusCircle,
  FileText,
  CreditCard,
  Briefcase,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Activity } from '@/types';
import { formatDateTime, timeAgo } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardLoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Button } from '@/components/ui/button';

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/activity?page=${page}&limit=25`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'client_created':
        return <PlusCircle className="w-4 h-4 text-emerald-600" />;
      case 'note_added':
      case 'note_edited':
      case 'note_deleted':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'payment_recorded':
      case 'payment_updated':
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case 'project_created':
      case 'project_updated':
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100/90 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Audit Logs & Team Activity
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#141414] tracking-tight">
            Activity Feed<span className="text-[#dc2626]">.</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal">
            Real-time audit trail of client bookings, stage moves, notes, and transactions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchActivities} className="rounded-xl shadow-2xs font-semibold self-start sm:self-auto">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-[#dc2626]" />
          Refresh Feed
        </Button>
      </div>

      {loading ? (
        <CardLoadingSkeleton count={4} />
      ) : activities.length === 0 ? (
        <EmptyState
          icon={ActivityIcon}
          title="No activity recorded"
          description="Actions taken by team members on clients, projects, and payments will appear here."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="relative pl-6 space-y-6 border-l-2 border-gray-100">
            {activities.map((act) => {
              const userObj = typeof act.userId === 'object' ? act.userId : null;
              const clientObj = typeof act.clientId === 'object' ? act.clientId : null;

              return (
                <div key={act._id} className="relative group">
                  <div className="absolute -left-[33px] top-1 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-xs">
                    {getActionIcon(act.action)}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="text-sm font-medium text-gray-900">
                      {act.description}
                    </p>
                    <span
                      className="text-xs text-gray-400 whitespace-nowrap"
                      title={formatDateTime(act.createdAt)}
                    >
                      {timeAgo(act.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    {userObj && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        {userObj.name}
                      </span>
                    )}
                    {clientObj && (
                      <Link
                        href={`/clients/${clientObj._id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Client: {clientObj.name || clientObj.clientId}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
