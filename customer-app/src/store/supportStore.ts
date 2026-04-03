// ============================================================
// ALiN Move Customer App - Support Store
// ============================================================
// Manages in-memory support conversation state.
// In DEMO_MODE: provides scripted bot responses.
// In LIVE_MODE: acts as a cache layer; real data comes from API.

import { SupportConversation, SupportMessage, SendMessageResponse, ConversationStatus } from '../types';

// ── In-memory state ───────────────────────────────────────

let demoConversations: SupportConversation[] = [];
let demoNextConvId = 1000;
let demoNextMsgId = 5000;

// ── Demo bot response scripts ─────────────────────────────

const BOT_RESPONSES: { keywords: string[]; reply: string }[] = [
  {
    keywords: ['track', 'saan', 'nasaan', 'where', 'status', 'parcel', 'package'],
    reply:
      "Para ma-track ang iyong delivery, pumunta sa Home tab at i-tap ang iyong active booking. " +
      "Makikita mo ang real-time na status at location ng iyong rider. " +
      "Kung wala kang makitang active booking, i-tap ang 'Track Shipment' at ilagay ang iyong tracking number. " +
      "May iba pa ba akong matutulungan sa iyo? 😊",
  },
  {
    keywords: ['price', 'presyo', 'magkano', 'how much', 'cost', 'fee', 'rate'],
    reply:
      "Ang aming rates ay depende sa laki ng package at uri ng serbisyo:\n\n" +
      "📦 Pouch (XS–L): ₱120 – ₱350\n" +
      "📦 Box (1kg–XL): ₱350 – ₱3,500\n\n" +
      "Para makakuha ng exact na quote, i-tap ang 'Book a Delivery' at i-fill out ang mga detalye — " +
      "makikita mo ang exact na presyo bago mo i-confirm ang booking. " +
      "May tanong ka pa ba tungkol sa pricing?",
  },
  {
    keywords: ['rider', 'driver', 'hindi dumating', 'late', 'delayed', 'walang'],
    reply:
      "Pasensya na sa abala! Iko-connect kita sa aming support team para maresolba ito agad. " +
      "Habang hinihintay, i-check mo rin ang tracking page para sa pinakabagong status ng iyong rider. " +
      "Ang iyong concern ay nirerecord na at ang isang ahente ay makikipag-ugnayan sa iyo sa lalong madaling panahon.",
  },
  {
    keywords: ['payment', 'bayad', 'bayaran', 'cod', 'online', 'gcash', 'maya'],
    reply:
      "Ang ALiN Move ay tumatanggap ng mga sumusunod na paraan ng pagbabayad:\n\n" +
      "💳 Online Payment – Maya / GCash (kapag nag-book)\n" +
      "💵 Cash on Delivery (COD) – bayad sa rider pagdating\n\n" +
      "Ang COD ay available para sa mga domestic deliveries. " +
      "Kung may issue ka sa payment, sabihin mo sa akin ang tracking number mo at tulungan kita.",
  },
  {
    keywords: ['cancel', 'kanselahin', 'i-cancel', 'bawiin'],
    reply:
      "Pwede mo i-cancel ang booking hanggang hindi pa tinatanggap ng rider. " +
      "Pumunta sa iyong active booking sa Home tab at i-tap ang 'Cancel'. " +
      "Kung tinanggap na ng rider ang job, pakicontact ang support para sa manual cancellation. " +
      "Kailangan mo ba ng tulong sa ibang bagay?",
  },
  {
    keywords: ['damage', 'sira', 'broken', 'nasira', 'nawala', 'lost'],
    reply:
      "Pasensya na sa nangyari! Iko-escalate ko kaagad ang iyong concern sa aming claims team. " +
      "Para mapabilis ang proseso, ihanda ang:\n\n" +
      "1. Tracking number ng delivery\n" +
      "2. Larawan ng damaged/missing item\n" +
      "3. Resibo o proof of value\n\n" +
      "Ang isang ahente ay makikipag-ugnayan sa iyo sa loob ng 30 minuto.",
  },
  {
    keywords: ['agent', 'human', 'tao', 'representative', 'rep', 'speak', 'talk'],
    reply:
      "Sige! Iko-connect kita sa aming live support agent. " +
      "I've already noted your concern. Please hold on for a moment — " +
      "an agent will be with you shortly. 🙏",
  },
];

