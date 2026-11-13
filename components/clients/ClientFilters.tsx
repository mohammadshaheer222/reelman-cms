'use client';
import { useState, useRef, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, Check, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Status } from '@/types';

interface ClientFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
  statuses: Status[];
}

export function ClientFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  statuses,
}: ClientFiltersProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedStatusIds = status === 'all' || !status ? [] : status.split(',').filter(Boolean);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  const toggleStatus = (id: string) => {
    let next: string[];
    if (selectedStatusIds.includes(id)) {
      next = selectedStatusIds.filter((s) => s !== id);
    } else {
      next = [...selectedStatusIds, id];
    }

    if (next.length === 0) {
      onStatusChange('all');
    } else {
      onStatusChange(next.join(','));
    }
  };

  const clearStatuses = () => {
    onStatusChange('all');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search clients by name, location, requirements, or notes..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 bg-white"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Multi-choice status filter dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="h-9 bg-white border-gray-200 text-xs font-medium gap-1.5 min-w-[130px] justify-between"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">
                {selectedStatusIds.length === 0
                  ? 'All Statuses'
                  : selectedStatusIds.length === 1
                  ? statuses.find((s) => s._id === selectedStatusIds[0])?.name || '1 Status'
                  : `${selectedStatusIds.length} Statuses`}
              </span>
            </div>
            {selectedStatusIds.length > 0 ? (
              <span className="w-4 h-4 rounded-full bg-[#2C8567] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {selectedStatusIds.length}
              </span>
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            )}
          </Button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 p-2 bg-white shadow-xl rounded-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100 px-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Filter by Status
                </span>
                {selectedStatusIds.length > 0 && (
                  <button
                    type="button"
                    onClick={clearStatuses}
                    className="text-[10px] text-gray-400 hover:text-red-600 font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="space-y-0.5 max-h-60 overflow-y-auto modal-scroll">
                <button
                  type="button"
                  onClick={clearStatuses}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    selectedStatusIds.length === 0
                      ? 'bg-[#2C8567]/10 text-[#2C8567] font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>All Statuses</span>
                  {selectedStatusIds.length === 0 && <Check className="w-3.5 h-3.5 text-[#2C8567]" />}
                </button>

                {statuses.map((s) => {
                  const isChecked = selectedStatusIds.includes(s._id);
                  return (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => toggleStatus(s._id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        isChecked
                          ? 'bg-[#2C8567]/10 text-[#2C8567] font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="truncate">{s.name}</span>
                      </div>
                      {isChecked && <Check className="w-3.5 h-3.5 text-[#2C8567]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sort Select */}
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger className="w-[140px] h-9 bg-white text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-gray-400" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="updated">Recently Updated</SelectItem>
            <SelectItem value="alpha">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
