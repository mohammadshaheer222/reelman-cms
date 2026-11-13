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
    const statuses = await Status.find({ name: { $in: ['Active', 'Pending', 'New'] } })
      .select('_id name')
      .lean();

    const activeStatus = statuses.find((s) => s.name === 'Active');
    const pendingStatus = statuses.find((s) => s.name === 'Pending');
    const newStatus = statuses.find((s) => s.name === 'New');

    const [
      totalClients,
      activeClients,
      pendingClients,
      newClients,
      archivedClients,
      revenueAgg,
    ] = await Promise.all([
      Client.countDocuments({ isArchived: false }),
      activeStatus ? Client.countDocuments({ status: activeStatus._id, isArchived: false }) : 0,
      pendingStatus ? Client.countDocuments({ status: pendingStatus._id, isArchived: false }) : 0,
      newStatus ? Client.countDocuments({ status: newStatus._id, isArchived: false }) : 0,
      Client.countDocuments({ isArchived: true }),
      Client.aggregate([
        { $match: { isArchived: false } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$workPrice' },
            totalAdvance: { $sum: '$advancePaid' },
          },
        },
      ]),
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const totalAdvance = revenueAgg[0]?.totalAdvance || 0;
    const pendingPayments = Math.max(0, totalRevenue - totalAdvance);

    return NextResponse.json({
      totalClients,
      activeClients,
      pendingClients,
      newClients,
      archivedClients,
      completedProjects: 0,
      cancelledProjects: 0,
      upcomingEvents: 0,
      totalRevenue,
      totalAdvance,
      pendingPayments,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
