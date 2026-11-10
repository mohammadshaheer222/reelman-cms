'use client';
import { useState, useEffect } from 'react';
import { Sparkles, Plus, BookOpen, Trash2, Edit3, Printer } from 'lucide-react';
import { PackageData, Client } from '@/types';
import { DEFAULT_PACKAGE } from '@/lib/defaultPackage';
import { PackageBuilder } from '@/components/packages/PackageBuilder';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activePackage, setActivePackage] = useState<PackageData>(DEFAULT_PACKAGE);
  const [loading, setLoading] = useState(true);

  const fetchPackagesAndClients = async (isInitial = false, preserveId?: string) => {
    try {
      const [pkgRes, clientRes] = await Promise.all([
        fetch('/api/packages'),
        fetch('/api/clients?limit=100'),
      ]);

      if (pkgRes.ok) {
        const pkgData = await pkgRes.json();
        const list: PackageData[] = pkgData.data || [];
        setPackages(list);
        if (preserveId) {
          const match = list.find((p) => p._id === preserveId);
          if (match) {
            setActivePackage(match);
          }
        } else if (isInitial && list.length > 0) {
          setActivePackage(list[0]);
        }
      }

      if (clientRes.ok) {
        const cData = await clientRes.json();
        setClients(cData.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackagesAndClients(true);
  }, []);

  const handleCreateNew = () => {
    setActivePackage({
      ...DEFAULT_PACKAGE,
      title: `Wedding Package ${packages.length + 1}`,
      _id: undefined,
    });
    toast.info('New blank template loaded. Customize and save.');
  };

  const handleDeletePackage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this package template?')) return;
    try {
      const res = await fetch(`/api/packages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete package');
      toast.success('Package deleted');
      setPackages((prev) => prev.filter((p) => p._id !== id));
      setActivePackage(DEFAULT_PACKAGE);
    } catch {
      toast.error('Could not delete package');
    }
  };

  return (
    <div className="space-y-6">
      {/* Saved Packages Ribbon (No-print) */}
      <div className="no-print bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-xs">
        {/* Mobile View: Clean Select Dropdown (NO horizontal scroll) */}
        <div className="flex sm:hidden items-center gap-2 w-full">
          <div className="flex-1 min-w-0">
            <Select
              value={activePackage._id || 'default'}
              onValueChange={(val) => {
                if (val === 'default') {
                  setActivePackage(DEFAULT_PACKAGE);
                } else {
                  const found = packages.find((p) => p._id === val);
                  if (found) setActivePackage(found);
                }
              }}
            >
              <SelectTrigger className="h-9 text-xs w-full bg-gray-50 border-gray-200 truncate">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  Default Signature Proposal
                </SelectItem>
                {packages.map((p) => (
                  <SelectItem key={p._id} value={p._id!}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activePackage._id && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => handleDeletePackage(activePackage._id!, e)}
              className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200 shrink-0"
              title="Delete current template"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleCreateNew}
            className="h-9 px-3 shrink-0 text-xs flex items-center gap-1 bg-white hover:bg-gray-50"
          >
            <Plus className="w-3.5 h-3.5 text-[#2C8567]" />
            New
          </Button>
        </div>

        {/* Desktop / Tablet View: Wrapped pills with New Template button (no horizontal scroll) */}
        <div className="hidden sm:flex flex-row items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider shrink-0 mr-1">
              Saved Templates:
            </span>

            <Button
              size="sm"
              variant={!activePackage._id ? 'default' : 'outline'}
              onClick={() => setActivePackage(DEFAULT_PACKAGE)}
              className="text-xs h-8 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Default Signature
            </Button>

            {packages.map((p) => (
              <div key={p._id} className="relative group shrink-0">
                <Button
                  size="sm"
                  variant={activePackage._id === p._id ? 'default' : 'outline'}
                  onClick={() => setActivePackage(p)}
                  className="text-xs h-8 pr-7"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1" />
                  {p.title}
                </Button>
                <button
                  type="button"
                  onClick={(e) => handleDeletePackage(p._id!, e)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                  title="Delete template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCreateNew}
            className="text-xs h-8 shrink-0 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            New Template
          </Button>
        </div>
      </div>

      {/* Main Studio / Builder Component */}
      <PackageBuilder
        key={activePackage._id || activePackage.title}
        initialData={activePackage}
        clients={clients}
        onSaved={(saved) => {
          setActivePackage(saved);
          fetchPackagesAndClients(false, saved._id);
        }}
      />
    </div>
  );
}
