'use client';

import { ShootCalendar } from '@/components/calendar/ShootCalendar';

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Shoot Calendar & Availability
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor your shooting schedule, inspect double-booking conflicts, and schedule crew availability.
        </p>
      </div>

      {/* Calendar Component */}
      <ShootCalendar />
    </div>
  );
}
