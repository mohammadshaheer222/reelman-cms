import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Requirement from '@/models/Requirement';
import { requireAuth } from '@/lib/apiMiddleware';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const deleted = await Requirement.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Requirement not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Requirement deleted' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error deleting requirement';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
