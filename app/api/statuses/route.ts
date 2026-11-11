import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Status from '@/models/Status';
import { requireAuth, requireAdmin } from '@/lib/apiMiddleware';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;
  try {
    await connectDB();
    const statuses = await Status.find({ isActive: true }).sort({ order: 1 }).lean();
    return NextResponse.json({ data: statuses });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch statuses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  try {
    await connectDB();
    const body = await request.json();
    const count = await Status.countDocuments();
    const status = await Status.create({
      ...body,
      whatsappMessage: body.whatsappMessage ? body.whatsappMessage.trim() : '',
      order: count + 1,
    });
    return NextResponse.json({ data: status }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create status' }, { status: 500 });
  }
}

