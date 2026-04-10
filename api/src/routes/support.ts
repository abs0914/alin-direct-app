/**
 * Support conversation routes — port of backend/app/Http/Controllers/Api/SupportController.php
 */
import { FastifyInstance } from 'fastify';
import { supabaseAuth } from '../middleware/supabaseAuth.js';
import { prisma } from '../server.js';
import { getAiDriver } from '../services/ai/index.js';

function derivePriority(intent: string, sentiment: number): string {
  if (['damage', 'escalation'].includes(intent)) return 'critical';
  if (sentiment <= -2) return 'high';
  if (['complaint', 'payment'].includes(intent)) return 'high';
  return 'normal';
}

function deriveTeam(intent: string): string {
  if (['damage', 'payment'].includes(intent)) return 'hq';
  return 'branch';
}

function deriveSla(priority: string): Date {
  const now = Date.now();
  if (priority === 'critical') return new Date(now + 15 * 60_000);
  if (priority === 'high') return new Date(now + 30 * 60_000);
  return new Date(now + 4 * 60 * 60_000);
}

export default async function supportRoutes(app: FastifyInstance) {
  app.addHook('onRequest', supabaseAuth);

  // ── POST /start ───────────────────────────────────
  app.post('/start', async (request, reply) => {
    const user = request.user;
    const body = request.body as any;

    // Reuse an existing open conversation
    let conversation = await prisma.supportConversation.findFirst({
      where: { userId: user.id, status: { in: ['open', 'bot_handling', 'pending_agent'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (!conversation) {
      conversation = await prisma.supportConversation.create({
        data: {
          userId: user.id,
          channel: body.channel ?? 'app',
          status: 'bot_handling',
          ownerType: 'bot',
          branchId: user.branchId ?? null,
          deliveryJobId: body.delivery_job_id ? BigInt(body.delivery_job_id) : null,
          lastMessageAt: new Date(),
        },
      });
    }

    return sendMessage(app, conversation, user, body.message, reply);
  });

  // ── GET /conversations ────────────────────────────
  app.get('/conversations', async (request) => {
    const conversations = await prisma.supportConversation.findMany({
      where: { userId: request.user.id },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        cases: { select: { id: true, conversationId: true, category: true, priority: true, status: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 20,
    });
    return conversations;
  });

  // ── GET /conversations/:id ────────────────────────
  app.get('/conversations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const conversation = await prisma.supportConversation.findFirst({
      where: { id: BigInt(id), userId: request.user.id },
      include: { messages: true, cases: true, deliveryJob: { select: { id: true, trackingUuid: true, status: true } } },
    });
    if (!conversation) return reply.code(404).send({ message: 'Conversation not found.' });

    // Mark messages as read
    await prisma.supportMessage.updateMany({
      where: { conversationId: BigInt(id), readAt: null, senderType: { notIn: ['customer', 'rider'] } },
      data: { readAt: new Date() },
    });

    return conversation;
  });

  // ── POST /conversations/:id/message ──────────────
  app.post('/conversations/:id/message', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user;
    const body = request.body as any;

    const conversation = await prisma.supportConversation.findFirst({
      where: { id: BigInt(id), userId: user.id },
    });
    if (!conversation) return reply.code(404).send({ message: 'Conversation not found.' });
    if (['closed', 'resolved'].includes(conversation.status)) {
      return reply.code(422).send({ message: 'This conversation is already closed.' });
    }

    return sendMessage(app, conversation, user, body.message, reply);
  });

  // ── POST /conversations/:id/close ────────────────
  app.post('/conversations/:id/close', async (request, reply) => {
    const { id } = request.params as { id: string };
    const conversation = await prisma.supportConversation.findFirst({
      where: { id: BigInt(id), userId: request.user.id },
      include: { cases: true },
    });
    if (!conversation) return reply.code(404).send({ message: 'Conversation not found.' });

    await prisma.supportConversation.update({
      where: { id: conversation.id },
      data: { status: 'closed', resolvedAt: new Date() },
    });

    if (conversation.cases.length > 0) {
      await prisma.supportCase.updateMany({
        where: { conversationId: conversation.id },
        data: { status: 'closed', resolutionCode: 'customer_closed', resolvedAt: new Date() },
      });
    }

    return { message: 'Conversation closed.' };
  });
}

async function sendMessage(app: FastifyInstance, conversation: any, user: any, text: string, reply: any) {
  try {
    const senderType = user.userType === 'rider' ? 'rider' : 'customer';

    // Save user message
    await prisma.supportMessage.create({
      data: {
        conversationId: conversation.id,
        senderType,
        senderId: user.id,
        body: text,
        messageType: 'text',
      },
    });

    await prisma.supportConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // If with an agent, skip AI
    if (conversation.status === 'agent_active') {
      return { conversation_id: conversation.id.toString(), bot_reply: null, escalated: false, status: conversation.status };
    }

    // AI classification + response
    const ai = getAiDriver();
    const classification = await ai.classify(text);

    // Build a simple reply for now — in production the SupportAiService has richer logic
    const botReply = classification.should_escalate
      ? `Thank you for reaching out. We've escalated your concern and an agent will be in touch shortly. Reference: #${conversation.id}`
      : `Thank you for your message. We'll look into your concern and get back to you soon.`;

    await prisma.supportMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: 'bot',
        senderId: null,
        body: botReply,
        messageType: 'text',
        aiConfidence: classification.confidence,
        aiMetadata: { intent: classification.intent, sentiment: classification.sentiment, escalation_reason: classification.escalation_reason },
      },
    });

    const newStatus = classification.should_escalate ? 'pending_agent' : 'bot_handling';
    await prisma.supportConversation.update({
      where: { id: conversation.id },
      data: {
        intent: classification.intent,
        aiConfidence: classification.confidence,
        sentimentScore: classification.sentiment,
        status: newStatus,
        escalationFlag: classification.should_escalate,
        lastMessageAt: new Date(),
      },
    });

    if (classification.should_escalate) {
      const messages = await prisma.supportMessage.findMany({ where: { conversationId: conversation.id } });
      const summary = await ai.summarize(messages.map((m: any) => ({ sender_type: m.senderType, body: m.body })));
      const priority = derivePriority(classification.intent, classification.sentiment);

      // conversationId is not unique so upsert is not valid — use findFirst + create/update
      const existingCase = await prisma.supportCase.findFirst({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' },
      });

      if (existingCase) {
        await prisma.supportCase.update({
          where: { id: existingCase.id },
          data: {
            category: classification.intent,
            priority,
            aiSummary: summary,
            status: 'open',
          },
        });
      } else {
        await prisma.supportCase.create({
          data: {
            conversationId: conversation.id,
            deliveryJobId: conversation.deliveryJobId ?? null,
            branchId: conversation.branchId ?? null,
            category: classification.intent,
            priority,
            assignedTeam: deriveTeam(classification.intent),
            slaDueAt: deriveSla(priority),
            status: 'open',
            aiSummary: summary,
          },
        });
      }
    }

    return { conversation_id: conversation.id.toString(), bot_reply: botReply, escalated: classification.should_escalate, status: newStatus };
  } catch (err) {
    app.log.error(err, 'Support message processing failed');
    return reply.code(500).send({ conversation_id: conversation.id.toString(), bot_reply: 'Sorry, something went wrong. Please try again.', escalated: false, status: conversation.status });
  }
}
