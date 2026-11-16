import { SignJWT, jwtVerify } from 'jose';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        'CRITICAL SECURITY WARNING: JWT_SECRET environment variable is not set! Using dev fallback.'
      );
    }
    return new TextEncoder().encode('reelman-studio-fallback-secret-development-key');
  }
  return new TextEncoder().encode(secret);
};

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  allowedNavItems?: string[];
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}


