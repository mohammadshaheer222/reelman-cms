import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';
import Status from '@/models/Status';
import { requireAuth } from '@/lib/apiMiddleware';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;
  try {
    await connectDB();
    const [activeStatus, pendingStatus, newStatus] = await Promise.all([
      Status.findOne({ name: 'Active' }),
      Status.findOne({ name: 'Pending' }),
      Status.findOne({ name: 'New' }),
    ]);

    const [
      totalClients,
      activeClients,
      pendingClients,
      newClients,
      archivedClients,
    ] = await Promise.all([
      Client.countDocuments({ isArchived: false }),
      activeStatus ? Client.countDocuments({ status: activeStatus._id, isArchived: false }) : 0,
      pendingStatus ? Client.countDocuments({ status: pendingStatus._id, isArchived: false }) : 0,
      newStatus ? Client.countDocuments({ status: newStatus._id, isArchived: false }) : 0,
      Client.countDocuments({ isArchived: true }),
    ]);

    return NextResponse.json({
      totalClients,
      activeClients,
      pendingClients,
      newClients,
      archivedClients,
      completedProjects: 0,
      cancelledProjects: 0,
      upcomingEvents: 0,
      totalRevenue: 0,
      pendingPayments: 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
