/**
 * Database seed — idempotent (safe to re-run).
 * Seeds: Branches, Service Categories, Services, Knowledge Articles.
 * Run with: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';

// Patch BigInt serialization so console.log works cleanly
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

const prisma = new PrismaClient();

// ─── BRANCHES ────────────────────────────────────────────────────────────────

const branches = [
  {
    code: 'HQ-MNL',
    name: 'ALiN HQ — Manila',
    type: 'hub',
    address: '1234 Espana Blvd, Sampaloc, Manila',
    city: 'Manila',
    province: 'Metro Manila',
    lat: 14.6091,
    lng: 120.9894,
    phone: '+63 2 8123 4567',
    email: 'hq@alincargo.com',
    isActive: true,
    operatingHours: { mon_fri: '08:00-20:00', sat: '09:00-18:00', sun: 'closed' },
  },
  {
    code: 'BR-QC',
    name: 'ALiN Branch — Quezon City',
    type: 'branch',
    address: '56 Timog Ave, Quezon City',
    city: 'Quezon City',
    province: 'Metro Manila',
    lat: 14.6349,
    lng: 121.0437,
    phone: '+63 2 8234 5678',
    email: 'qc@alincargo.com',
    isActive: true,
    operatingHours: { mon_sat: '08:00-19:00', sun: 'closed' },
  },
  {
    code: 'BR-CGY',
    name: 'ALiN Branch — Cagayan de Oro',
    type: 'branch',
    address: '78 Corrales Ave, Cagayan de Oro',
    city: 'Cagayan de Oro',
    province: 'Misamis Oriental',
    lat: 8.4542,
    lng: 124.6319,
    phone: '+63 88 123 4567',
    email: 'cdo@alincargo.com',
    isActive: true,
    operatingHours: { mon_sat: '08:00-18:00', sun: 'closed' },
  },
  {
    code: 'SAT-MKT',
    name: 'ALiN Satellite — Makati',
    type: 'satellite',
    address: 'G/F Ayala Ave corner Paseo de Roxas, Makati',
    city: 'Makati',
    province: 'Metro Manila',
    lat: 14.5547,
    lng: 121.0244,
    phone: '+63 2 8345 6789',
    email: 'makati@alincargo.com',
    isActive: true,
    operatingHours: { mon_fri: '09:00-18:00', sat: '09:00-14:00', sun: 'closed' },
  },
];

// ─── SERVICE CATEGORIES ───────────────────────────────────────────────────────

const serviceCategories = [
  { slug: 'cargo-delivery', name: 'Cargo Delivery', icon: 'truck', color: '#E85D04', sortOrder: 1 },
  { slug: 'insurance',      name: 'Insurance',      icon: 'shield', color: '#2D6A4F', sortOrder: 2 },
  { slug: 'other-services', name: 'Other Services', icon: 'plus-circle', color: '#6B7280', sortOrder: 3 },
];

// ─── SERVICES ─────────────────────────────────────────────────────────────────

const services = [
  // Cargo Delivery
  { slug: 'delivery-motorcycle', name: 'Motorcycle Delivery',  categorySlug: 'cargo-delivery', sortOrder: 1 },
  { slug: 'delivery-mpv',        name: 'MPV / Van Delivery',   categorySlug: 'cargo-delivery', sortOrder: 2 },
  { slug: 'delivery-truck',      name: 'Truck Delivery',       categorySlug: 'cargo-delivery', sortOrder: 3 },
  // Insurance
  { slug: 'insurance-pa',        name: 'Personal Accident Insurance', categorySlug: 'insurance', sortOrder: 1 },
  { slug: 'insurance-st-peter',  name: 'St. Peter Life Plan',         categorySlug: 'insurance', sortOrder: 2 },
  // Other
  { slug: 'other-misc',          name: 'Miscellaneous',        categorySlug: 'other-services', sortOrder: 1 },
];

// ─── KNOWLEDGE ARTICLES ───────────────────────────────────────────────────────

const knowledgeArticles = [
  {
    title: 'How do I track my delivery?',
    category: 'tracking',
    content: 'You can track your delivery in real time through the ALiN app. Once a rider is assigned, tap "Track" on your active booking to see their live location on the map.',
    tags: ['tracking', 'live', 'map'],
  },
  {
    title: 'How is the delivery rate calculated?',
    category: 'pricing',
    content: 'Rates are based on package size and service type (intra-city vs cross-city). Box sizes range from 1 kg to XL. You can get an instant estimate on the Booking screen before confirming.',
    tags: ['pricing', 'rate', 'estimate'],
  },
  {
    title: 'What is your cancellation policy?',
    category: 'policy',
    content: 'You may cancel a booking for free while it is still in "Pending" or "Broadcasting" status. Once a rider has accepted the job, cancellation may incur a small fee.',
    tags: ['cancel', 'policy', 'refund'],
  },
  {
    title: 'How do I update my account details?',
    category: 'account',
    content: 'Go to Profile → Edit Profile in the app to update your name, email, or default delivery address. For phone number changes, please contact support.',
    tags: ['account', 'profile', 'update'],
  },
  {
    title: 'My package was damaged. What do I do?',
    category: 'complaint',
    content: 'We\'re sorry to hear that! Please take photos of the damage and file a complaint through Support → New Message. Include your tracking number and our team will respond within 30 minutes.',
    tags: ['damage', 'complaint', 'claim'],
  },
  {
    title: 'What payment methods are accepted?',
    category: 'pricing',
    content: 'We accept Maya online payment (credit/debit card & e-wallet) and Cash on Delivery (COD). Payment method is selected at the time of booking.',
    tags: ['payment', 'maya', 'cod'],
  },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Starting seed...\n');

  // Branches
  console.log('📍  Seeding branches...');
  for (const b of branches) {
    const { lat, lng, ...rest } = b;
    await prisma.branch.upsert({
      where: { code: rest.code },
      update: rest,
      create: { ...rest, lat, lng },
    });
    console.log(`    ✓ ${b.code} — ${b.name}`);
  }

  // Service categories
  console.log('\n🗂   Seeding service categories...');
  for (const sc of serviceCategories) {
    await prisma.serviceCategory.upsert({
      where: { slug: sc.slug },
      update: sc,
      create: sc,
    });
    console.log(`    ✓ ${sc.slug}`);
  }

  // Services — need category ID so fetch after upsert
  console.log('\n🛠   Seeding services...');
  for (const s of services) {
    const category = await prisma.serviceCategory.findUniqueOrThrow({ where: { slug: s.categorySlug } });
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: { name: s.name, sortOrder: s.sortOrder, serviceCategoryId: category.id },
      create: { slug: s.slug, name: s.name, sortOrder: s.sortOrder, serviceCategoryId: category.id },
    });
    console.log(`    ✓ ${s.slug}`);
  }

  // Knowledge articles — no unique slug, so only insert if table is empty
  console.log('\n📚  Seeding knowledge articles...');
  const existing = await prisma.knowledgeArticle.count();
  if (existing === 0) {
    await prisma.knowledgeArticle.createMany({
      data: knowledgeArticles.map((a) => ({ ...a, tags: a.tags })),
    });
    console.log(`    ✓ ${knowledgeArticles.length} articles created`);
  } else {
    console.log(`    ⏭  ${existing} articles already exist — skipping`);
  }

  console.log('\n✅  Seed complete!');
}

main()
  .catch((e) => { console.error('❌  Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

