import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Package from '@/models/Package';
import { requireAuth } from '@/lib/apiMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const pkg = await Package.findById(id).lean();
    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    return NextResponse.json({ data: pkg });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch package' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    delete body._id;
    delete body.__v;
    delete body.createdAt;
    delete body.updatedAt;

    const pkg = await Package.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, returnDocument: 'after' }
    ).lean();

    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    return NextResponse.json({ data: pkg });
  } catch (err: unknown) {
    console.error('Failed to update package:', err);
    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    await Package.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Package deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 });
  }
}
