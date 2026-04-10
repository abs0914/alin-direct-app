import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import fastifyWebSocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';

import riderRoutes from './routes/rider.js';
import customerRoutes from './routes/customer.js';
import supportRoutes from './routes/support.js';
import emergencyRoutes from './routes/emergency.js';
import publicRoutes from './routes/public.js';
import meRoutes from './routes/me.js';
import adminRoutes from './routes/admin.js';
import branchAdminRoutes from './routes/branchAdmin.js';

export const prisma = new PrismaClient();

// Prisma returns BigInt for all auto-increment IDs. JSON.stringify does not
// support BigInt natively and throws "TypeError: Do not know how to serialize a BigInt".
// This global patch serializes them as strings, matching the Laravel API behaviour.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

async function buildServer() {
  const app = Fastify({
    logger: {
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // ── Plugins ──────────────────────────────────────────
  await app.register(fastifyCors, { origin: true });
  await app.register(fastifyHelmet);
  await app.register(fastifyMultipart, { limits: { fileSize: 5 * 1024 * 1024 } });
  await app.register(fastifyWebSocket);

  // ── Health ───────────────────────────────────────────
  app.get('/api/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  // ── Routes ───────────────────────────────────────────
  await app.register(publicRoutes, { prefix: '/verify' });
  await app.register(meRoutes, { prefix: '/api' });
  await app.register(riderRoutes, { prefix: '/api/rider' });
  await app.register(customerRoutes, { prefix: '/api/customer' });
  await app.register(supportRoutes, { prefix: '/api/customer/support' });
  await app.register(emergencyRoutes, { prefix: '/api/rider/emergency' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(branchAdminRoutes, { prefix: '/api/branch-admin' });

  return app;
}

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`ALiN API running on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
