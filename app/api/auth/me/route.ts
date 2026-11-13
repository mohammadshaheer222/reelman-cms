import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { requireAuth } from '@/lib/apiMiddleware';

export async function GET(request: NextRequest) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  try {
    if (!user?.userId || !mongoose.Types.ObjectId.isValid(user.userId)) {
      const response = NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
      response.cookies.delete('auth-token');
      return response;
    }

    await connectDB();
    const dbUser = await User.findById(user.userId).select('-passwordHash');
    if (!dbUser || !dbUser.isActive) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.cookies.delete('auth-token');
      return response;
    }
    return NextResponse.json({ user: dbUser });
  } catch (err: unknown) {
    console.error('API /api/auth/me error:', err);
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('Cast to ObjectId') || errMsg.includes('bad auth')) {
      const response = NextResponse.json({ error: 'Session invalid' }, { status: 401 });
      response.cookies.delete('auth-token');
      return response;
    }
    return NextResponse.json({ error: 'Failed to fetch user', details: errMsg }, { status: 500 });
  }
}

