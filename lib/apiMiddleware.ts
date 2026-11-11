import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from './auth';

export async function requireAuth(
  request: NextRequest
): Promise<{ error: NextResponse | null; user: TokenPayload | null }> {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      user: null,
    };
  }
  const user = await verifyToken(token);
  if (!user) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    response.cookies.delete('auth-token');
    return {
      error: response,
      user: null,
    };
  }
  return { error: null, user };
}

export async function requireAdmin(
  request: NextRequest
): Promise<{ error: NextResponse | null; user: TokenPayload | null }> {
  const { error, user } = await requireAuth(request);
  if (error) return { error, user: null };
  if (user?.role !== 'admin') {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      ),
      user: null,
    };
  }
  return { error: null, user };
}

export function errorResponse(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

