import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';
import Status from '@/models/Status';
import { DEFAULT_DELIVERABLE_MILESTONES, createDefaultInstallments } from '@/types';
import { isValidObjectId, handleApiError } from '@/lib/apiError';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit public portal views: max 60 requests per minute
  const rateLimit = checkRateLimit(request, {
    windowMs: 60 * 1000,
    max: 60,
    message: 'Too many requests to client portal',
    keyPrefix: 'portal',
  });
  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

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
  } catch (err: unknown) {
    return handleApiError(err, 'Failed to fetch booking details');
  }
}
