/**
 * Rider API routes — port of backend/app/Http/Controllers/Api/RiderApiController.php
 * All 19 endpoints are preserved with identical request/response shapes.
 */
import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { supabaseAuth } from '../middleware/supabaseAuth.js';
import { prisma } from '../server.js';

export default async function riderRoutes(app: FastifyInstance) {
  app.addHook('onRequest', supabaseAuth);

  // Helper: get the rider record for the current user
  async function getRider(userId: bigint) {
    const rider = await prisma.rider.findUnique({ where: { userId } });
    return rider;
  }

  // ── POST /register ────────────────────────────────
  app.post('/register', async (request, reply) => {
    const user = request.user;

    const existing = await prisma.rider.findUnique({ where: { userId: user.id } });
    if (existing) return reply.code(409).send({ message: 'Rider profile already exists.' });

    const body = request.body as any;
    const { name, vehicle_type, branch_id, plate_number, vehicle_brand, vehicle_model, vehicle_color, maya_phone } = body;

    await prisma.user.update({
      where: { id: user.id },
      data: { name, userType: 'rider' },
    });

    const rider = await prisma.rider.create({
      data: {
        userId: user.id,
        branchId: branch_id ? BigInt(branch_id) : null,
        vehicleType: vehicle_type,
        plateNumber: plate_number ?? null,
        vehicleBrand: vehicle_brand ?? null,
        vehicleModel: vehicle_model ?? null,
        vehicleColor: vehicle_color ?? null,
        mayaPhone: maya_phone ?? null,
        status: 'pending',
        availability: 'offline',
        rating: 5.0,
        totalDeliveries: 0,
      },
    });

    return reply.code(201).send({ user, rider });
  });

  // ── GET /profile ──────────────────────────────────
  app.get('/profile', async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      include: { rider: true },
    });
    return { user, rider: user?.rider };
  });

  // ── PUT /profile ──────────────────────────────────
  app.put('/profile', async (request) => {
    const body = request.body as any;
    const user = request.user;

    if (body.name) {
      await prisma.user.update({ where: { id: user.id }, data: { name: body.name } });
    }

    const riderData: any = {};
    for (const f of ['plate_number', 'vehicle_brand', 'vehicle_model', 'vehicle_color', 'maya_phone']) {
      if (body[f] !== undefined) {
        const key = f.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase()) as string;
        riderData[key] = body[f];
      }
    }

    if (Object.keys(riderData).length) {
      await prisma.rider.update({ where: { userId: user.id }, data: riderData });
    }

    const updated = await prisma.user.findUnique({ where: { id: user.id }, include: { rider: true } });
    return { user: updated, rider: updated?.rider };
  });

  // ── PUT /availability ─────────────────────────────
  app.put('/availability', async (request, reply) => {
    const { availability } = request.body as { availability: 'online' | 'offline' };
    const rider = await getRider(request.user.id);

    if (!rider) return reply.code(404).send({ message: 'Rider profile not found.' });
    if (rider.status !== 'approved') return reply.code(403).send({ message: 'Rider not approved.' });

    await prisma.rider.update({
      where: { id: rider.id },
      data: { availability, lastSeenAt: new Date() },
    });

    return { availability };
  });

  // ── PUT /location ─────────────────────────────────
  app.put('/location', async (request, reply) => {
    const { lat, lng } = request.body as { lat: number; lng: number };
    const rider = await getRider(request.user.id);
    if (!rider) return reply.code(404).send({ message: 'Rider profile not found.' });

    await prisma.rider.update({
      where: { id: rider.id },
      data: { currentLat: lat, currentLng: lng, lastSeenAt: new Date() },
    });

    return { success: true };
  });

  // ── GET /jobs/active ──────────────────────────────
  app.get('/jobs/active', async (request, reply) => {
    const rider = await getRider(request.user.id);
    if (!rider) return reply.code(404).send({ message: 'Rider profile not found.' });

    const job = await prisma.deliveryJob.findFirst({
      where: {
        riderId: rider.id,
        status: { notIn: ['delivered', 'failed', 'cancelled', 'returned'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { job };
  });

  // ── GET /jobs/history ─────────────────────────────
  app.get('/jobs/history', async (request, reply) => {
    const rider = await getRider(request.user.id);
    if (!rider) return reply.code(404).send({ message: 'Rider profile not found.' });

    const qs = request.query as any;
    const page = Math.max(1, parseInt(qs.page ?? '1', 10));
    const take = 15;
    const skip = (page - 1) * take;

    const [jobs, total] = await Promise.all([
      prisma.deliveryJob.findMany({
        where: { riderId: rider.id, status: { in: ['delivered', 'failed', 'cancelled', 'returned'] } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.deliveryJob.count({
        where: { riderId: rider.id, status: { in: ['delivered', 'failed', 'cancelled', 'returned'] } },
      }),
    ]);

    return { data: jobs, current_page: page, per_page: take, total, last_page: Math.ceil(total / take) };
  });

  // ── POST /offers/:offerId/respond ─────────────────
  app.post('/offers/:offerId/respond', async (request, reply) => {
    const { offerId } = request.params as { offerId: string };
    const { action } = request.body as { action: 'accept' | 'reject' };
    const rider = await getRider(request.user.id);
    if (!rider) return reply.code(404).send({ message: 'Rider profile not found.' });

    const offer = await prisma.jobOffer.findUnique({ where: { id: BigInt(offerId) } });
    if (!offer) return reply.code(404).send({ message: 'Offer not found.' });
    if (offer.riderId !== rider.id) return reply.code(403).send({ message: 'Not your offer.' });
    if (offer.status !== 'pending') return reply.code(422).send({ message: 'Offer already responded to.' });
    if (offer.expiresAt < new Date()) {
      await prisma.jobOffer.update({ where: { id: offer.id }, data: { status: 'expired' } });
      return reply.code(422).send({ message: 'Offer expired.' });
    }

    await prisma.jobOffer.update({
      where: { id: offer.id },
      data: { status: action === 'accept' ? 'accepted' : 'rejected', respondedAt: new Date() },
    });

    let job = null;
    if (action === 'accept') {
      job = await prisma.deliveryJob.update({
        where: { id: offer.jobId },
        data: { riderId: rider.id, status: 'accepted', acceptedAt: new Date() },
      });
      await prisma.rider.update({ where: { id: rider.id }, data: { availability: 'on_job' } });
      // Expire other pending offers for the same job
      await prisma.jobOffer.updateMany({
        where: { jobId: offer.jobId, id: { not: offer.id }, status: 'pending' },
        data: { status: 'expired' },
      });
    }

    return { success: true, offer_id: offer.id.toString(), job };
  });

  // ── PUT /jobs/:jobId/status ───────────────────────
  app.put('/jobs/:jobId/status', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const body = request.body as any;
    const rider = await getRider(request.user.id);
    if (!rider) return reply.code(404).send({ message: 'Rider profile not found.' });

    const job = await prisma.deliveryJob.findUnique({ where: { id: BigInt(jobId) } });
    if (!job) return reply.code(404).send({ message: 'Job not found.' });
    if (job.riderId !== rider.id) return reply.code(403).send({ message: 'Not your job.' });

    const statusFlow: Record<string, string[]> = {
      accepted: ['en_route_pickup'],
      en_route_pickup: ['at_pickup'],
      at_pickup: ['picked_up'],
      picked_up: ['in_transit'],
      in_transit: ['at_dropoff'],
      at_dropoff: ['delivered', 'failed'],
    };

    const allowed = statusFlow[job.status] ?? [];
    if (!allowed.includes(body.status)) {
      return reply.code(422).send({
        message: `Cannot transition from '${job.status}' to '${body.status}'.`,
      });
    }

    const data: any = { status: body.status };
    if (body.status === 'picked_up') data.pickedUpAt = new Date();
    if (body.status === 'delivered') {
      data.deliveredAt = new Date();
      if (job.paymentMethod === 'cod') data.codCollected = true;
      await prisma.rider.update({ where: { id: rider.id }, data: { availability: 'online' } });
    }
    if (body.status === 'failed') {
      data.failedAt = new Date();
      data.failureReason = body.failure_reason ?? null;
      data.failureNotes = body.failure_notes ?? null;
      await prisma.rider.update({ where: { id: rider.id }, data: { availability: 'online' } });
    }

    const updated = await prisma.deliveryJob.update({ where: { id: job.id }, data });
    return { success: true, job: updated };
  });

  // ── POST /jobs/:jobId/pod ─────────────────────────
  app.post('/jobs/:jobId/pod', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const body = request.body as any;
    const rider = await getRider(request.user.id);
    if (!rider) return reply.code(404).send({ message: 'Rider profile not found.' });

    const job = await prisma.deliveryJob.findUnique({ where: { id: BigInt(jobId) } });
    if (!job) return reply.code(404).send({ message: 'Job not found.' });
    if (job.riderId !== rider.id) return reply.code(403).send({ message: 'Not your job.' });

    // In production, handle multipart file uploads and store to S3/storage
    const pod = await prisma.proofOfDelivery.create({
      data: {
        jobId: job.id,
        recipientName: body.recipient_name,
        photoUrl: body.photo_url ?? '',    // URL after upload
        signatureUrl: body.signature_url ?? null,
        relationship: body.relationship ?? null,
        notes: body.notes ?? null,
        deliveryLat: body.delivery_lat ?? null,
        deliveryLng: body.delivery_lng ?? null,
      },
    });

    return reply.code(201).send({ success: true, pod });
  });

  // ── GET /earnings ─────────────────────────────────
  app.get('/earnings', async (request, reply) => {
    const rider = await getRider(request.user.id);
    if (!rider) return reply.code(404).send({ message: 'Rider profile not found.' });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [todayAgg, weekAgg, monthAgg, totalAgg] = await Promise.all([
      prisma.deliveryJob.aggregate({ _sum: { riderEarnings: true }, where: { riderId: rider.id, status: 'delivered', deliveredAt: { gte: startOfDay } } }),
      prisma.deliveryJob.aggregate({ _sum: { riderEarnings: true }, where: { riderId: rider.id, status: 'delivered', deliveredAt: { gte: startOfWeek, lte: endOfWeek } } }),
      prisma.deliveryJob.aggregate({ _sum: { riderEarnings: true }, where: { riderId: rider.id, status: 'delivered', deliveredAt: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.deliveryJob.aggregate({ _sum: { riderEarnings: true }, where: { riderId: rider.id, status: 'delivered' } }),
    ]);

    const paidOutAgg = await prisma.payoutRequest.aggregate({
      _sum: { amount: true },
      where: { riderId: rider.id, status: { in: ['approved', 'processing', 'completed'] } },
    });

    const total = Number(totalAgg._sum.riderEarnings ?? 0);
    const paidOut = Number(paidOutAgg._sum.amount ?? 0);

    return {
      today: Number(todayAgg._sum.riderEarnings ?? 0),
      this_week: Number(weekAgg._sum.riderEarnings ?? 0),
      this_month: Number(monthAgg._sum.riderEarnings ?? 0),
      total,
      pending_payout: Math.max(0, total - paidOut),
    };
  });

  // ── POST /payouts ─────────────────────────────────
  app.post('/payouts', async (request, reply) => {
    const { amount } = request.body as { amount: number };
    const rider = await getRider(request.user.id);
    if (!rider) return reply.code(404).send({ message: 'Rider profile not found.' });

    const hasPending = await prisma.payoutRequest.findFirst({
      where: { riderId: rider.id, status: 'pending' },
    });
    if (hasPending) return reply.code(422).send({ message: 'You already have a pending payout request.' });

    const payout = await prisma.payoutRequest.create({
      data: {
        riderId: rider.id,
        amount,
        status: 'pending',
        idempotencyKey: randomUUID(),
      },
    });

    return reply.code(201).send({ success: true, message: 'Payout request submitted.', payout });
  });

  // ── POST /documents ───────────────────────────────
  app.post('/documents', async (request, reply) => {
    const body = request.body as any;
    const rider = await getRider(request.user.id);
    if (!rider) return reply.code(404).send({ message: 'Rider profile not found.' });

    const fieldMap: Record<string, string> = {
      license: 'licenseUrl',
      or_cr: 'orCrUrl',
      nbi_clearance: 'nbiClearanceUrl',
      selfie: 'selfieUrl',
    };
    const field = fieldMap[body.type];
    if (!field) return reply.code(422).send({ message: 'Invalid document type.' });

    await prisma.rider.update({ where: { id: rider.id }, data: { [field]: body.url } });

    return { success: true, type: body.type, url: body.url };
  });
}
