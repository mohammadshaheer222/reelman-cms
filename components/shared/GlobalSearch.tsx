'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Client } from '@/types';

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setClients([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/clients?search=${encodeURIComponent(query)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setClients(data.data || []);
        }
        setOpen(true);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search creators, clients, bookings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          className="pl-9 pr-9 bg-gray-50/90 dark:bg-neutral-900/90 border-gray-200/70 dark:border-neutral-800 focus:bg-white dark:focus:bg-neutral-950 focus:border-gray-300 dark:focus:border-neutral-700 h-9 text-xs sm:text-sm rounded-xl transition-all shadow-2xs"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {open && clients.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-800 py-2 z-50 max-h-80 overflow-y-auto modal-scroll">
            <div className="px-2 py-1">
              <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 px-2 py-1 uppercase tracking-wider">
                Clients
              </p>
              {clients.map((c) => (
                <button
                  key={c._id}
                  onClick={() => {
                    setOpen(false);
                    setQuery('');
                    router.push(`/clients/${c._id}`);
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 text-sm transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-neutral-100 truncate">
                      {c.name || 'Unnamed Client'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-neutral-500 truncate">{c.clientId}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
