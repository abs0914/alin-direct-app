/**
 * Emergency / SOS routes — port of backend/app/Http/Controllers/Api/EmergencyController.php
 */
import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { supabaseAuth } from '../middleware/supabaseAuth.js';
import { prisma } from '../server.js';

export default async function emergencyRoutes(app: FastifyInstance) {
  app.addHook('onRequest', supabaseAuth);

  // ── POST / (trigger SOS) ──────────────────────────
  app.post('/', async (request, reply) => {
    const rider = await prisma.rider.findUnique({
      where: { userId: request.user.id },
      include: { user: true },
    });
    if (!rider) return reply.code(404).send({ message: 'Rider profile not found.' });
    if (rider.status !== 'approved') return reply.code(403).send({ message: 'Rider not approved.' });

    const existing = await prisma.emergencyAlert.findFirst({
      where: { riderId: rider.id, status: { in: ['active', 'responding'] } },
    });
    if (existing) {
      return reply.code(409).send({ message: 'You already have an active emergency alert.', alert: existing });
    }

    const { lat, lng, notes } = request.body as { lat: number; lng: number; notes?: string };

    // Transaction: create alert + emergency job
    const [alert, job] = await prisma.$transaction(async (tx: any) => {
      const a = await tx.emergencyAlert.create({
        data: {
          riderId: rider.id,
          branchId: rider.branchId ?? null,
          lat,
          lng,
          status: 'active',
          notes: notes ?? null,
        },
      });

      const riderName = rider.user?.name ?? 'Unknown Rider';
      const j = await tx.deliveryJob.create({
        data: {
          trackingUuid: randomUUID(),
          branchId: rider.branchId ?? null,
          createdBy: request.user.id,
          status: 'broadcasting',
          isEmergency: true,
          vehicleType: rider.vehicleType,
          pickupContactName: riderName,
          pickupContactPhone: rider.user?.phone ?? '',
          pickupAddress: `EMERGENCY — Rider in Distress (Rider #${rider.id})`,
          pickupLat: lat,
          pickupLng: lng,
          pickupNotes: notes ?? 'Rider has triggered an SOS. Please respond immediately.',
          dropoffContactName: riderName,
          dropoffContactPhone: rider.user?.phone ?? '',
          dropoffAddress: `EMERGENCY — Rider in Distress (Rider #${rider.id})`,
          dropoffLat: lat,
          dropoffLng: lng,
          packageDescription: 'Emergency Assistance — No package. Respond to distressed rider.',
          packageSize: 'small',
          totalPrice: 0,
          riderEarnings: 0,
          platformCommission: 0,
          paymentMethod: 'cod',
          paymentStatus: 'pending',
        },
      });

      await tx.emergencyAlert.update({ where: { id: a.id }, data: { emergencyJobId: j.id } });

      return [a, j];
    });

    return reply.code(201).send({ success: true, alert, job });
  });

  // ── GET /active ───────────────────────────────────
  app.get('/active', async (request) => {
    const rider = await prisma.rider.findUnique({ where: { userId: request.user.id } });
    if (!rider) return { alert: null };

    const alert = await prisma.emergencyAlert.findFirst({
      where: { riderId: rider.id, status: { in: ['active', 'responding'] } },
      include: { emergencyJob: true, respondedByRider: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return { alert };
  });

  // ── GET /nearby ───────────────────────────────────
  app.get('/nearby', async (request) => {
    const rider = await prisma.rider.findUnique({ where: { userId: request.user.id } });
    if (!rider || rider.status !== 'approved' || rider.availability === 'offline') {
      return { alerts: [] };
    }

    const alerts = await prisma.emergencyAlert.findMany({
      where: {
        branchId: rider.branchId,
        riderId: { not: rider.id },
        status: { in: ['active', 'responding'] },
      },
      include: { rider: { include: { user: true } }, emergencyJob: true },
      orderBy: { createdAt: 'desc' },
    });

    return { alerts };
  });

  // ── POST /:alertId/respond ────────────────────────
  app.post('/:alertId/respond', async (request, reply) => {
    const { alertId } = request.params as { alertId: string };
    const rider = await prisma.rider.findUnique({ where: { userId: request.user.id } });
    if (!rider) return reply.code(404).send({ message: 'Rider profile not found.' });

    const alert = await prisma.emergencyAlert.findUnique({
      where: { id: BigInt(alertId) },
      include: { emergencyJob: true },
    });
    if (!alert) return reply.code(404).send({ message: 'Emergency not found.' });
    if (alert.branchId !== rider.branchId) return reply.code(403).send({ message: 'Emergency not in your branch.' });
    if (!['active', 'responding'].includes(alert.status)) return reply.code(422).send({ message: 'Emergency is no longer active.' });
    if (alert.riderId === rider.id) return reply.code(422).send({ message: 'Cannot respond to your own emergency.' });

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.$transaction(async (tx: any) => {
      if (alert.emergencyJob) {
        await tx.jobOffer.upsert({
          where: { jobId_riderId: { jobId: alert.emergencyJob.id, riderId: rider.id } },
          create: { jobId: alert.emergencyJob.id, riderId: rider.id, status: 'accepted', expiresAt, respondedAt: new Date() },
          update: { status: 'accepted', respondedAt: new Date() },
        });
        await tx.deliveryJob.update({
          where: { id: alert.emergencyJob.id },
          data: { riderId: rider.id, status: 'accepted', acceptedAt: new Date() },
        });
        await tx.rider.update({ where: { id: rider.id }, data: { availability: 'on_job' } });
      }
      await tx.emergencyAlert.update({
        where: { id: alert.id },
        data: { status: 'responding', respondedByRiderId: rider.id },
      });
    });

    const updated = await prisma.emergencyAlert.findUnique({
      where: { id: alert.id },
      include: { rider: { include: { user: true } }, respondedByRider: { include: { user: true } }, emergencyJob: true },
    });

    return { success: true, alert: updated, job: updated?.emergencyJob };
  });

  // ── POST /:alertId/resolve ────────────────────────
  app.post('/:alertId/resolve', async (request, reply) => {
    const { alertId } = request.params as { alertId: string };
    const rider = await prisma.rider.findUnique({ where: { userId: request.user.id } });
    if (!rider) return reply.code(404).send({ message: 'Rider profile not found.' });

    const alert = await prisma.emergencyAlert.findUnique({ where: { id: BigInt(alertId) } });
    if (!alert) return reply.code(404).send({ message: 'Emergency not found.' });

    const isOwner = alert.riderId === rider.id;
    const isResponder = alert.respondedByRiderId === rider.id;
    if (!isOwner && !isResponder) return reply.code(403).send({ message: 'Not authorized to resolve this emergency.' });
    if (['resolved', 'cancelled'].includes(alert.status)) return reply.code(422).send({ message: 'Emergency already closed.' });

    await prisma.$transaction(async (tx: any) => {
      await tx.emergencyAlert.update({ where: { id: alert.id }, data: { status: 'resolved', resolvedAt: new Date() } });
      if (alert.emergencyJobId) {
        await tx.deliveryJob.updateMany({
          where: { id: alert.emergencyJobId, status: { notIn: ['delivered', 'cancelled'] } },
          data: { status: 'delivered', deliveredAt: new Date() },
        });
      }
      if (alert.respondedByRiderId) {
        await tx.rider.updateMany({
          where: { id: alert.respondedByRiderId, availability: 'on_job' },
          data: { availability: 'online' },
        });
      }
    });

    const updated = await prisma.emergencyAlert.findUnique({ where: { id: alert.id } });
    return { success: true, alert: updated };
  });

  // ── POST /:alertId/cancel ─────────────────────────
  app.post('/:alertId/cancel', async (request, reply) => {
    const { alertId } = request.params as { alertId: string };
    const rider = await prisma.rider.findUnique({ where: { userId: request.user.id } });
    if (!rider) return reply.code(404).send({ message: 'Rider profile not found.' });

    const alert = await prisma.emergencyAlert.findUnique({ where: { id: BigInt(alertId) } });
    if (!alert) return reply.code(404).send({ message: 'Emergency not found.' });
    if (alert.riderId !== rider.id) return reply.code(403).send({ message: 'Not your emergency.' });
    if (['resolved', 'cancelled'].includes(alert.status)) return reply.code(422).send({ message: 'Emergency already closed.' });

    await prisma.$transaction(async (tx: any) => {
      await tx.emergencyAlert.update({ where: { id: alert.id }, data: { status: 'cancelled', resolvedAt: new Date() } });
      if (alert.emergencyJobId) {
        await tx.deliveryJob.updateMany({
          where: { id: alert.emergencyJobId, status: { in: ['broadcasting', 'pending'] } },
          data: { status: 'cancelled', cancelledAt: new Date() },
        });
      }
    });

    return { success: true };
  });
}
