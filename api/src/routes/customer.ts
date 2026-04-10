/**
 * Customer API routes — port of backend/app/Http/Controllers/Api/CustomerApiController.php
 */
import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { supabaseAuth } from '../middleware/supabaseAuth.js';
import { prisma } from '../server.js';

// ALiN rate card — identical to the PHP RATE_CARD constant
const RATE_CARD: Record<string, Record<string, Record<string, number>>> = {
  box_xlarge:   { alin_box: { intra: 3575, cross: 3860 }, own_box: { intra: 3145, cross: 3400 } },
  box_large:    { alin_box: { intra: 2750, cross: 2970 }, own_box: { intra: 2420, cross: 2615 } },
  box_medium:   { alin_box: { intra: 1690, cross: 1850 }, own_box: { intra: 1488, cross: 1630 } },
  box_small:    { alin_box: { intra:  900, cross:  980 }, own_box: { intra:  790, cross:  865 } },
  box_5kg:      { alin_box: { intra:  285, cross:  320 }, own_box: { intra:  158, cross:  280 } },
  box_3kg:      { alin_box: { intra:  180, cross:  205 }, own_box: { intra:  150, cross:  180 } },
  box_1kg:      { alin_box: { intra:  120, cross:  140 }, own_box: { intra:  107, cross:  123 } },
  pouch_large:  { alin_box: { intra:  160, cross:  190 }, own_box: { intra:  160, cross:  190 } },
  pouch_medium: { alin_box: { intra:  145, cross:  175 }, own_box: { intra:  145, cross:  175 } },
  pouch_small:  { alin_box: { intra:  115, cross:  135 }, own_box: { intra:  115, cross:  135 } },
  pouch_xsmall: { alin_box: { intra:   75, cross:   90 }, own_box: { intra:   75, cross:   90 } },
};

