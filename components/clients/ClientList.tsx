'use client';
import { useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, List, Users, Phone } from 'lucide-react';
import { Client } from '@/types';
import { ClientCard } from './ClientCard';
import { StatusBadge } from './StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, timeAgo } from '@/lib/utils';

interface ClientListProps {
  clients: Client[];
  total: number;
  totalPages: number;
  page: number;
  onPageChange: (newPage: number) => void;
  onAddClient: () => void;
}

export function ClientList({
  clients,
  total,
  totalPages,
  page,
  onPageChange,
  onAddClient,
}: ClientListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No clients found"
        description="Get started by adding your first client or adjust your search filters."
        actionLabel="Add Client"
        onAction={onAddClient}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 font-medium">
          Showing <span className="font-semibold text-gray-900">{clients.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{total}</span> clients
        </p>
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <ClientCard key={client._id} client={client} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead>Client</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => {
                const latestNote = c.notes && c.notes.length > 0 ? c.notes[c.notes.length - 1] : null;
                return (
                  <TableRow key={c._id} className="hover:bg-gray-50/80">
                    <TableCell className="font-medium text-gray-900">
                      <Link
                        href={`/clients/${c._id}`}
                        className="hover:text-blue-600 font-semibold"
                      >
                        {c.name || 'Unnamed Client'}
                      </Link>
                      {latestNote && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 font-normal">
                          {latestNote.content}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">
                      {c.clientId}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {c.notes?.length || 0}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500" title={formatDate(c.createdAt)}>
                      {timeAgo(c.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/clients/${c._id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
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
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
