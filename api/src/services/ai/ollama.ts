/**
 * Ollama AI driver (local LLM fallback) — port of backend/app/Services/Ai/OllamaDriver.php
 */
import axios from 'axios';
import { AiDriver, AiMessage, Classification } from './types.js';

export class OllamaDriver implements AiDriver {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b';
  }

  async chat(messages: AiMessage[], systemPrompt: string): Promise<string> {
    const payload = {
      model: this.model,
      stream: false,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    };

    const response = await axios.post(`${this.baseUrl}/v1/chat/completions`, payload, {
      timeout: 60_000,
    });

    return response.data?.choices?.[0]?.message?.content ?? '';
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

    // Strip markdown code fences if the model wraps output
    const clean = raw.trim().replace(/^```(?:json)?\s*|\s*```$/gm, '');

    try {
      return JSON.parse(clean) as Classification;
    } catch {
      console.warn('Ollama classification returned invalid JSON', raw);
      return {
        intent: 'other',
        confidence: 50,
        sentiment: 0,
        should_escalate: false,
        escalation_reason: null,
      };
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
    );
  }
}
