'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Plus,
  X,
  MapPin,
  IndianRupee,
  Phone,
  MessageCircle,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Filter,
  List,
  LayoutGrid,
} from 'lucide-react';
import { CalendarShootEvent } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { openWhatsApp } from '@/lib/whatsapp';
import { QuickAddClient } from '@/components/clients/QuickAddClient';

interface ShootCalendarProps {
  onShootClick?: (client: CalendarShootEvent) => void;
  onDateSelect?: (dateStr: string) => void;
  className?: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ShootCalendar({ onShootClick, onDateSelect, className }: ShootCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [dateMap, setDateMap] = useState<Record<string, CalendarShootEvent[]>>({});
  const [conflicts, setConflicts] = useState<Record<string, CalendarShootEvent[]>>({});
  const [events, setEvents] = useState<CalendarShootEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & View Mode
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [filterConflictsOnly, setFilterConflictsOnly] = useState(false);

  // Selected Day Details Modal
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  // Quick Add Modal with pre-filled date
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>(undefined);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      if (res.ok && data.success) {
        setDateMap(data.dateMap || {});
        setConflicts(data.conflicts || {});
        setEvents(data.events || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
  };

  const monthLabel = currentDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  // Calculate stats for current month
  const currentMonthShootsCount = useMemo(() => {
    let count = 0;
    for (const [dateStr, shoots] of Object.entries(dateMap)) {
      if (dateStr.startsWith(monthStr)) {
        count += shoots.length;
      }
    }
    return count;
  }, [dateMap, monthStr]);

  const currentMonthConflictsCount = useMemo(() => {
    let count = 0;
    for (const [dateStr, shoots] of Object.entries(conflicts)) {
      if (dateStr.startsWith(monthStr) && shoots.length >= 2) {
        count++;
      }
    }
    return count;
  }, [conflicts, monthStr]);

  const selectedDayShoots = useMemo(() => {
    if (!selectedDayDate) return [];
    return dateMap[selectedDayDate] || [];
  }, [selectedDayDate, dateMap]);

  const handleOpenDay = (dateStr: string) => {
    setSelectedDayDate(dateStr);
    onDateSelect?.(dateStr);
  };

  const handleBookOnDate = (dateStr: string) => {
    setPrefilledDate(dateStr);
    setAddModalOpen(true);
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Top Banner: Stats & Conflict Alert */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
              Shoots in {currentDate.toLocaleDateString('en-IN', { month: 'short' })}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1 font-mono">
              {currentMonthShootsCount}
            </p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-[#2C8567] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div
          onClick={() => setFilterConflictsOnly((prev) => !prev)}
          className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            currentMonthConflictsCount > 0
              ? filterConflictsOnly
                ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-400'
                : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70'
              : 'bg-white border-gray-100'
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-[10px] sm:text-xs font-semibold text-amber-900 uppercase tracking-wider truncate">
                Conflicts
              </p>
              {currentMonthConflictsCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              )}
            </div>
            <p className="text-lg sm:text-2xl font-bold text-amber-950 mt-0.5 sm:mt-1 font-mono">
              {currentMonthConflictsCount}{' '}
              <span className="text-[10px] sm:text-xs font-normal text-amber-700 hidden sm:inline">
                {currentMonthConflictsCount === 1 ? 'day' : 'days'}
              </span>
            </p>
          </div>
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
              currentMonthConflictsCount > 0
                ? 'bg-amber-200/80 text-amber-900'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
              Active Bookings
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1 font-mono">
              {events.length}
            </p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Navigation & Controls Toolbar */}
        <div className="p-3.5 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Month Navigation */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 tracking-tight min-w-[130px] sm:min-w-[170px]">
              {monthLabel}
            </h2>
            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevMonth}
                className="h-7 w-7 text-gray-600 hover:text-gray-900"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={jumpToToday}
                className="h-7 px-2 text-xs font-medium text-gray-700 hover:text-gray-900"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextMonth}
                className="h-7 w-7 text-gray-600 hover:text-gray-900"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Controls: View Mode & Filter */}
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            {/* Filter Conflicts Toggle */}
            <button
              type="button"
              onClick={() => setFilterConflictsOnly((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filterConflictsOnly
                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{filterConflictsOnly ? 'All Shoots' : 'Conflicts'}</span>
            </button>

            {/* View Switcher: Grid vs Timeline */}
            <div className="inline-flex p-0.5 rounded-lg bg-gray-100 border border-gray-200/60 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Calendar Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Timeline List"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Add Client */}
            <Button
              onClick={() => {
                setPrefilledDate(undefined);
                setAddModalOpen(true);
              }}
              size="sm"
              className="h-8 bg-[#2C8567] hover:bg-[#236d54] text-white text-xs font-semibold gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </Button>
          </div>
        </div>

        {/* View Mode 1: Month Grid */}
        {viewMode === 'grid' && (
          <div className="p-2 sm:p-5">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DAYS_OF_WEEK.map((dayName, idx) => (
                <div
                  key={dayName}
                  className={`py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
                    idx === 0 || idx === 6 ? 'text-amber-700/80' : 'text-gray-500'
                  }`}
                >
                  <span className="sm:hidden">{dayName[0]}</span>
                  <span className="hidden sm:inline">{dayName}</span>
                </div>
              ))}
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Previous month empty offset cells */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[52px] sm:min-h-[115px] p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-gray-50/40 border border-transparent opacity-40 select-none"
                />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                const dayNum = dayIndex + 1;
                const dateStr = `${monthStr}-${String(dayNum).padStart(2, '0')}`;
                const isToday = dateStr === todayStr;
                const dayShoots = dateMap[dateStr] || [];
                const hasConflict = dayShoots.length >= 2;

                if (filterConflictsOnly && !hasConflict) {
                  return (
                    <div
                      key={dateStr}
                      className="min-h-[52px] sm:min-h-[115px] p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-gray-100 bg-gray-50/20 opacity-30 flex items-start"
                    >
                      <span className="text-[11px] sm:text-xs text-gray-400">{dayNum}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleOpenDay(dateStr)}
                    className={`group relative min-h-[52px] sm:min-h-[115px] p-1 sm:p-2 rounded-lg sm:rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      hasConflict
                        ? 'bg-amber-50/60 border-amber-300 hover:border-amber-400 hover:shadow-md'
                        : isToday
                        ? 'bg-emerald-50/30 border-emerald-300 ring-1 ring-emerald-300/50'
                        : dayShoots.length > 0
                        ? 'bg-white border-gray-200/90 hover:border-gray-300 hover:shadow-xs'
                        : 'bg-white/70 border-gray-100 hover:bg-gray-50/80 hover:border-gray-200'
                    }`}
                  >
                    {/* Top Row: Date Number & Badges */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] sm:text-sm font-semibold inline-flex items-center justify-center ${
                          isToday
                            ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#2C8567] text-white font-bold text-[10px] sm:text-xs'
                            : 'text-gray-700'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {/* Conflict Badge */}
                      {hasConflict && (
                        <>
                          <span
                            className="sm:hidden w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"
                            title={`${dayShoots.length} shoots overlap`}
                          />
                          <span
                            className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs animate-pulse"
                            title={`${dayShoots.length} shoots overlap on this date (Double Booking)`}
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>{dayShoots.length}</span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Mobile: Compact Event Dots Indicator */}
                    <div className="sm:hidden flex items-center justify-center gap-1 my-0.5 flex-wrap">
                      {dayShoots.slice(0, 3).map((shoot) => {
                        const statusColor = shoot.status?.color || '#2C8567';
                        return (
                          <span
                            key={shoot._id}
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: statusColor }}
                          />
                        );
                      })}
                      {dayShoots.length > 3 && (
                        <span className="text-[8px] font-bold text-gray-500 leading-none">
                          +{dayShoots.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Desktop: Shoot Cards for this day */}
                    <div className="hidden sm:block space-y-1 my-1 overflow-hidden">
                      {dayShoots.slice(0, 2).map((shoot) => {
                        const statusColor = shoot.status?.color || '#2C8567';
                        return (
                          <div
                            key={shoot._id}
                            className="p-1 rounded-md text-[10px] sm:text-[11px] font-medium truncate flex items-center gap-1.5 border"
                            style={{
                              backgroundColor: `${statusColor}12`,
                              borderColor: `${statusColor}30`,
                              color: statusColor,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: statusColor }}
                            />
                            <span className="truncate font-semibold text-gray-900">
                              {shoot.name}
                            </span>
                          </div>
                        );
                      })}

                      {dayShoots.length > 2 && (
                        <p className="text-[10px] font-semibold text-gray-500 pl-1">
                          +{dayShoots.length - 2} more shoots
                        </p>
                      )}
                    </div>

                    {/* Bottom: Quick Add on Empty Day or Open Day (Desktop only) */}
                    <div className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity items-center justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookOnDate(dateStr);
                        }}
                        className="text-[10px] font-semibold text-[#2C8567] bg-white border border-emerald-200 hover:bg-emerald-50 px-1.5 py-0.5 rounded shadow-2xs flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Book</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View Mode 2: Timeline / List View */}
        {viewMode === 'timeline' && (
          <div className="p-4 sm:p-6 divide-y divide-gray-100">
            {events.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                No shoots scheduled yet. Click &ldquo;Add Client&rdquo; to book a shoot.
              </div>
            ) : (
              events
                .filter((e) => !filterConflictsOnly || (conflicts[e.date]?.length >= 2))
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((event) => {
                  const hasConflict = conflicts[event.date]?.length >= 2;
                  const statusColor = event.status?.color || '#2C8567';

                  return (
                    <div
                      key={event._id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 p-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: `${statusColor}12`,
                            borderColor: `${statusColor}35`,
                            color: statusColor,
                          }}
                        >
                          <span className="text-[10px] font-semibold uppercase leading-none">
                            {event.date
                              ? new Date(event.date).toLocaleDateString('en-IN', { month: 'short' })
                              : 'TBD'}
                          </span>
                          <span className="text-base font-bold leading-tight">
                            {event.date ? new Date(event.date).getDate() : '--'}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/clients/${event._id}`}
                              className="font-bold text-gray-900 text-sm sm:text-base hover:text-[#2C8567] transition-colors"
                            >
                              {event.name}
                            </Link>

                            {event.status && (
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                                style={{
                                  backgroundColor: `${statusColor}15`,
                                  borderColor: `${statusColor}30`,
                                  color: statusColor,
                                }}
                              >
                                {event.status.name}
                              </span>
                            )}

                            {hasConflict && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Overlap Conflict</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span>{event.location}</span>
                              </span>
                            )}
                            {event.workPrice ? (
                              <span className="flex items-center gap-0.5 font-mono font-medium text-gray-700">
                                <IndianRupee className="w-3 h-3 text-gray-400" />
                                <span>{event.workPrice.toLocaleString('en-IN')}</span>
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {event.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openWhatsApp(event.phone!)}
                            className="h-8 text-xs gap-1 text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#2C8567]" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </Button>
                        )}
                        <Link href={`/clients/${event._id}`}>
                          <Button size="sm" variant="ghost" className="h-8 text-xs gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>

      {/* Day Details & Conflict Inspector Dialog */}
      <Dialog open={!!selectedDayDate} onOpenChange={(open) => !open && setSelectedDayDate(null)}>
        <DialogContent className="!w-[calc(100%-1.5rem)] sm:!w-full !max-w-lg !max-h-[85dvh] !p-0 !flex !flex-col !overflow-hidden rounded-2xl shadow-2xl border border-gray-100 bg-white">
          <DialogHeader className="sticky top-0 z-10 bg-white px-4 sm:px-6 py-3.5 border-b border-gray-100 flex flex-row items-center justify-between shrink-0">
            <div className="min-w-0 pr-2">
              <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {selectedDayDate &&
                  new Date(selectedDayDate).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 truncate">
                {selectedDayShoots.length === 0
                  ? 'No shoots scheduled on this day.'
                  : `${selectedDayShoots.length} shoot${
                      selectedDayShoots.length > 1 ? 's' : ''
                    } booked for this date.`}
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDayDate(null)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto modal-scroll p-4 sm:p-6 space-y-3">
            {/* Conflict Alert Banner if >= 2 shoots */}
            {selectedDayShoots.length >= 2 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">
                    Availability Conflict ({selectedDayShoots.length} Overlapping Shoots)
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    You have multiple clients booked on this exact date. Ensure separate photo/video crew members and gear sets are assigned.
                  </p>
                </div>
              </div>
            )}

            {/* Shoots Cards */}
            {selectedDayShoots.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                <p>This date is completely free!</p>
                <Button
                  onClick={() => {
                    const d = selectedDayDate;
                    setSelectedDayDate(null);
                    if (d) handleBookOnDate(d);
                  }}
                  size="sm"
                  className="mt-3 bg-[#2C8567] hover:bg-[#236d54] text-white text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Book Shoot on this Date
                </Button>
              </div>
            ) : (
              selectedDayShoots.map((shoot) => {
                const statusColor = shoot.status?.color || '#2C8567';
                return (
                  <div
                    key={shoot._id}
                    className="p-3 sm:p-3.5 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: statusColor }}
                        />
                        <h4 className="font-bold text-gray-900 text-sm">{shoot.name}</h4>
                      </div>
                      {shoot.status && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: `${statusColor}15`,
                            borderColor: `${statusColor}30`,
                            color: statusColor,
                          }}
                        >
                          {shoot.status.name}
                        </span>
                      )}
                    </div>

                    {/* Venue & Commercials */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                      {shoot.location && (
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{shoot.location}</span>
                        </div>
                      )}
                      {shoot.workPrice ? (
                        <div className="flex items-center gap-1 font-mono">
                          <IndianRupee className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>₹{shoot.workPrice.toLocaleString('en-IN')}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Requirements pills */}
                    {shoot.requirements && shoot.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {shoot.requirements.map((req) => (
                          <span
                            key={req}
                            className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                      {shoot.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWhatsApp(shoot.phone!)}
                          className="h-7 text-xs text-[#2C8567] border-emerald-200 hover:bg-emerald-50 px-2.5"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                      <Link
                        href={`/clients/${shoot._id}`}
                        onClick={() => setSelectedDayDate(null)}
                      >
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-gray-900 hover:bg-black text-white px-3"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Client
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-4 sm:px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedDayDate(null)}
              className="text-xs"
            >
              Close
            </Button>
            {selectedDayShoots.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const d = selectedDayDate;
                  setSelectedDayDate(null);
                  if (d) handleBookOnDate(d);
                }}
                className="text-xs bg-[#2C8567] hover:bg-[#236d54] text-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Shoot on This Day
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Add Client with pre-filled date */}
      <QuickAddClient
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={() => {
          fetchCalendar();
          setAddModalOpen(false);
        }}
      />
    </div>
  );
}
