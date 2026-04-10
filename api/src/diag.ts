import { SignJWT } from 'jose';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env');
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const BASE = `http://localhost:${process.env.PORT ?? 3001}`;
const key = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

const token = await new SignJWT({ sub: 'test-diag-aaa', phone: '+639990000099', role: 'authenticated' })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('1h')
  .sign(key);

const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

async function hit(method: string, path: string, body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method, headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  console.log(`\n${method} ${path}  →  ${res.status}`);
  try { console.log(JSON.stringify(JSON.parse(text), null, 2)); }
  catch { console.log(text); }
}

await hit('GET', '/api/me');
await hit('GET', '/api/customer/profile');
await hit('GET', '/api/customer/bookings');
await hit('POST', '/api/customer/estimate', { package_size: 'box_1kg', box_type: 'own_box', service_type: 'intra' });
await hit('GET', '/api/customer/support/conversations');
await hit('GET', '/api/rider/profile');
await hit('GET', '/api/rider/jobs/active');
await hit('GET', '/api/rider/earnings');

