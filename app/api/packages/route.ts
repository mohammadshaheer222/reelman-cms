import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Package from '@/models/Package';
import { requireAuth } from '@/lib/apiMiddleware';

export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const query = clientId ? { clientId } : {};

    const packages = await Package.find(query).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ data: packages });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  try {
    await connectDB();
    const body = await request.json();
    delete body._id;
    delete body.__v;
    if (!body.title) {
      return NextResponse.json({ error: 'Package title is required' }, { status: 400 });
    }
    const pkg = await Package.create({
      ...body,
      createdBy: user?.userId,
    });
    return NextResponse.json({ data: pkg }, { status: 201 });
  } catch (err: unknown) {
    console.error('Failed to create package:', err);
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
  }
}
