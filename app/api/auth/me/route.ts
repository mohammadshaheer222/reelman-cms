import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { requireAuth } from '@/lib/apiMiddleware';

export async function GET(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  try {
    await connectDB();
    const dbUser = await User.findById(user!.userId).select('-passwordHash');
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user: dbUser });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

