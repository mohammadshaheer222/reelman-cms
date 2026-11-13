import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';
import Status from '@/models/Status';
import { DEFAULT_DELIVERABLE_MILESTONES, createDefaultInstallments } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await connectDB();
    const client = await Client.findById(id)
      .populate('status', 'name color')
      .lean();

    if (!client) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Ensure deliverables exist
    const deliverables =
      client.deliverables && client.deliverables.length > 0
        ? client.deliverables
        : DEFAULT_DELIVERABLE_MILESTONES;

    // Ensure installments exist
    const installments =
      client.installments && client.installments.length > 0
        ? client.installments
        : createDefaultInstallments(client.workPrice || 0, client.advancePaid || 0);

    const publicData = {
      _id: client._id,
      clientId: client.clientId,
      name: client.name || 'Valued Couple',
      date: client.date,
      dates: client.dates || (client.date ? [client.date] : []),
      location: client.location,
      requirements: client.requirements || [],
      packageDetails: client.packageDetails,
      workPrice: client.workPrice || 0,
      advancePaid: client.advancePaid || 0,
      paymentStatus: client.paymentStatus || 'unpaid',
      status: client.status,
      deliverables,
      installments,
      createdAt: client.createdAt,
    };

    return NextResponse.json({ data: publicData });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch booking details' }, { status: 500 });
  }
}