export default async function customerRoutes(app: FastifyInstance) {
  app.addHook('onRequest', supabaseAuth);

  // ── POST /register ────────────────────────────────
  app.post('/register', async (request, reply) => {
    const user = request.user;
    const existing = await prisma.customer.findUnique({ where: { userId: user.id } });
    if (existing) return reply.code(409).send({ message: 'Customer profile already exists.' });

    const body = request.body as any;
    await prisma.user.update({
      where: { id: user.id },
      data: { name: body.name, email: body.email ?? user.email, userType: 'customer' },
    });

    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        defaultAddress: body.default_address ?? null,
        defaultLat: body.default_lat ?? null,
        defaultLng: body.default_lng ?? null,
        totalBookings: 0,
      },
    });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    return reply.code(201).send({ user: updated, customer });
  });

  // ── GET /profile ──────────────────────────────────
  app.get('/profile', async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      include: { customer: true },
    });
    return { user, customer: user?.customer };
  });

  // ── PUT /profile ──────────────────────────────────
  app.put('/profile', async (request) => {
    const body = request.body as any;
    const uid = request.user.id;

    const userData: any = {};
    if (body.name) userData.name = body.name;
    if (body.email) userData.email = body.email;
    if (Object.keys(userData).length) await prisma.user.update({ where: { id: uid }, data: userData });

    const custData: any = {};
    if (body.default_address !== undefined) custData.defaultAddress = body.default_address;
    if (body.default_lat !== undefined) custData.defaultLat = body.default_lat;
    if (body.default_lng !== undefined) custData.defaultLng = body.default_lng;
    if (Object.keys(custData).length) await prisma.customer.update({ where: { userId: uid }, data: custData });

    const user = await prisma.user.findUnique({ where: { id: uid }, include: { customer: true } });
    return { user, customer: user?.customer };
  });

  // ── POST /estimate ────────────────────────────────
  app.post('/estimate', async (request) => {
    const body = request.body as any;
    const sizeKey = body.package_size ?? 'pouch_small';
    const boxType = body.box_type ?? 'own_box';
    const serviceType = body.service_type ?? 'intra';
    const flatRate = RATE_CARD[sizeKey]?.[boxType]?.[serviceType] ?? 0;

    return {
      flat_rate: flatRate,
      service_type: serviceType,
      total_price: flatRate,
      base_fare: flatRate,
      distance_fare: 0,
      surge_multiplier: 1.0,
      box_type_surcharge: 0,
      estimated_distance_km: 0,
    };
  });

  // ── GET /bookings/active ──────────────────────────
  app.get('/bookings/active', async (request) => {
    const job = await prisma.deliveryJob.findFirst({
      where: {
        senderId: request.user.id,
        status: { notIn: ['delivered', 'failed', 'cancelled', 'returned'] },
      },
      include: { rider: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return { job };
  });

  // ── GET /bookings ─────────────────────────────────
  app.get('/bookings', async (request) => {
    const qs = request.query as any;
    const page = Math.max(1, parseInt(qs.page ?? '1', 10));
    const take = 15;
    const skip = (page - 1) * take;

    const [jobs, total] = await Promise.all([
      prisma.deliveryJob.findMany({
        where: { senderId: request.user.id },
        include: { rider: { include: { user: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.deliveryJob.count({ where: { senderId: request.user.id } }),
    ]);

    return { data: jobs, current_page: page, per_page: take, total, last_page: Math.ceil(total / take) };
  });

  // ── POST /bookings ────────────────────────────────
  app.post('/bookings', async (request, reply) => {
    const body = request.body as any;
    const user = request.user;

    // Find nearest active branch (simplified: first active branch)
    const branch = await prisma.branch.findFirst({ where: { isActive: true } });
    if (!branch) return reply.code(422).send({ message: 'No active branch available. Please try again later.' });

    const job = await prisma.deliveryJob.create({
      data: {
        trackingUuid: randomUUID(),
        senderId: user.id,
        branchId: branch.id,
        createdBy: user.id,
        status: 'pending',
        vehicleType: body.vehicle_type,
        pickupContactName: body.pickup_contact_name,
        pickupContactPhone: body.pickup_contact_phone,
        pickupAddress: body.pickup_address,
        pickupLat: body.pickup_lat,
        pickupLng: body.pickup_lng,
        pickupNotes: body.pickup_notes ?? null,
        dropoffContactName: body.dropoff_contact_name,
        dropoffContactPhone: body.dropoff_contact_phone,
        dropoffAddress: body.dropoff_address,
        dropoffLat: body.dropoff_lat,
        dropoffLng: body.dropoff_lng,
        dropoffNotes: body.dropoff_notes ?? null,
        packageDescription: body.package_description ?? null,
        packageSize: body.package_size,
        boxType: body.box_type ?? 'own_box',
        totalPrice: body.total_price,
        paymentMethod: body.payment_method,
        paymentStatus: 'pending',
      },
    });

    // Increment customer booking count
    await prisma.customer.updateMany({ where: { userId: user.id }, data: { totalBookings: { increment: 1 } } });

    return reply.code(201).send(job);
  });

  // ── GET /bookings/:jobId ──────────────────────────
  app.get('/bookings/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const job = await prisma.deliveryJob.findUnique({
      where: { id: BigInt(jobId) },
      include: { rider: { include: { user: true } }, proofOfDelivery: true },
    });
    if (!job) return reply.code(404).send({ message: 'Job not found.' });
    if (job.senderId !== request.user.id) return reply.code(403).send({ message: 'Not your booking.' });
    return job;
  });

  // ── POST /bookings/:jobId/cancel ──────────────────
  app.post('/bookings/:jobId/cancel', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const job = await prisma.deliveryJob.findUnique({ where: { id: BigInt(jobId) } });
    if (!job) return reply.code(404).send({ message: 'Job not found.' });
    if (job.senderId !== request.user.id) return reply.code(403).send({ message: 'Not your booking.' });
    if (!['pending', 'broadcasting'].includes(job.status)) {
      return reply.code(422).send({ message: `Cannot cancel a booking that is already ${job.status}.` });
    }

    const updated = await prisma.deliveryJob.update({
      where: { id: job.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        paymentStatus: job.paymentStatus === 'paid' ? 'refunded' : 'pending',
      },
    });

    await prisma.jobOffer.updateMany({
      where: { jobId: job.id, status: 'pending' },
      data: { status: 'expired' },
    });

    return { success: true, job: updated };
  });

  // ── GET /bookings/:jobId/driver-location ──────────
  app.get('/bookings/:jobId/driver-location', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const job = await prisma.deliveryJob.findUnique({
      where: { id: BigInt(jobId) },
      include: { rider: true },
    });
    if (!job) return reply.code(404).send({ message: 'Job not found.' });
    if (job.senderId !== request.user.id) return reply.code(403).send({ message: 'Not your booking.' });
    if (!job.riderId) return { lat: null, lng: null, last_seen_at: null };

    return {
      lat: job.rider?.currentLat ? Number(job.rider.currentLat) : null,
      lng: job.rider?.currentLng ? Number(job.rider.currentLng) : null,
      last_seen_at: job.rider?.lastSeenAt?.toISOString() ?? null,
    };
  });

  // ── GET /insurance ────────────────────────────────
  app.get('/insurance', async (request) => {
    const customer = await prisma.customer.findUnique({ where: { userId: request.user.id } });
    if (!customer) return { insurance: null };

    const insurance = await prisma.personalAccidentInsurance.findFirst({
      where: { customerId: customer.id },
      include: { branch: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!insurance) return { insurance: null };

    return {
      insurance: {
        id: insurance.id.toString(),
        policy_number: insurance.policyNumber,
        full_name: insurance.fullName,
        nationality: insurance.nationality,
        mobile: insurance.mobile,
        email: insurance.email,
        date_of_birth: insurance.dateOfBirth.toISOString().split('T')[0],
        address: insurance.address,
        beneficiaries: insurance.beneficiaries,
        valid_from: insurance.validFrom.toISOString().split('T')[0],
        valid_until: insurance.validUntil.toISOString().split('T')[0],
        status: insurance.status,
        is_active: insurance.status === 'active' && insurance.validUntil >= new Date(),
        branch_name: insurance.branch?.name,
      },
    };
  });
}
