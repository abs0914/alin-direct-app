/**
 * Claude AI driver — port of backend/app/Services/Ai/ClaudeDriver.php
 */
import axios from 'axios';
import { AiDriver, AiMessage, Classification } from './types.js';

const BASE_URL = 'https://api.anthropic.com/v1';

export class ClaudeDriver implements AiDriver {
  private readonly apiKey: string;
  private readonly routineModel: string;
  private readonly escalationModel: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY ?? '';
    this.routineModel = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';
    this.escalationModel = process.env.CLAUDE_ESCALATION_MODEL ?? 'claude-opus-4-6';
  }

  async chat(
    messages: AiMessage[],
    systemPrompt: string,
    useEscalationModel = false,
  ): Promise<string> {
    const model = useEscalationModel ? this.escalationModel : this.routineModel;

    const response = await axios.post(
      `${BASE_URL}/messages`,
      { model, max_tokens: 1024, system: systemPrompt, messages },
      {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        timeout: 30_000,
      },
    );

    return response.data?.content?.[0]?.text ?? '';
  }

  async classify(userMessage: string, conversationHistory = ''): Promise<Classification> {
    const prompt = `Classify this customer support message for a Philippine delivery/logistics app called ALiN Move.

Conversation history:
${conversationHistory}

Latest message: "${userMessage}"

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "intent": "tracking|pricing|complaint|damage|payment|account|escalation|other",
  "confidence": 0-100,
  "sentiment": -2 to 2,
  "should_escalate": true|false,
  "escalation_reason": "string or null"
}

Escalate if: damage claim, refund request, rider misconduct, payment dispute, fraud suspicion, or strong negative sentiment with unresolved issue.`;

    const raw = await this.chat(
      [{ role: 'user', content: prompt }],
      'You are a classification engine. Return only valid JSON.',
    );

    try {
      const parsed = JSON.parse(raw.trim()) as Classification;
      return parsed;
    } catch {
      console.warn('Claude classification returned invalid JSON', raw);
      return this.defaultClassification();
    }
  }

  async summarize(messages: { sender_type: string; body: string }[]): Promise<string> {
    const transcript = messages
      .map((m) => `${m.sender_type.charAt(0).toUpperCase() + m.sender_type.slice(1)}: ${m.body}`)
      .join('\n');

    return this.chat(
      [
        {
          role: 'user',
          content: `Summarize this support conversation in 2-3 sentences for the agent taking over:\n\n${transcript}`,
        },
      ],
      'You are a support assistant summarizer. Be concise and factual.',
      true,
    );
  }

  private defaultClassification(): Classification {
    return {
      intent: 'other',
      confidence: 50,
      sentiment: 0,
      should_escalate: false,
      escalation_reason: null,
    };
  }
}
