/**
 * Branch admin API routes — consumed by the React Branch portal.
 * Scoped to the user's assigned branch.
 */
import { FastifyInstance } from 'fastify';
import { supabaseAuth } from '../middleware/supabaseAuth.js';
import { prisma } from '../server.js';
import { randomUUID } from 'crypto';

export default async function branchAdminRoutes(app: FastifyInstance) {
  app.addHook('onRequest', supabaseAuth);

  function getBranchId(request: any) {
    if (!request.user.branchId) throw { statusCode: 403, message: 'No branch assigned.' };
    return request.user.branchId;
  }

  function today() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // ── Stats ─────────────────────────────────────────
  app.get('/stats', async (request) => {
    const branchId = getBranchId(request);
    const [activeRiders, jobsToday, pendingJobs, revenueAgg] = await Promise.all([
      prisma.rider.count({ where: { branchId, availability: { not: 'offline' }, deletedAt: null } }),
      prisma.deliveryJob.count({ where: { branchId, createdAt: { gte: today() }, deletedAt: null } }),
      prisma.deliveryJob.count({ where: { branchId, status: { in: ['pending', 'broadcasting'] }, deletedAt: null } }),
      prisma.deliveryJob.aggregate({ _sum: { totalPrice: true }, where: { branchId, status: 'delivered', deliveredAt: { gte: today() } } }),
    ]);
    return {
      active_riders: activeRiders,
      jobs_today: jobsToday,
      pending_jobs: pendingJobs,
      revenue_today: Number(revenueAgg._sum.totalPrice ?? 0),
    };
  });

  // ── Daily Summary ──────────────────────────────────
  app.get('/daily-summary', async (request) => {
    const branchId = getBranchId(request);
    const dayStart = today();

    const [salesAgg, salesCount, expenseAgg, expenseCount, jobCounts, cashSales, digitalSales, cashExpenses, digitalExpenses, closing] =
      await Promise.all([
        prisma.salesTransaction.aggregate({ _sum: { amount: true }, where: { branchId, createdAt: { gte: dayStart }, deletedAt: null } }),
        prisma.salesTransaction.count({ where: { branchId, createdAt: { gte: dayStart }, deletedAt: null } }),
        prisma.expense.aggregate({ _sum: { amount: true }, where: { branchId, createdAt: { gte: dayStart }, deletedAt: null } }),
        prisma.expense.count({ where: { branchId, createdAt: { gte: dayStart }, deletedAt: null } }),
        prisma.deliveryJob.groupBy({ by: ['status'], where: { branchId, createdAt: { gte: dayStart }, deletedAt: null }, _count: { id: true } }),
        prisma.salesTransaction.aggregate({ _sum: { amount: true }, where: { branchId, paymentMethod: { in: ['cash', 'cod'] }, createdAt: { gte: dayStart }, deletedAt: null } }),
        prisma.salesTransaction.aggregate({ _sum: { amount: true }, where: { branchId, paymentMethod: { notIn: ['cash', 'cod'] }, createdAt: { gte: dayStart }, deletedAt: null } }),
        prisma.expense.aggregate({ _sum: { amount: true }, where: { branchId, paymentMethod: { in: ['cash'] }, createdAt: { gte: dayStart }, deletedAt: null } }),
        prisma.expense.aggregate({ _sum: { amount: true }, where: { branchId, paymentMethod: { not: 'cash' }, createdAt: { gte: dayStart }, deletedAt: null } }),
        prisma.dailyClosing.findFirst({ where: { branchId, businessDate: dayStart } }),
      ]);

    const jobStatusMap: Record<string, number> = {};
    for (const g of jobCounts) jobStatusMap[g.status] = g._count.id;

    return {
      sales_total: Number(salesAgg._sum.amount ?? 0),
      sales_count: salesCount,
      expense_total: Number(expenseAgg._sum.amount ?? 0),
      expense_count: expenseCount,
      cash_sales: Number(cashSales._sum.amount ?? 0),
      digital_sales: Number(digitalSales._sum.amount ?? 0),
      cash_expenses: Number(cashExpenses._sum.amount ?? 0),
      digital_expenses: Number(digitalExpenses._sum.amount ?? 0),
      net: Number(salesAgg._sum.amount ?? 0) - Number(expenseAgg._sum.amount ?? 0),
      jobs: {
        total: Object.values(jobStatusMap).reduce((a, b) => a + b, 0),
        pending: jobStatusMap['pending'] ?? 0,
        broadcasting: jobStatusMap['broadcasting'] ?? 0,
        in_transit: jobStatusMap['in_transit'] ?? 0,
        delivered: jobStatusMap['delivered'] ?? 0,
        failed: jobStatusMap['failed'] ?? 0,
        cancelled: jobStatusMap['cancelled'] ?? 0,
      },
      closing_status: closing?.status ?? 'none',
      closing_id: closing?.id?.toString() ?? null,
    };
  });

  // ── Daily Closing ──────────────────────────────────
  app.get('/daily-closing/today', async (request) => {
    const branchId = getBranchId(request);
    const closing = await prisma.dailyClosing.findFirst({
      where: { branchId, businessDate: today() },
      include: { closedBy: true },
    });
    return { closing };
  });

  app.post('/daily-closing', async (request, reply) => {
    const branchId = getBranchId(request);
    const body = request.body as any;
    const dayStart = today();

    // Calculate totals from today's records
    const [cashSales, digitalSales, cashExp, digitalExp] = await Promise.all([
      prisma.salesTransaction.aggregate({ _sum: { amount: true }, where: { branchId, paymentMethod: { in: ['cash', 'cod'] }, createdAt: { gte: dayStart }, deletedAt: null } }),
      prisma.salesTransaction.aggregate({ _sum: { amount: true }, where: { branchId, paymentMethod: { notIn: ['cash', 'cod'] }, createdAt: { gte: dayStart }, deletedAt: null } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { branchId, paymentMethod: 'cash', createdAt: { gte: dayStart }, deletedAt: null } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { branchId, paymentMethod: { not: 'cash' }, createdAt: { gte: dayStart }, deletedAt: null } }),
    ]);

    const openingBalance = Number(body.opening_balance ?? 0);
    const totalCashSales = Number(cashSales._sum.amount ?? 0);
    const totalDigitalSales = Number(digitalSales._sum.amount ?? 0);
    const totalCashExpenses = Number(cashExp._sum.amount ?? 0);
    const totalDigitalExpenses = Number(digitalExp._sum.amount ?? 0);
    const expectedCash = openingBalance + totalCashSales - totalCashExpenses;
    const actualCash = body.actual_cash != null ? Number(body.actual_cash) : null;
    const variance = actualCash != null ? actualCash - expectedCash : null;

    const closing = await prisma.dailyClosing.upsert({
      where: { branchId_businessDate: { branchId, businessDate: dayStart } },
      update: {
        openingBalance,
        totalCashSales,
        totalDigitalSales,
        totalCashExpenses,
        totalDigitalExpenses,
        expectedCash,
        actualCash,
        variance,
        managerNotes: body.manager_notes ?? null,
        status: body.status ?? 'open',
        closedById: body.status === 'closed' ? request.user.id : undefined,
        closedAt: body.status === 'closed' ? new Date() : undefined,
      },
      create: {
        branchId,
        businessDate: dayStart,
        openingBalance,
        totalCashSales,
        totalDigitalSales,
        totalCashExpenses,
        totalDigitalExpenses,
        expectedCash,
        actualCash,
        variance,
        managerNotes: body.manager_notes ?? null,
        status: body.status ?? 'open',
        closedById: body.status === 'closed' ? request.user.id : undefined,
        closedAt: body.status === 'closed' ? new Date() : undefined,
      },
    });
    return reply.code(201).send({ closing });
  });

  // ── Attendance ─────────────────────────────────────
  app.get('/attendance/today', async (request) => {
    const branchId = getBranchId(request);
    const data = await prisma.attendance.findMany({
      where: { branchId, attendanceDate: today() },
      include: { user: true },
      orderBy: { checkInAt: 'desc' },
    });
    return { data };
  });

  app.get('/attendance/my-today', async (request) => {
    const branchId = getBranchId(request);
    const record = await prisma.attendance.findUnique({
      where: { userId_attendanceDate: { userId: request.user.id, attendanceDate: today() } },
    });
    return { attendance: record };
  });

  app.post('/attendance/checkin', async (request, reply) => {
    const branchId = getBranchId(request);
    const body = request.body as any;
    const existing = await prisma.attendance.findUnique({
      where: { userId_attendanceDate: { userId: request.user.id, attendanceDate: today() } },
    });
    if (existing) return reply.code(409).send({ message: 'Already checked in today.' });

    const attendance = await prisma.attendance.create({
      data: {
        userId: request.user.id,
        branchId,
        attendanceDate: today(),
        checkInAt: new Date(),
        checkInImagePath: body.check_in_image_path ?? '',
        notes: body.notes ?? null,
        status: 'checked_in',
      },
    });
    return reply.code(201).send({ attendance });
  });

  app.put('/attendance/:id/checkout', async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const attendance = await prisma.attendance.update({
      where: { id: BigInt(id) },
      data: {
        checkOutAt: new Date(),
        checkOutImagePath: body.check_out_image_path ?? null,
        status: 'checked_out',
      },
    });
    return { attendance };
  });

  // ── Riders ────────────────────────────────────────
  app.get('/riders', async (request) => {
    const branchId = getBranchId(request);
    const data = await prisma.rider.findMany({
      where: { branchId, deletedAt: null },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  });

  app.get('/riders/available', async (request) => {
    const branchId = getBranchId(request);
    const qs = request.query as any;
    const where: any = { branchId, deletedAt: null, status: 'approved', availability: 'online' };
    if (qs.vehicle_type) where.vehicleType = qs.vehicle_type;
    const data = await prisma.rider.findMany({ where, include: { user: true }, orderBy: { rating: 'desc' } });
    return { data };
  });

  app.get('/riders/:id', async (request, reply) => {
    const branchId = getBranchId(request);
    const { id } = request.params as { id: string };
    const rider = await prisma.rider.findFirst({ where: { id: BigInt(id), branchId }, include: { user: true } });
    if (!rider) return reply.code(404).send({ message: 'Not found.' });
    return { rider };
  });

  app.put('/riders/:id/status', async (request) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    const updates: any = { status };
    if (status === 'approved') {
      updates.kycVerifiedAt = new Date();
      updates.kycVerifiedBy = request.user.id;
    }
    return prisma.rider.update({ where: { id: BigInt(id) }, data: updates });
  });

  // ── Customers ─────────────────────────────────────
  app.get('/customers', async (request) => {
    const branchId = getBranchId(request);
    const query = request.query as { search?: string };
    const search = query.search?.trim();

    const where: any = { deletedAt: null };
    if (search && search.length >= 2) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const data = await prisma.customer.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { data };
  });

  app.get('/customers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const customer = await prisma.customer.findFirst({ where: { id: BigInt(id), deletedAt: null }, include: { user: true } });
    if (!customer) return reply.code(404).send({ message: 'Not found.' });
    return { customer };
  });

  app.put('/customers/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    return prisma.customer.update({
      where: { id: BigInt(id) },
      data: {
        companyName: body.company_name ?? undefined,
        defaultAddress: body.default_address ?? undefined,
      },
      include: { user: true },
    });
  });

  // ── Jobs ──────────────────────────────────────────
  app.get('/jobs', async (request) => {
    const branchId = getBranchId(request);
    const qs = request.query as any;
    const where: any = { branchId, deletedAt: null };
    if (qs.status) where.status = qs.status;

    const data = await prisma.deliveryJob.findMany({
      where,
      include: {
        rider: { include: { user: true } },
        proofOfDelivery: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { data };
  });

  app.get('/jobs/:id', async (request, reply) => {
    const branchId = getBranchId(request);
    const { id } = request.params as { id: string };
    const job = await prisma.deliveryJob.findFirst({
      where: { id: BigInt(id), branchId },
      include: {
        rider: { include: { user: true } },
        sender: true,
        proofOfDelivery: true,
        jobOffers: { include: { rider: { include: { user: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!job) return reply.code(404).send({ message: 'Not found.' });
    return { job };
  });

  app.post('/jobs', async (request, reply) => {
    const branchId = getBranchId(request);
    const body = request.body as any;
    const job = await prisma.deliveryJob.create({
      data: {
        trackingUuid: randomUUID(),
        branchId,
        createdBy: request.user.id,
        vehicleType: body.vehicle_type ?? 'motorcycle',
        status: 'pending',
        pickupContactName: body.pickup_contact_name,
        pickupContactPhone: body.pickup_contact_phone,
        pickupAddress: body.pickup_address,
        pickupNotes: body.pickup_notes ?? null,
        dropoffContactName: body.dropoff_contact_name,
        dropoffContactPhone: body.dropoff_contact_phone,
        dropoffAddress: body.dropoff_address,
        dropoffNotes: body.dropoff_notes ?? null,
        packageDescription: body.package_description ?? null,
        packageSize: body.package_size ?? 'small',
        packageWeightKg: body.package_weight_kg ?? null,
        boxType: body.box_type ?? 'own_box',
        paymentMethod: body.payment_method ?? 'cod',
        totalPrice: body.total_price ?? 0,
      },
    });
    return reply.code(201).send({ job });
  });

  app.put('/jobs/:id', async (request, reply) => {
    const branchId = getBranchId(request);
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const existing = await prisma.deliveryJob.findFirst({ where: { id: BigInt(id), branchId } });
    if (!existing) return reply.code(404).send({ message: 'Not found.' });

    const job = await prisma.deliveryJob.update({
      where: { id: BigInt(id) },
      data: {
        vehicleType: body.vehicle_type ?? undefined,
        pickupContactName: body.pickup_contact_name ?? undefined,
        pickupContactPhone: body.pickup_contact_phone ?? undefined,
        pickupAddress: body.pickup_address ?? undefined,
        pickupNotes: body.pickup_notes ?? undefined,
        dropoffContactName: body.dropoff_contact_name ?? undefined,
        dropoffContactPhone: body.dropoff_contact_phone ?? undefined,
        dropoffAddress: body.dropoff_address ?? undefined,
        dropoffNotes: body.dropoff_notes ?? undefined,
        packageDescription: body.package_description ?? undefined,
        packageSize: body.package_size ?? undefined,
        packageWeightKg: body.package_weight_kg ?? undefined,
        paymentMethod: body.payment_method ?? undefined,
        totalPrice: body.total_price ?? undefined,
        riderId: body.rider_id ? BigInt(body.rider_id) : undefined,
      },
    });
    return { job };
  });

  app.put('/jobs/:id/status', async (request, reply) => {
    const branchId = getBranchId(request);
    const { id } = request.params as { id: string };
    const { status, failure_reason, failure_notes } = request.body as any;

    const existing = await prisma.deliveryJob.findFirst({ where: { id: BigInt(id), branchId } });
    if (!existing) return reply.code(404).send({ message: 'Not found.' });

    const timestamps: any = {};
    if (status === 'in_transit') timestamps.pickedUpAt = new Date();
    if (status === 'delivered') timestamps.deliveredAt = new Date();
    if (status === 'failed') { timestamps.failedAt = new Date(); }
    if (status === 'cancelled') timestamps.cancelledAt = new Date();

    const job = await prisma.deliveryJob.update({
      where: { id: BigInt(id) },
      data: {
        status,
        failureReason: failure_reason ?? undefined,
        failureNotes: failure_notes ?? undefined,
        ...timestamps,
      },
    });
    return { job };
  });

  app.delete('/jobs/:id', async (request, reply) => {
    const branchId = getBranchId(request);
    const { id } = request.params as { id: string };
    const existing = await prisma.deliveryJob.findFirst({ where: { id: BigInt(id), branchId } });
    if (!existing) return reply.code(404).send({ message: 'Not found.' });
    await prisma.deliveryJob.update({ where: { id: BigInt(id) }, data: { deletedAt: new Date() } });
    return { success: true };
  });

  // Broadcast: assign available riders as job offers
  app.post('/jobs/:id/broadcast', async (request, reply) => {
    const branchId = getBranchId(request);
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const job = await prisma.deliveryJob.findFirst({ where: { id: BigInt(id), branchId } });
    if (!job) return reply.code(404).send({ message: 'Not found.' });

    const riderWhere: any = { branchId, status: 'approved', availability: 'online', deletedAt: null };
    if (body.vehicle_type) riderWhere.vehicleType = body.vehicle_type;
    const riders = await prisma.rider.findMany({ where: riderWhere, take: body.limit ?? 10 });

    const expiresAt = new Date(Date.now() + (body.timeout_seconds ?? 60) * 1000);
    const offerData = riders.map((r) => ({
      jobId: BigInt(id),
      riderId: r.id,
      status: 'pending' as const,
      expiresAt,
    }));

    // Upsert offers (skip duplicates)
    let created = 0;
    for (const offer of offerData) {
      try {
        await prisma.jobOffer.create({ data: offer });
        created++;
      } catch { /* duplicate — skip */ }
    }

    await prisma.deliveryJob.update({ where: { id: BigInt(id) }, data: { status: 'broadcasting' } });

    return reply.code(201).send({ broadcast_to: created, rider_count: riders.length });
  });

  // ── Expenses ──────────────────────────────────────
  app.get('/expenses', async (request) => {
    const branchId = getBranchId(request);
    const data = await prisma.expense.findMany({
      where: { branchId, deletedAt: null },
      include: { createdBy: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  });

  app.post('/expenses', async (request, reply) => {
    const branchId = getBranchId(request);
    const body = request.body as any;
    const expense = await prisma.expense.create({
      data: {
        branchId,
        category: body.category,
        vendorName: body.vendor_name ?? null,
        amount: body.amount,
        paymentMethod: body.payment_method,
        referenceNumber: body.reference_number ?? null,
        description: body.description ?? null,
        createdById: request.user.id,
      },
      include: { createdBy: true },
    });
    return reply.code(201).send({ expense });
  });

  app.put('/expenses/:id', async (request, reply) => {
    const branchId = getBranchId(request);
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const existing = await prisma.expense.findFirst({ where: { id: BigInt(id), branchId, deletedAt: null } });
    if (!existing) return reply.code(404).send({ message: 'Not found.' });
    const expense = await prisma.expense.update({
      where: { id: BigInt(id) },
      data: {
        category: body.category ?? undefined,
        vendorName: body.vendor_name ?? undefined,
        amount: body.amount ?? undefined,
        paymentMethod: body.payment_method ?? undefined,
        description: body.description ?? undefined,
      },
      include: { createdBy: true },
    });
    return { expense };
  });

  app.delete('/expenses/:id', async (request, reply) => {
    const branchId = getBranchId(request);
    const { id } = request.params as { id: string };
    const existing = await prisma.expense.findFirst({ where: { id: BigInt(id), branchId, deletedAt: null } });
    if (!existing) return reply.code(404).send({ message: 'Not found.' });
    await prisma.expense.update({ where: { id: BigInt(id) }, data: { deletedAt: new Date() } });
    return { success: true };
  });

  // ── Sales ─────────────────────────────────────────
  app.get('/sales', async (request) => {
    const branchId = getBranchId(request);
    const data = await prisma.salesTransaction.findMany({
      where: { branchId, deletedAt: null },
      include: { service: { include: { serviceCategory: true } }, createdBy: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { data };
  });

  app.post('/sales', async (request, reply) => {
    const branchId = getBranchId(request);
    const body = request.body as any;
    const tx = await prisma.salesTransaction.create({
      data: {
        branchId,
        serviceId: BigInt(body.service_id),
        amount: body.amount,
        paymentMethod: body.payment_method,
        referenceNumber: body.reference_number ?? null,
        customerName: body.customer_name ?? null,
        createdById: request.user.id,
        notes: body.notes ?? null,
        boxType: body.box_type ?? null,
        packageSize: body.package_size ?? null,
        serviceType: body.service_type ?? null,
        personalAccidentInsuranceId: body.personal_accident_insurance_id ? BigInt(body.personal_accident_insurance_id) : null,
      },
      include: { service: { include: { serviceCategory: true } }, createdBy: true },
    });
    return reply.code(201).send({ transaction: tx });
  });

  app.put('/sales/:id', async (request, reply) => {
    const branchId = getBranchId(request);
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const existing = await prisma.salesTransaction.findFirst({ where: { id: BigInt(id), branchId, deletedAt: null } });
    if (!existing) return reply.code(404).send({ message: 'Not found.' });
    const tx = await prisma.salesTransaction.update({
      where: { id: BigInt(id) },
      data: {
        amount: body.amount ?? undefined,
        paymentMethod: body.payment_method ?? undefined,
        referenceNumber: body.reference_number ?? undefined,
        customerName: body.customer_name ?? undefined,
        notes: body.notes ?? undefined,
      },
      include: { service: { include: { serviceCategory: true } }, createdBy: true },
    });
    return { transaction: tx };
  });

  app.delete('/sales/:id', async (request, reply) => {
    const branchId = getBranchId(request);
    const { id } = request.params as { id: string };
    const existing = await prisma.salesTransaction.findFirst({ where: { id: BigInt(id), branchId, deletedAt: null } });
    if (!existing) return reply.code(404).send({ message: 'Not found.' });
    await prisma.salesTransaction.update({ where: { id: BigInt(id) }, data: { deletedAt: new Date() } });
    return { success: true };
  });

  // ── Personal Accident Insurance ─────────────────────
  app.post('/personal-accident-insurance', async (request, reply) => {
    const branchId = getBranchId(request);
    const body = request.body as any;

    // Generate unique policy number: PAI-XXXXXX
    const generatePolicyNumber = async (): Promise<string> => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let policyNumber: string;
      let exists = true;
      do {
        const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        policyNumber = `PAI-${code}`;
        const found = await prisma.personalAccidentInsurance.findUnique({ where: { policyNumber } });
        exists = !!found;
      } while (exists);
      return policyNumber;
    };

    // Duplicate check: active policy for same customer
    if (body.customer_id) {
      const existing = await prisma.personalAccidentInsurance.findFirst({
        where: {
          customerId: BigInt(body.customer_id),
          status: 'active',
          validUntil: { gte: new Date() },
        },
      });
      if (existing) {
        return reply.code(409).send({
          message: `Active policy already exists: ${existing.policyNumber}`,
          policy_number: existing.policyNumber,
        });
      }
    }

    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    const policyNumber = await generatePolicyNumber();

    const insurance = await prisma.personalAccidentInsurance.create({
      data: {
        policyNumber,
        customerId: body.customer_id ? BigInt(body.customer_id) : BigInt(0),
        fullName: body.full_name,
        nationality: body.nationality ?? 'Filipino',
        mobile: body.mobile,
        email: body.email,
        dateOfBirth: new Date(body.date_of_birth),
        address: body.address,
        beneficiaries: body.beneficiaries ?? null,
        validFrom: now,
        validUntil,
        status: 'active',
        branchId,
        createdById: request.user.id,
      },
    });

    return reply.code(201).send({ data: insurance });
  });

  // GET insurance card for a customer
  app.get('/customers/:id/insurance-card', async (request, reply) => {
    const { id } = request.params as { id: string };

    const insurance = await prisma.personalAccidentInsurance.findFirst({
      where: { customerId: BigInt(id) },
      include: { branch: true, customer: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });

    if (!insurance) {
      return reply.code(404).send({ message: 'No insurance policy found for this customer.' });
    }

    return {
      data: {
        id: insurance.id.toString(),
        policy_number: insurance.policyNumber,
        full_name: insurance.fullName,
        nationality: insurance.nationality,
        mobile: insurance.mobile,
        email: insurance.email,
        date_of_birth: insurance.dateOfBirth,
        address: insurance.address,
        beneficiaries: insurance.beneficiaries,
        valid_from: insurance.validFrom,
        valid_until: insurance.validUntil,
        status: insurance.status,
        branch_name: insurance.branch?.name ?? null,
        created_at: insurance.createdAt,
      },
    };
  });

  // ── Services (for Sales form dropdowns) ────────────
  app.get('/services', async () => {
    const data = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: { services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
    return { data };
  });

  // ── Support ───────────────────────────────────────
  app.get('/support', async (request) => {
    const branchId = getBranchId(request);
    const data = await prisma.supportConversation.findMany({
      where: { branchId },
      include: { user: true },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
    });
    return { data };
  });

  app.get('/support/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const conv = await prisma.supportConversation.findUnique({
      where: { id: BigInt(id) },
      include: { user: true, cases: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) return reply.code(404).send({ message: 'Not found.' });
    return { conversation: conv };
  });

  app.put('/support/:id/status', async (request) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    const conv = await prisma.supportConversation.update({
      where: { id: BigInt(id) },
      data: { status, ownerAgentId: request.user.id, ownerType: 'branch' },
    });
    return { conversation: conv };
  });

  // ── Reports ───────────────────────────────────────
  app.get('/reports/deliveries', async (request) => {
    const branchId = getBranchId(request);
    const qs = request.query as any;
    const period = qs.period ?? 'today';

    let from: Date;
    const now = new Date();
    if (period === 'week') { from = new Date(now); from.setDate(from.getDate() - 7); }
    else if (period === 'month') { from = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (period === 'all') { from = new Date(0); }
    else { from = today(); }

    const [byStatus, byVehicle, totalAgg] = await Promise.all([
      prisma.deliveryJob.groupBy({ by: ['status'], where: { branchId, createdAt: { gte: from }, deletedAt: null }, _count: { id: true } }),
      prisma.deliveryJob.groupBy({ by: ['vehicleType'], where: { branchId, createdAt: { gte: from }, deletedAt: null }, _count: { id: true } }),
      prisma.deliveryJob.aggregate({ _count: { id: true }, _sum: { totalPrice: true }, where: { branchId, createdAt: { gte: from }, deletedAt: null } }),
    ]);

    // 7-day trend
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999);
      const count = await prisma.deliveryJob.count({ where: { branchId, createdAt: { gte: d, lte: dEnd }, deletedAt: null } });
      const delivered = await prisma.deliveryJob.count({ where: { branchId, status: 'delivered', createdAt: { gte: d, lte: dEnd } } });
      trend.push({ date: d.toISOString().slice(0, 10), total: count, delivered });
    }

    const statusMap: Record<string, number> = {};
    for (const g of byStatus) statusMap[g.status] = g._count.id;
    const vehicleMap: Record<string, number> = {};
    for (const g of byVehicle) vehicleMap[g.vehicleType] = g._count.id;

    return {
      period,
      total: totalAgg._count.id,
      revenue: Number(totalAgg._sum.totalPrice ?? 0),
      by_status: statusMap,
      by_vehicle: vehicleMap,
      trend,
    };
  });

  app.get('/reports/revenue', async (request) => {
    const branchId = getBranchId(request);
    const qs = request.query as any;
    const period = qs.period ?? 'today';

    let from: Date;
    const now = new Date();
    if (period === 'week') { from = new Date(now); from.setDate(from.getDate() - 7); }
    else if (period === 'month') { from = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (period === 'all') { from = new Date(0); }
    else { from = today(); }

    const [salesByMethod, expenseByCategory, salesTotal, expenseTotal] = await Promise.all([
      prisma.salesTransaction.groupBy({ by: ['paymentMethod'], where: { branchId, createdAt: { gte: from }, deletedAt: null }, _sum: { amount: true }, _count: { id: true } }),
      prisma.expense.groupBy({ by: ['category'], where: { branchId, createdAt: { gte: from }, deletedAt: null }, _sum: { amount: true }, _count: { id: true } }),
      prisma.salesTransaction.aggregate({ _sum: { amount: true }, _count: { id: true }, where: { branchId, createdAt: { gte: from }, deletedAt: null } }),
      prisma.expense.aggregate({ _sum: { amount: true }, _count: { id: true }, where: { branchId, createdAt: { gte: from }, deletedAt: null } }),
    ]);

    // 7-day revenue trend
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999);
      const [s, e] = await Promise.all([
        prisma.salesTransaction.aggregate({ _sum: { amount: true }, where: { branchId, createdAt: { gte: d, lte: dEnd }, deletedAt: null } }),
        prisma.expense.aggregate({ _sum: { amount: true }, where: { branchId, createdAt: { gte: d, lte: dEnd }, deletedAt: null } }),
      ]);
      trend.push({ date: d.toISOString().slice(0, 10), sales: Number(s._sum.amount ?? 0), expenses: Number(e._sum.amount ?? 0) });
    }

    return {
      period,
      total_sales: Number(salesTotal._sum.amount ?? 0),
      sales_count: salesTotal._count.id,
      total_expenses: Number(expenseTotal._sum.amount ?? 0),
      expense_count: expenseTotal._count.id,
      net: Number(salesTotal._sum.amount ?? 0) - Number(expenseTotal._sum.amount ?? 0),
      by_payment_method: salesByMethod.map((g) => ({ method: g.paymentMethod, amount: Number(g._sum.amount ?? 0), count: g._count.id })),
      expenses_by_category: expenseByCategory.map((g) => ({ category: g.category, amount: Number(g._sum.amount ?? 0), count: g._count.id })),
      trend,
    };
  });

  app.get('/reports/riders', async (request) => {
    const branchId = getBranchId(request);

    const [byStatus, byVehicle, topRiders, onlineCount] = await Promise.all([
      prisma.rider.groupBy({ by: ['status'], where: { branchId, deletedAt: null }, _count: { id: true } }),
      prisma.rider.groupBy({ by: ['vehicleType'], where: { branchId, deletedAt: null }, _count: { id: true } }),
      prisma.rider.findMany({
        where: { branchId, status: 'approved', deletedAt: null },
        orderBy: { totalDeliveries: 'desc' },
        take: 10,
        include: { user: true },
      }),
      prisma.rider.count({ where: { branchId, availability: { not: 'offline' }, deletedAt: null } }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const g of byStatus) statusMap[g.status] = g._count.id;
    const vehicleMap: Record<string, number> = {};
    for (const g of byVehicle) vehicleMap[g.vehicleType] = g._count.id;

    return {
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
      by_status: statusMap,
      by_vehicle: vehicleMap,
      online_count: onlineCount,
      top_performers: topRiders.map((r) => ({
        id: r.id.toString(),
        name: r.user?.name,
        vehicle_type: r.vehicleType,
        plate_number: r.plateNumber,
        rating: Number(r.rating),
        total_deliveries: r.totalDeliveries,
        availability: r.availability,
      })),
    };
  });

  app.get('/reports/operations', async (request) => {
    const branchId = getBranchId(request);

    const salesByCategory = await prisma.salesTransaction.groupBy({
      by: ['serviceId'],
      where: { branchId, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }, deletedAt: null },
      _sum: { amount: true },
      _count: { id: true },
    });

    const expenseByCategory = await prisma.expense.groupBy({
      by: ['category'],
      where: { branchId, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }, deletedAt: null },
      _sum: { amount: true },
      _count: { id: true },
    });

    const jobsByStatus = await prisma.deliveryJob.groupBy({
      by: ['status'],
      where: { branchId, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }, deletedAt: null },
      _count: { id: true },
    });

    const paymentMethods = await prisma.salesTransaction.groupBy({
      by: ['paymentMethod'],
      where: { branchId, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }, deletedAt: null },
      _sum: { amount: true },
      _count: { id: true },
    });

    // 7-day trends
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999);
      const [s, e] = await Promise.all([
        prisma.salesTransaction.aggregate({ _sum: { amount: true }, where: { branchId, createdAt: { gte: d, lte: dEnd }, deletedAt: null } }),
        prisma.expense.aggregate({ _sum: { amount: true }, where: { branchId, createdAt: { gte: d, lte: dEnd }, deletedAt: null } }),
      ]);
      trend.push({ date: d.toISOString().slice(0, 10), sales: Number(s._sum.amount ?? 0), expenses: Number(e._sum.amount ?? 0) });
    }

    return {
      expenses_by_category: expenseByCategory.map((g) => ({ category: g.category, amount: Number(g._sum.amount ?? 0), count: g._count.id })),
      jobs_by_status: Object.fromEntries(jobsByStatus.map((g) => [g.status, g._count.id])),
      payment_methods: paymentMethods.map((g) => ({ method: g.paymentMethod, amount: Number(g._sum.amount ?? 0), count: g._count.id })),
      trend,
    };
  });
}
