<?php

namespace App\Services\Ai;

use App\Contracts\AiDriver;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaDriver implements AiDriver
{
    private string $baseUrl;
    private string $model;

    public function __construct()
    {
        $this->baseUrl = config('ai.ollama.base_url', 'http://localhost:11434');
        $this->model   = config('ai.ollama.model', 'qwen2.5:7b');
    }

    public function chat(array $messages, string $systemPrompt, bool $useEscalationModel = false): string
    {
        $payload = [
            'model'    => $this->model,
            'stream'   => false,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ...$messages,
            ],
        ];

        $response = Http::timeout(60)->post("{$this->baseUrl}/v1/chat/completions", $payload);

        if ($response->failed()) {
            Log::error('Ollama API error', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \RuntimeException('AI service unavailable. Please try again.');
        }

        return $response->json('choices.0.message.content', '');
    }

    public function classify(string $userMessage, string $conversationHistory = ''): array
    {
        $prompt = <<<PROMPT
Classify this customer support message for a Philippine delivery/logistics app called ALiN Move.

Conversation history:
{$conversationHistory}

Latest message: "{$userMessage}"

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "intent": "tracking|pricing|complaint|damage|payment|account|escalation|other",
  "confidence": 0-100,
  "sentiment": -2 to 2,
  "should_escalate": true|false,
  "escalation_reason": "string or null"
}

Escalate if: damage claim, refund request, rider misconduct, payment dispute, fraud suspicion, or strong negative sentiment with unresolved issue.
PROMPT;

        $raw = $this->chat(
            [['role' => 'user', 'content' => $prompt]],
            'You are a classification engine. Return only valid JSON.',
        );

        // Strip markdown code fences if model wraps output
        $clean   = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($raw));
        $decoded = json_decode($clean, true);

        if (! is_array($decoded)) {
            Log::warning('Ollama classification returned invalid JSON', ['raw' => $raw]);
            return $this->defaultClassification();
        }

        return $decoded;
    }

    public function summarize(array $messages): string
    {
        $transcript = collect($messages)
            ->map(fn ($m) => ucfirst($m['sender_type']) . ': ' . $m['body'])
            ->implode("\n");

        return $this->chat(
            [['role' => 'user', 'content' => "Summarize this support conversation in 2-3 sentences for the agent taking over:\n\n{$transcript}"]],
            'You are a support assistant summarizer. Be concise and factual.',
        );
    }

    private function defaultClassification(): array
    {
        return [
            'intent'            => 'other',
            'confidence'        => 50,
            'sentiment'         => 0,
            'should_escalate'   => false,
            'escalation_reason' => null,
        ];
    }
}
