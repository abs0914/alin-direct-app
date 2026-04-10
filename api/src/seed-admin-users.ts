/**
 * Seed admin & branch manager accounts.
 * Creates the user in Supabase Auth then inserts/updates the User row in the DB.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in api/.env
 * Run with:  npm run seed:admins
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually (tsx doesn't use dotenv by default)
for (const line of readFileSync(resolve(process.cwd(), '.env'), 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const SUPABASE_URL       = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SERVICE_ROLE_KEY) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY is missing from api/.env');
  console.error('   Get it from: Supabase Dashboard → Settings → API → service_role (secret)');
  process.exit(1);
}

const prisma = new PrismaClient();
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

// ── Accounts to create ──────────────────────────────────────────────────────
const accounts = [
  {
    email:      'admin@alinmove.com',
    password:   'Admin@ALiN2024!',
    name:       'ALiN HQ Admin',
    userType:   'admin',
    branchCode: 'HQ-MNL',
  },
  {
    email:      'manager@alinmove.com',
    password:   'Manager@ALiN2024!',
    name:       'Branch Manager',
    userType:   'branch_manager',
    branchCode: 'BR-QC',
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

async function supabaseAdminFetch(path: string, body: object) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function getSupabaseUserId(email: string): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    {
      headers: {
        'apikey':        SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  if (!res.ok) return null;
  const data: any = await res.json();
  const users = data.users ?? [];
  return users.find((u: any) => u.email === email)?.id ?? null;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('👤  Seeding admin users...\n');

  for (const acct of accounts) {
    console.log(`  → ${acct.email} (${acct.userType})`);

    // 1. Find or create Supabase Auth user
    let supabaseId = await getSupabaseUserId(acct.email);

    if (supabaseId) {
      console.log(`     ℹ️  Auth user already exists  (${supabaseId})`);
    } else {
      const { status, data } = await supabaseAdminFetch('users', {
        email:            acct.email,
        password:         acct.password,
        email_confirm:    true,          // skip email confirmation
      });

      if (status !== 200 && status !== 201) {
        console.error(`     ❌  Failed to create auth user: ${JSON.stringify(data)}`);
        continue;
      }
      supabaseId = data.id;
      console.log(`     ✅  Auth user created  (${supabaseId})`);
    }

    // 2. Resolve branch
    const branch = await prisma.branch.findUnique({ where: { code: acct.branchCode } });
    if (!branch) {
      console.error(`     ❌  Branch not found: ${acct.branchCode} — run npm run db:seed first`);
      continue;
    }

    // 3. Upsert User row
    await prisma.user.upsert({
      where:  { supabaseId },
      update: { name: acct.name, email: acct.email, userType: acct.userType, branchId: branch.id, isActive: true },
      create: {
        supabaseId,
        name:     acct.name,
        email:    acct.email,
        userType: acct.userType,
        branchId: branch.id,
        isActive: true,
      },
    });
    console.log(`     ✅  DB user row upserted  (type=${acct.userType}, branch=${acct.branchCode})\n`);
  }

  console.log('✅  Done!\n');
  console.log('  HQ Admin      →  admin@alinmove.com     /  Admin@ALiN2024!');
  console.log('  Branch Mgr    →  manager@alinmove.com   /  Manager@ALiN2024!\n');
}

main()
  .catch((e) => { console.error('❌  Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

