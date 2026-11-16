import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { handleApiError } from '@/lib/apiError';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  // Rate limit: 8 login attempts per 10 minutes per IP to block brute-force
  const rateLimit = checkRateLimit(request, {
    windowMs: 10 * 60 * 1000,
    max: 8,
    message: 'Too many login attempts. Please wait 10 minutes before trying again.',
    keyPrefix: 'login',
  });

  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    await connectDB();
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const { password } = parsed.data;

    const user = await User.findOne({ email, isActive: true });
    if (!user || !(await user.comparePassword(password))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      allowedNavItems: user.allowedNavItems,
    });

    const response = NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        allowedNavItems: user.allowedNavItems,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    return handleApiError(err, 'Login request could not be processed');
  }
}
