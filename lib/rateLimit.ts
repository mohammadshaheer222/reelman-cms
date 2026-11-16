import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Cleanup stale records every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (record.resetTime <= now) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  windowMs: number; // Window duration in milliseconds
  max: number; // Max allowed requests per window
  message?: string;
  keyPrefix?: string;
}

export function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; response?: NextResponse } {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyPrefix = 'general',
  } = options;

  // Extract client IP address securely
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1';

  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || record.resetTime <= now) {
    memoryStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  record.count += 1;

  if (record.count > max) {
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
    const response = NextResponse.json(
      {
        error: message,
        code: 'RATE_LIMITED',
        retryAfter: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
        },
      }
    );
    return { allowed: false, remaining: 0, response };
  }

  return { allowed: true, remaining: max - record.count };
}