const DEFAULT_BOT_REPLY =
  "Salamat sa pagcontact sa ALiN Move Support! " +
  "Paano kita matutulungan ngayon? Maaari kang magtanong tungkol sa:\n\n" +
  "• 📦 Status ng delivery\n" +
  "• 💰 Presyo at serbisyo\n" +
  "• 🚨 Issue sa rider o delivery\n" +
  "• 💳 Payment concerns";

const ESCALATION_KEYWORDS = ['damage', 'sira', 'broken', 'nawala', 'lost', 'agent', 'human', 'tao', 'rider hindi', 'hindi dumating'];

function getBotReply(message: string): { reply: string; escalated: boolean } {
  const lower = message.toLowerCase();

  const shouldEscalate = ESCALATION_KEYWORDS.some((kw) => lower.includes(kw));

  for (const script of BOT_RESPONSES) {
    if (script.keywords.some((kw) => lower.includes(kw))) {
      return { reply: script.reply, escalated: shouldEscalate };
    }
  }

  return { reply: DEFAULT_BOT_REPLY, escalated: false };
}

function makeMsg(conversationId: number, senderType: SupportMessage['sender_type'], body: string): SupportMessage {
  return {
    id: demoNextMsgId++,
    conversation_id: conversationId,
    sender_type: senderType,
    body,
    message_type: 'text',
    created_at: new Date().toISOString(),
  };
}

// ── Public API ────────────────────────────────────────────

export function getDemoConversations(): SupportConversation[] {
  return [...demoConversations].sort(
    (a, b) => new Date(b.last_message_at ?? b.created_at).getTime() -
               new Date(a.last_message_at ?? a.created_at).getTime(),
  );
}

export function getDemoConversation(conversationId: number): SupportConversation {
  const conv = demoConversations.find((c) => c.id === conversationId);
  if (!conv) throw new Error(`Demo conversation ${conversationId} not found`);
  return conv;
}

export function sendDemoMessage(conversationId: number | null, text: string): SendMessageResponse {
  let conv: SupportConversation;

  if (conversationId === null || !demoConversations.find((c) => c.id === conversationId)) {
    // Create new conversation
    conv = {
      id: demoNextConvId++,
      status: 'bot_handling',
      intent: null,
      escalation_flag: false,
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      messages: [],
    };
    demoConversations.push(conv);
  } else {
    conv = demoConversations.find((c) => c.id === conversationId)!;
  }

  // Add user message
  const userMsg = makeMsg(conv.id, 'customer', text);
  conv.messages = [...(conv.messages ?? []), userMsg];
  conv.last_message_at = userMsg.created_at;

  // Generate bot reply (slight artificial delay handled in UI)
  const { reply, escalated } = getBotReply(text);

  const botMsg = makeMsg(conv.id, 'bot', reply);
  conv.messages = [...conv.messages, botMsg];
  conv.last_message_at = botMsg.created_at;

  // Update status
  const newStatus: ConversationStatus = escalated ? 'pending_agent' : 'bot_handling';
  conv.status = newStatus;
  conv.escalation_flag = escalated;

  return {
    conversation_id: conv.id,
    bot_reply: reply,
    escalated,
    status: newStatus,
  };
}

export function closeDemoConversation(conversationId: number): void {
  const conv = demoConversations.find((c) => c.id === conversationId);
  if (conv) conv.status = 'closed';
}

export function resetSupportState(): void {
  demoConversations = [];
}
