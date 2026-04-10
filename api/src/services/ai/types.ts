export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Classification {
  intent: string;
  confidence: number;
  sentiment: number;
  should_escalate: boolean;
  escalation_reason: string | null;
}

export interface AiDriver {
  chat(messages: AiMessage[], systemPrompt: string, useEscalationModel?: boolean): Promise<string>;
  classify(userMessage: string, conversationHistory?: string): Promise<Classification>;
  summarize(messages: { sender_type: string; body: string }[]): Promise<string>;
}
