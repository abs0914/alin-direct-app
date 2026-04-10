/**
 * Supabase JWT authentication middleware for Fastify.
 *   1. Extract Bearer token
 *   2. Verify signature using Supabase JWKS (ES256) or JWT secret (HS256 fallback)
 *   3. Find or auto-provision a local User record keyed by supabase_id
 *   4. Attach the user to request.user
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { jwtVerify, createRemoteJWKSet, createSecretKey } from 'jose';
import { prisma } from '../server.js';

// Cache the JWKS keyset so we don't fetch it on every request
let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJWKS() {
  if (!_jwks) {
    const url = process.env.SUPABASE_URL;
    if (!url) throw new Error('SUPABASE_URL not set');
    _jwks = createRemoteJWKSet(new URL(`${url}/auth/v1/.well-known/jwks.json`));
  }
  return _jwks;
}

interface SupabaseClaims {
  sub: string;
  phone?: string;
  email?: string;
  exp?: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: bigint;
      supabaseId: string | null;
      name: string;
      phone: string | null;
      email: string | null;
      userType: string;
      isActive: boolean;
      branchId: bigint | null;
      expoPushToken: string | null;
    };
  }
}

export async function supabaseAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ message: 'Unauthenticated.' });
  }

  const token = authHeader.slice(7);
  const secret = process.env.SUPABASE_JWT_SECRET;

  if (!secret) {
    return reply.code(500).send({ message: 'Auth not configured.' });
  }

  let claims: SupabaseClaims;
  try {
    // Try JWKS first (ES256 — current Supabase default)
    const jwks = getJWKS();
    const { payload } = await jwtVerify(token, jwks);
    claims = payload as unknown as SupabaseClaims;
  } catch (jwksErr: any) {
    // Fallback: try HS256 with JWT secret (older Supabase projects)
    try {
      const secretBytes = new TextEncoder().encode(secret);
      const { payload } = await jwtVerify(token, secretBytes, { algorithms: ['HS256'] });
      claims = payload as unknown as SupabaseClaims;
    } catch (err: any) {
      const message =
        err?.code === 'ERR_JWT_EXPIRED' ? 'Token expired.' : 'Invalid token signature.';
      return reply.code(401).send({ message });
    }
  }

  const supabaseId = claims.sub;
  if (!supabaseId) {
    return reply.code(401).send({ message: 'Invalid token payload.' });
  }

  // Find or auto-provision local user
  let user = await prisma.user.findUnique({ where: { supabaseId } });

  if (!user) {
    const phone = claims.phone ?? null;
    const email = claims.email ?? null;
    user = await prisma.user.create({
      data: {
        supabaseId,
        name: phone ?? email ?? 'User',
        phone,
        email,
        userType: 'customer',
        phoneVerifiedAt: phone ? new Date() : null,
        emailVerifiedAt: email ? new Date() : null,
      },
    });
  }

  if (!user.isActive) {
    return reply.code(403).send({ message: 'Account deactivated.' });
  }

  request.user = user as any;
}
