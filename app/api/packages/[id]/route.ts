import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Package from '@/models/Package';
import { requireAuth } from '@/lib/apiMiddleware';
import { isValidObjectId, handleApiError } from '@/lib/apiError';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid package ID format' }, { status: 400 });
  }

  try {
    await connectDB();
    const pkg = await Package.findById(id).lean();
    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    return NextResponse.json({ data: pkg });
  } catch (err: unknown) {
    return handleApiError(err, 'Failed to fetch package');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid package ID format' }, { status: 400 });
  }

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
    return handleApiError(err, 'Failed to update package');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid package ID format' }, { status: 400 });
  }

  try {
    await connectDB();
    const pkg = await Package.findByIdAndDelete(id);
    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    return NextResponse.json({ message: 'Package deleted' });
  } catch (err: unknown) {
    return handleApiError(err, 'Failed to delete package');
  }
}
