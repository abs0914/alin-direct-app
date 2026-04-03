<?php

namespace App\Services;

use App\Contracts\AiDriver;
use App\Models\DeliveryJob;
use App\Models\KnowledgeArticle;
use App\Models\SupportConversation;
use Illuminate\Support\Carbon;

class SupportAiService
{
    public function __construct(private readonly AiDriver $driver) {}

    // ── Public API ────────────────────────────────────

    /**
     * Process a new user message: classify it, build context, generate a reply,
     * decide whether to escalate.
     *
     * Returns:
     *   reply        - string (bot reply to show customer)
     *   intent       - string
     *   confidence   - int
     *   sentiment    - int
     *   should_escalate  - bool
     *   escalation_reason - string|null
     */
    public function handleMessage(SupportConversation $conversation, string $userMessage): array
    {
        // Build conversation history for context
        $history = $this->buildHistory($conversation);

        // 1. Classify the message
        $classification = $this->driver->classify($userMessage, $history);

        // 2. Determine if escalation should happen automatically
        $shouldEscalate = $classification['should_escalate'] ?? false;

        // Critical intents always escalate
        if (in_array($classification['intent'] ?? '', ['damage', 'escalation'])) {
            $shouldEscalate = true;
        }

        // Very negative sentiment with complaint = escalate
        if (($classification['sentiment'] ?? 0) <= -2 && $classification['intent'] === 'complaint') {
            $shouldEscalate = true;
        }

        if ($shouldEscalate) {
            $reply = $this->escalationReply();
            return array_merge($classification, [
                'reply'          => $reply,
                'should_escalate' => true,
            ]);
        }

        // 3. Build system prompt with live context + knowledge base
        $systemPrompt = $this->buildSystemPrompt($conversation, $classification['intent'] ?? 'other');

        // 4. Generate reply
        $messages   = $this->formatMessagesForApi($conversation, $userMessage);
        $reply      = $this->driver->chat($messages, $systemPrompt);

        return array_merge($classification, [
            'reply'          => $reply,
            'should_escalate' => false,
        ]);
    }

    /**
     * Generate an AI summary of the full conversation for agent handoff.
     */
    public function generateHandoffSummary(SupportConversation $conversation): string
    {
        $messages = $conversation->messages()
            ->whereIn('message_type', ['text'])
            ->get(['sender_type', 'body'])
            ->toArray();

        if (empty($messages)) {
            return 'No messages in conversation.';
        }

        return $this->driver->summarize($messages);
    }

    // ── Private helpers ───────────────────────────────

    private function buildSystemPrompt(SupportConversation $conversation, string $intent): string
    {
        $brand  = 'ALiN Move';
        $now    = Carbon::now()->format('D, M j Y h:i A');
        $lang   = 'Filipino, Taglish, or English';

        // Live delivery context
        $deliveryContext = '';
        $job = $conversation->deliveryJob
            ?? ($conversation->user->customer?->deliveryJobs()->latest()->first());

        if ($job) {
            $deliveryContext = <<<CTX

--- CURRENT DELIVERY ---
Tracking: {$job->tracking_uuid}
Status: {$job->status}
Pickup: {$job->pickup_address}
Dropoff: {$job->dropoff_address}
Vehicle: {$job->vehicle_type}
Fee: ₱{$job->total_price}
Payment: {$job->payment_status}
CTX;
        }

        // Knowledge base for this intent
        $kb = KnowledgeArticle::activeForCategory($intent)
            ->merge(KnowledgeArticle::activeForCategory('policy'))
            ->map(fn ($a) => "### {$a->title}\n{$a->content}")
            ->implode("\n\n");

        $kbSection = $kb ? "\n--- KNOWLEDGE BASE ---\n{$kb}\n" : '';

        return <<<PROMPT
You are a helpful customer support agent for {$brand}, a Philippine logistics and delivery platform.
Current date/time: {$now}
Reply in {$lang} — match the language the customer uses.
Be concise, warm, and helpful. Use short paragraphs.
Never make up tracking numbers, prices, or ETAs — only use the data provided.
If you cannot resolve the issue, tell the customer you will connect them to a live agent.
{$deliveryContext}
{$kbSection}
PROMPT;
    }

    private function buildHistory(SupportConversation $conversation): string
    {
        return $conversation->messages()
            ->whereIn('message_type', ['text'])
            ->latest()
            ->limit(10)
            ->get()
            ->reverse()
            ->map(fn ($m) => ucfirst($m->sender_type) . ': ' . $m->body)
            ->implode("\n");
    }

    private function formatMessagesForApi(SupportConversation $conversation, string $latestMessage): array
    {
        $history = $conversation->messages()
            ->whereIn('message_type', ['text'])
            ->latest()
            ->limit(20)
            ->get()
            ->reverse()
            ->map(fn ($m) => [
                'role'    => in_array($m->sender_type, ['bot', 'agent']) ? 'assistant' : 'user',
                'content' => $m->body,
            ])
            ->toArray();

        $history[] = ['role' => 'user', 'content' => $latestMessage];

        return $history;
    }

    private function escalationReply(): string
    {
        return "I understand this is an urgent concern. I'm connecting you to a support specialist now. "
            . "I've already shared your details and the summary of your concern so you won't need to repeat everything. "
            . "Please hold on for a moment.";
    }
}
