/**
 * Admin API routes — read-only + action endpoints consumed by the React HQ admin panel.
 * Protected by Supabase JWT; RBAC checks are enforced via user.userType.
 */
import { FastifyInstance } from 'fastify';
import { supabaseAuth } from '../middleware/supabaseAuth.js';
import { prisma } from '../server.js';

function requireRole(roles: string[]) {
  return async (request: any, reply: any) => {
    if (!roles.includes(request.user.userType)) {
      return reply.code(403).send({ message: 'Forbidden.' });
    }
  };
}

const HQ_ROLES = ['admin', 'super_admin'];

export default async function adminRoutes(app: FastifyInstance) {
  app.addHook('onRequest', supabaseAuth);
  app.addHook('preHandler', requireRole(['admin', 'super_admin', 'branch_manager', 'dispatcher']));

  // ── Stats ─────────────────────────────────────────
  app.get('/stats', async (request) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [branches, riders, jobsToday, revenueAgg] = await Promise.all([
      prisma.branch.count({ where: { isActive: true, deletedAt: null } }),
      prisma.rider.count({ where: { status: 'approved', availability: { not: 'offline' }, deletedAt: null } }),
      prisma.deliveryJob.count({ where: { createdAt: { gte: today } } }),
      prisma.deliveryJob.aggregate({ _sum: { totalPrice: true }, where: { status: 'delivered', deliveredAt: { gte: today } } }),
    ]);
    return { total_branches: branches, total_riders: riders, total_jobs_today: jobsToday, total_revenue_today: Number(revenueAgg._sum.totalPrice ?? 0) };
  });

  // ── Branches ──────────────────────────────────────
  app.get('/branches', async () => {
    const data = await prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
    return { data };
  });

  app.get('/branches/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const branch = await prisma.branch.findUnique({ where: { id: BigInt(id) } });
    if (!branch) return reply.code(404).send({ message: 'Not found.' });
    return branch;
  });

  app.post('/branches', async (request, reply) => {
    const body = request.body as any;
    const branch = await prisma.branch.create({
      data: {
        name: body.name,
        code: body.code.toUpperCase(),
        type: body.type ?? 'branch',
        address: body.address ?? null,
        city: body.city ?? null,
        province: body.province ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        serviceRadiusKm: body.service_radius_km ?? 10,
        isActive: body.is_active ?? true,
      },
    });
    return reply.code(201).send(branch);
  });

  app.put('/branches/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const branch = await prisma.branch.update({
      where: { id: BigInt(id) },
      data: {
        name: body.name,
        type: body.type,
        address: body.address,
        city: body.city,
        province: body.province,
        phone: body.phone,
        email: body.email,
        serviceRadiusKm: body.service_radius_km,
        isActive: body.is_active,
      },
    });
    return branch;
  });

  // ── Riders ────────────────────────────────────────
  app.get('/riders', async () => {
    const data = await prisma.rider.findMany({
      where: { deletedAt: null },
      include: { user: true, branch: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  });

  // ── Customers ─────────────────────────────────────
  app.get('/customers', async () => {
    const data = await prisma.customer.findMany({
      where: { deletedAt: null },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  });

  // ── Delivery Jobs ─────────────────────────────────
  app.get('/jobs', async (request) => {
    const qs = request.query as any;
    const take = 50;
    const data = await prisma.deliveryJob.findMany({
      where: { deletedAt: null },
      include: { branch: true, rider: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return { data };
  });

  // ── Users ─────────────────────────────────────────
  app.get('/users', async () => {
    const data = await prisma.user.findMany({
      where: { deletedAt: null, userType: { in: ['admin', 'branch_manager', 'dispatcher', 'super_admin'] } },
      include: { branch: true },
      orderBy: { name: 'asc' },
    });
    return { data };
  });

  // ── Payments ──────────────────────────────────────
  app.get('/payments', async () => {
    const data = await prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return { data };
  });

  // ── Payouts ───────────────────────────────────────
  app.get('/payouts', async () => {
    const data = await prisma.payoutRequest.findMany({
      include: { rider: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { data };
  });

  app.post('/payouts/:id/approve', async (request, reply) => {
    const { id } = request.params as { id: string };
    const payout = await prisma.payoutRequest.update({
      where: { id: BigInt(id) },
      data: { status: 'approved', approvedBy: request.user.id, approvedAt: new Date() },
    });
    return payout;
  });

  // ── Support ───────────────────────────────────────
  app.get('/support', async () => {
    const data = await prisma.supportConversation.findMany({
      include: { user: true },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });
    return { data };
  });

  // ── Knowledge Base ────────────────────────────────
  app.get('/knowledge', async () => {
    const data = await prisma.knowledgeArticle.findMany({ orderBy: { createdAt: 'desc' } });
    return { data };
  });

  app.put('/knowledge/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    return prisma.knowledgeArticle.update({ where: { id: BigInt(id) }, data: { isActive: body.is_active } });
  });
}
