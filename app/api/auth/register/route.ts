import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { handleApiError } from '@/lib/apiError';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export async function POST(request: NextRequest) {
  // Rate limit: 5 registration requests per hour per IP
  const rateLimit = checkRateLimit(request, {
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many account registrations. Please try again later.',
    keyPrefix: 'register',
  });

  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    await connectDB();
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const name = parsed.data.name.trim();
    const email = parsed.data.email.toLowerCase().trim();
    const { password } = parsed.data;

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const userCount = await User.countDocuments();
    // Security: Only the very first user is granted 'admin'. All subsequent public registrations are strictly 'staff'.
    const assignedRole = userCount === 0 ? 'admin' : 'staff';

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: assignedRole,
    });

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      allowedNavItems: user.allowedNavItems,
    });

    const response = NextResponse.json(
      { user: { _id: user._id, name: user.name, email: user.email, role: user.role } },
      { status: 201 }
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    return handleApiError(err, 'Registration could not be completed');
  }
}
