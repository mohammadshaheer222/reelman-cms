import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';
import { requireAuth } from '@/lib/apiMiddleware';

export interface CalendarShootEvent {
  _id: string;
  clientId: string;
  name: string;
  phone?: string;
  date: string;
  dates: string[];
  location?: string;
  requirements?: string[];
  workPrice?: number;
  advancePaid?: number;
  paymentStatus?: string;
  packageDetails?: string;
  status?: {
    _id: string;
    name: string;
    color: string;
  };
}

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // e.g. "2026-11"
    const targetDate = searchParams.get('date'); // e.g. "2026-11-21"

    const clients = await Client.find({
      isArchived: false,
      $or: [
        { date: { $exists: true, $nin: ['', null] } },
        { 'dates.0': { $exists: true, $nin: ['', null] } },
      ],
    })
      .populate('status', 'name color')
      .lean();

    const dateMap: Record<string, CalendarShootEvent[]> = {};
    const events: CalendarShootEvent[] = [];

    for (const c of clients) {
      // Gather all distinct dates for this client
      const allDates = new Set<string>();
      if (c.date && typeof c.date === 'string' && c.date.trim()) {
        allDates.add(c.date.trim());
      }
      if (Array.isArray(c.dates)) {
        for (const d of c.dates) {
          if (d && typeof d === 'string' && d.trim()) {
            allDates.add(d.trim());
          }
        }
      }

      const shootEvent: CalendarShootEvent = {
        _id: String(c._id),
        clientId: c.clientId || String(c._id),
        name: c.name || 'Unnamed Client',
        phone: c.phone || '',
        date: c.date || Array.from(allDates)[0] || '',
        dates: Array.from(allDates),
        location: c.location || '',
        requirements: c.requirements || [],
        workPrice: c.workPrice || 0,
        advancePaid: c.advancePaid || 0,
        paymentStatus: c.paymentStatus || 'unpaid',
        packageDetails: c.packageDetails || '',
        status: c.status as unknown as { _id: string; name: string; color: string } | undefined,
      };

      events.push(shootEvent);

      for (const d of allDates) {
        if (!dateMap[d]) dateMap[d] = [];
        // Avoid duplicate client in the same date
        if (!dateMap[d].some((item) => item._id === shootEvent._id)) {
          dateMap[d].push(shootEvent);
        }
      }
    }

    // Identify conflicts (dates with 2 or more shoots)
    const conflicts: Record<string, CalendarShootEvent[]> = {};
    let conflictDaysCount = 0;
    for (const [dateKey, list] of Object.entries(dateMap)) {
      if (list.length >= 2) {
        conflicts[dateKey] = list;
        conflictDaysCount++;
      }
    }

    // If querying a single date for quick availability check
    if (targetDate) {
      const dateShoots = dateMap[targetDate] || [];
      return NextResponse.json({
        success: true,
        date: targetDate,
        hasConflict: dateShoots.length >= 1,
        conflictCount: dateShoots.length,
        shoots: dateShoots,
      });
    }

    // Filter by month if requested
    let filteredEvents = events;
    if (month) {
      filteredEvents = events.filter((e) =>
        e.dates.some((d) => d.startsWith(month))
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingEvents = events
      .filter((e) => e.dates.some((d) => d >= todayStr))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalRevenue = events.reduce((sum, e) => sum + (e.workPrice || 0), 0);

    return NextResponse.json({
      success: true,
      events: filteredEvents,
      dateMap,
      conflicts,
      stats: {
        totalEvents: events.length,
        conflictDaysCount,
        totalRevenue,
        upcomingCount: upcomingEvents.length,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch calendar';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
