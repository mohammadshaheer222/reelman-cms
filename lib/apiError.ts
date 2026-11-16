import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export function isValidObjectId(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
}

export function handleApiError(
  err: unknown,
  fallbackMessage = 'An unexpected server error occurred'
): NextResponse {
  console.error('[API Error Caught]:', err);

  if (err instanceof Error) {
    if (err.name === 'CastError' || err.message.includes('Cast to ObjectId')) {
      return NextResponse.json(
        { error: 'Invalid resource identifier format', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    if (err.name === 'ValidationError') {
      return NextResponse.json(
        { error: err.message, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: 'A record with this unique identifier already exists', code: 'DUPLICATE_ENTRY' },
        { status: 409 }
      );
    }
  }

  // Prevent leaking internal stack traces or database connection strings
  const safeMessage =
    process.env.NODE_ENV === 'production'
      ? fallbackMessage
      : err instanceof Error
      ? err.message
      : fallbackMessage;

  return NextResponse.json(
    { error: safeMessage, code: 'INTERNAL_SERVER_ERROR' },
    { status: 500 }
  );
}
