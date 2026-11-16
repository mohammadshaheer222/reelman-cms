import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { requireAdmin } from '@/lib/apiMiddleware';
import { isValidObjectId, handleApiError } from '@/lib/apiError';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user: authUser } = await requireAdmin(request);
  if (error) return error;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
  }

  try {
    await connectDB();
    const body = await request.json();

    // Security: Disallow tampering with sensitive fields through general update
    delete body.passwordHash;
    delete body.password;
    delete body._id;
    delete body.__v;

    // Prevent last admin from demoting themselves
    if (authUser?.userId === id && body.role && body.role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the sole administrator of the organization' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, body, { new: true }).select('-passwordHash');
    if (!updatedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ data: updatedUser });
  } catch (err: unknown) {
    return handleApiError(err, 'Failed to update user');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user: authUser } = await requireAdmin(request);
  if (error) return error;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
  }

  if (authUser!.userId === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  try {
    await connectDB();
    // Prevent deleting the last admin
    const targetUser = await User.findById(id);
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (targetUser.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the only administrator account' },
          { status: 400 }
        );
      }
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (err: unknown) {
    return handleApiError(err, 'Failed to delete user');
  }
}
