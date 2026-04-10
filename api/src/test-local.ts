/**
 * Local deployment smoke test.
 * Generates a signed Supabase-style JWT with the local secret and exercises
 * every route family.  Run with: npx tsx src/test-local.ts
 */
import { SignJWT } from 'jose';

// ─── CONFIG ──────────────────────────────────────────────────────────────────

// Load .env manually (tsx doesn't auto-load it at runtime)
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env');
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const BASE      = `http://localhost:${process.env.PORT ?? 3001}`;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;
// Must be ≤36 chars to fit supabase_id VARCHAR(36) — use a valid UUID format
const FAKE_SUB  = '00000000-0000-0000-0000-000000000001';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

let passed = 0, failed = 0;

function log(ok: boolean, label: string, extra = '') {
  const icon = ok ? '✅' : '❌';
  console.log(`  ${icon}  ${label}${extra ? '  →  ' + extra : ''}`);
  ok ? passed++ : failed++;
}

async function req(method: string, path: string, opts: { token?: string; body?: object } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let json: any = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

async function makeJwt(sub = FAKE_SUB, phone = '+639991234567') {
  const key = new TextEncoder().encode(JWT_SECRET);
  return new SignJWT({ sub, phone, role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
}

// ─── TESTS ───────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n🧪  ALiN API — local smoke test  (${BASE})\n`);

  const token = await makeJwt();

  // ── 1. Health ─────────────────────────────────────────────────────────────
  console.log('── Health ──');
  {
    const r = await req('GET', '/api/health');
    log(r.status === 200 && r.json?.status === 'ok', 'GET /api/health', r.json?.status);
  }

  // ── 2. Auth guard ─────────────────────────────────────────────────────────
  console.log('\n── Auth guard ──');
  {
    const r = await req('GET', '/api/me');
    log(r.status === 401, 'GET /api/me without token → 401', `got ${r.status}`);
  }
  {
    const r = await req('GET', '/api/me', { token: 'bad.token.here' });
    log(r.status === 401, 'GET /api/me with invalid token → 401', `got ${r.status}`);
  }

  // ── 3. Public routes ──────────────────────────────────────────────────────
  console.log('\n── Public ──');
  {
    const r = await req('GET', '/verify/pai/NONEXISTENT-POLICY-XYZ');
    log(r.status === 404 && r.json?.valid === false, 'GET /verify/pai/NONEXISTENT → 404 + valid:false');
  }

  // ── 4. Me ─────────────────────────────────────────────────────────────────
  console.log('\n── /api/me ──');
  {
    const r = await req('GET', '/api/me', { token });
    log(r.status === 200 && r.json?.user !== undefined, 'GET /api/me → 200', `userType=${r.json?.user?.userType}`);
  }

  // ── 5. Customer — read-only ───────────────────────────────────────────────
  console.log('\n── /api/customer ──');
  {
    const r = await req('GET', '/api/customer/profile', { token });
    log(r.status === 200, 'GET /api/customer/profile → 200');
  }
  {
    const r = await req('GET', '/api/customer/bookings', { token });
    log(r.status === 200 && Array.isArray(r.json?.data), 'GET /api/customer/bookings → 200 with data[]');
  }
  {
    const r = await req('GET', '/api/customer/bookings/active', { token });
    log(r.status === 200, 'GET /api/customer/bookings/active → 200');
  }
  {
    const r = await req('POST', '/api/customer/estimate', { token, body: { package_size: 'box_1kg', box_type: 'own_box', service_type: 'intra' } });
    log(r.status === 200 && r.json?.flat_rate === 107, 'POST /api/customer/estimate box_1kg own_box intra → flat_rate=107', `rate=${r.json?.flat_rate}`);
  }
  {
    const r = await req('GET', '/api/customer/insurance', { token });
    log(r.status === 200, 'GET /api/customer/insurance → 200');
  }

  // ── 6. Support — conversations ────────────────────────────────────────────
  console.log('\n── /api/customer/support ──');
  {
    const r = await req('GET', '/api/customer/support/conversations', { token });
    log(r.status === 200 && Array.isArray(r.json), 'GET /support/conversations → 200 []');
  }

  // ── 7. Rider — profile reads ──────────────────────────────────────────────
  console.log('\n── /api/rider ──');
  {
    const r = await req('GET', '/api/rider/profile', { token });
    log(r.status === 200, 'GET /api/rider/profile → 200');
  }
  {
    const r = await req('GET', '/api/rider/jobs/active', { token });
    // 404 = no rider profile yet (expected for a fresh user)
    log(r.status === 200 || r.status === 404, `GET /api/rider/jobs/active → ${r.status} (200 or 404 ok)`);
  }
  {
    const r = await req('GET', '/api/rider/earnings', { token });
    log(r.status === 200 || r.status === 404, `GET /api/rider/earnings → ${r.status} (200 or 404 ok)`);
  }

  // ── 8. Non-existent route ─────────────────────────────────────────────────
  console.log('\n── Edge cases ──');
  {
    const r = await req('GET', '/api/customer/bookings/999999999');
    log(r.status === 401 || r.status === 404, `GET /bookings/999999999 → ${r.status} (401 or 404 ok)`);
  }

  // ─── SUMMARY ──────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(45)}`);
  console.log(`  Total: ${passed + failed}   ✅ ${passed} passed   ❌ ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => { console.error('Fatal:', e); process.exit(1); });

