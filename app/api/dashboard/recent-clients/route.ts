import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Client from '@/models/Client';
import { requireAuth } from '@/lib/apiMiddleware';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;
  try {
    await connectDB();
    const clients = await Client.find({ isArchived: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('status', 'name color')
      .lean();
    return NextResponse.json({ data: clients });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch recent clients' }, { status: 500 });
  }
}

