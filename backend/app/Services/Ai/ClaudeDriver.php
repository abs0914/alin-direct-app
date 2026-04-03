<?php

namespace App\Services\Ai;

use App\Contracts\AiDriver;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ClaudeDriver implements AiDriver
{
    private string $apiKey;
    private string $routineModel;
    private string $escalationModel;
    private string $baseUrl = 'https://api.anthropic.com/v1';

    public function __construct()
    {
        $this->apiKey          = config('ai.claude.api_key');
        $this->routineModel    = config('ai.claude.routine_model');
        $this->escalationModel = config('ai.claude.escalation_model');
    }

    public function chat(array $messages, string $systemPrompt, bool $useEscalationModel = false): string
    {
        $model = $useEscalationModel ? $this->escalationModel : $this->routineModel;

        $response = Http::withHeaders([
            'x-api-key'         => $this->apiKey,
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ])->timeout(30)->post("{$this->baseUrl}/messages", [
            'model'      => $model,
            'max_tokens' => 1024,
            'system'     => $systemPrompt,
            'messages'   => $messages,
        ]);

        if ($response->failed()) {
            Log::error('Claude API error', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \RuntimeException('AI service unavailable. Please try again.');
        }

        return $response->json('content.0.text', '');
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

        $decoded = json_decode(trim($raw), true);

        if (! is_array($decoded)) {
            Log::warning('Claude classification returned invalid JSON', ['raw' => $raw]);
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
            true,
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
