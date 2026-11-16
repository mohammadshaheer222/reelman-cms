import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Status from '@/models/Status';
import Client from '@/models/Client';
import { requireAdmin } from '@/lib/apiMiddleware';
import { isValidObjectId, handleApiError } from '@/lib/apiError';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid status ID format' }, { status: 400 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const status = await Status.findByIdAndUpdate(id, body, { new: true });
    if (!status) return NextResponse.json({ error: 'Status not found' }, { status: 404 });
    return NextResponse.json({ data: status });
  } catch (err: unknown) {
    return handleApiError(err, 'Failed to update status');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid status ID format' }, { status: 400 });
  }

  try {
    await connectDB();
    const inUse = await Client.countDocuments({ status: id, isArchived: false });
    if (inUse > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${inUse} client(s) use this status. Reassign them first.` },
        { status: 409 }
      );
    }
    await Status.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Status deleted successfully' });
  } catch (err: unknown) {
    return handleApiError(err, 'Failed to delete status');
  }
}
