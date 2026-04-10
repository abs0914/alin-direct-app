/**
 * /api/me — current authenticated user profile
 */
import { FastifyInstance } from 'fastify';
import { supabaseAuth } from '../middleware/supabaseAuth.js';
import { prisma } from '../server.js';

export default async function meRoutes(app: FastifyInstance) {
  app.addHook('onRequest', supabaseAuth);

  app.get('/me', async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      include: { rider: true, customer: true },
    });
    return { user };
  });

  app.put('/me', async (request) => {
    const body = request.body as Record<string, unknown>;
    const allowed = ['name', 'avatar_url'] as const;
    const data: Partial<{ name: string; avatarUrl: string }> = {};
    if (typeof body.name === 'string') data.name = body.name;
    if (typeof body.avatar_url === 'string') data.avatarUrl = body.avatar_url;

    const user = await prisma.user.update({ where: { id: request.user.id }, data });
    return { user };
  });

  app.put('/me/push-token', async (request) => {
    const { expo_push_token } = request.body as { expo_push_token: string };
    await prisma.user.update({
      where: { id: request.user.id },
      data: { expoPushToken: expo_push_token },
    });
    return { success: true };
  });
}
