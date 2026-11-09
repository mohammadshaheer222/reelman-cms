import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { requireAdmin } from '@/lib/apiMiddleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    // Don't allow password changes via this route
    delete body.passwordHash;
    const user = await User.findByIdAndUpdate(id, body, { new: true }).select('-passwordHash');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ data: user });
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user: authUser } = await requireAdmin(request);
  if (error) return error;
  const { id } = await params;
  if (authUser!.userId === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }
  try {
    await connectDB();
    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: 'User deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

