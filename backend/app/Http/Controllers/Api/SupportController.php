<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportConversation;
use App\Models\SupportMessage;
use App\Models\SupportCase;
use App\Services\SupportAiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SupportController extends Controller
{
    public function __construct(private readonly SupportAiService $ai) {}

    // ── POST /api/customer/support/start ─────────────
    // Start a new support conversation or return an existing open one.

    public function start(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'message'         => 'required|string|max:2000',
            'delivery_job_id' => 'nullable|integer|exists:delivery_jobs,id',
            'channel'         => 'nullable|string|in:app,web,messenger',
        ]);

        // Reuse an open conversation if one exists
        $conversation = SupportConversation::where('user_id', $user->id)
            ->whereIn('status', ['open', 'bot_handling', 'pending_agent'])
            ->latest()
            ->first();

        if (! $conversation) {
            $conversation = SupportConversation::create([
                'user_id'         => $user->id,
                'channel'         => $validated['channel'] ?? 'app',
                'status'          => 'bot_handling',
                'owner_type'      => 'bot',
                'branch_id'       => $user->branch_id ?? $user->customer?->branch_id ?? null,
                'delivery_job_id' => $validated['delivery_job_id'] ?? null,
                'last_message_at' => now(),
            ]);
        }

        return $this->sendMessage($conversation, $user, $validated['message']);
    }

    // ── POST /api/customer/support/conversations/{id}/message ──
    // Send a message to an existing conversation.

    public function message(Request $request, int $conversationId): JsonResponse
    {
        $user = $request->user();

        $conversation = SupportConversation::where('user_id', $user->id)
            ->where('id', $conversationId)
            ->firstOrFail();

        if (! $conversation->isOpen()) {
            return response()->json(['message' => 'This conversation is already closed.'], 422);
        }

        $validated = $request->validate(['message' => 'required|string|max:2000']);

        return $this->sendMessage($conversation, $user, $validated['message']);
    }

    // ── GET /api/customer/support/conversations ───────
    // List the user's support conversations.

    public function conversations(Request $request): JsonResponse
    {
        $conversations = SupportConversation::where('user_id', $request->user()->id)
            ->with(['latestMessage', 'case:id,conversation_id,category,priority,status'])
            ->orderByDesc('last_message_at')
            ->limit(20)
            ->get();

        return response()->json($conversations);
    }

    // ── GET /api/customer/support/conversations/{id} ──
    // Full conversation with all messages.

    public function show(Request $request, int $conversationId): JsonResponse
    {
        $conversation = SupportConversation::where('user_id', $request->user()->id)
            ->with(['messages', 'case', 'deliveryJob:id,tracking_uuid,status'])
            ->findOrFail($conversationId);

        // Mark all messages as read
        $conversation->messages()
            ->whereNull('read_at')
            ->whereNotIn('sender_type', ['customer', 'rider'])
            ->update(['read_at' => now()]);

        return response()->json($conversation);
    }

    // ── POST /api/customer/support/conversations/{id}/close ──
    // Customer closes the conversation.

    public function close(Request $request, int $conversationId): JsonResponse
    {
        $conversation = SupportConversation::where('user_id', $request->user()->id)
            ->findOrFail($conversationId);

        $conversation->update([
            'status'      => 'closed',
            'resolved_at' => now(),
        ]);

        if ($conversation->case) {
            $conversation->case->update([
                'status'          => 'closed',
                'resolution_code' => 'customer_closed',
                'resolved_at'     => now(),
            ]);
        }

        return response()->json(['message' => 'Conversation closed.']);
    }

    // ── PUT /api/me/push-token ────────────────────────
    // Register Expo push token for this user.

    public function updatePushToken(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'expo_push_token' => 'required|string|starts_with:ExponentPushToken[',
        ]);

        $request->user()->update(['expo_push_token' => $validated['expo_push_token']]);

        return response()->json(['message' => 'Push token registered.']);
    }

    // ── Private ───────────────────────────────────────

    private function sendMessage(SupportConversation $conversation, $user, string $text): JsonResponse
    {
        DB::beginTransaction();
        try {
            // Save user's message
            $senderType = $user->user_type === 'rider' ? 'rider' : 'customer';
            SupportMessage::create([
                'conversation_id' => $conversation->id,
                'sender_type'     => $senderType,
                'sender_id'       => $user->id,
                'body'            => $text,
                'message_type'    => 'text',
            ]);

            $conversation->update(['last_message_at' => now()]);

            // If already with an agent, don't process through bot
            if ($conversation->status === 'agent_active') {
                DB::commit();
                return response()->json([
                    'conversation_id' => $conversation->id,
                    'bot_reply'       => null,
                    'escalated'       => false,
                    'status'          => $conversation->status,
                ]);
            }

            // Process through AI
            $result = $this->ai->handleMessage($conversation, $text);

            // Save bot reply
            $botMessage = SupportMessage::create([
                'conversation_id' => $conversation->id,
                'sender_type'     => 'bot',
                'sender_id'       => null,
                'body'            => $result['reply'],
                'message_type'    => 'text',
                'ai_confidence'   => $result['confidence'] ?? null,
                'ai_metadata'     => [
                    'intent'            => $result['intent'] ?? null,
                    'sentiment'         => $result['sentiment'] ?? null,
                    'escalation_reason' => $result['escalation_reason'] ?? null,
                ],
            ]);

            // Update conversation classification
            $conversation->update([
                'intent'          => $result['intent'] ?? $conversation->intent,
                'ai_confidence'   => $result['confidence'] ?? null,
                'sentiment_score' => $result['sentiment'] ?? null,
                'status'          => $result['should_escalate'] ? 'pending_agent' : 'bot_handling',
                'escalation_flag' => $result['should_escalate'],
                'last_message_at' => now(),
            ]);

            // Create or update case on escalation
            if ($result['should_escalate']) {
                $conversation->markEscalated();

                $summary = $this->ai->generateHandoffSummary($conversation->fresh());

                SupportCase::updateOrCreate(
                    ['conversation_id' => $conversation->id],
                    [
                        'delivery_job_id'   => $conversation->delivery_job_id,
                        'branch_id'         => $conversation->branch_id,
                        'category'          => $result['intent'] ?? 'other',
                        'priority'          => $this->derivePriority($result),
                        'assigned_team'     => $this->deriveTeam($result['intent'] ?? 'other'),
                        'sla_due_at'        => $this->deriveSla($result),
                        'status'            => 'open',
                        'ai_summary'        => $summary,
                    ]
                );

                Log::info('Support case escalated', [
                    'conversation_id'   => $conversation->id,
                    'user_id'           => $user->id,
                    'intent'            => $result['intent'],
                    'escalation_reason' => $result['escalation_reason'],
                ]);
            }

            DB::commit();

            return response()->json([
                'conversation_id' => $conversation->id,
                'bot_reply'       => $result['reply'],
                'escalated'       => $result['should_escalate'],
                'status'          => $conversation->fresh()->status,
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Support message processing failed', ['error' => $e->getMessage()]);

            return response()->json([
                'conversation_id' => $conversation->id,
                'bot_reply'       => 'Sorry, something went wrong. Please try again.',
                'escalated'       => false,
                'status'          => $conversation->status,
            ], 500);
        }
    }

    private function derivePriority(array $result): string
    {
        $intent    = $result['intent'] ?? 'other';
        $sentiment = $result['sentiment'] ?? 0;

        if (in_array($intent, ['damage', 'escalation'])) return 'critical';
        if ($sentiment <= -2) return 'high';
        if (in_array($intent, ['complaint', 'payment'])) return 'high';

        return 'normal';
    }

    private function deriveTeam(string $intent): string
    {
        return match ($intent) {
            'damage', 'payment'   => 'hq',
            'complaint'           => 'branch',
            default               => 'branch',
        };
    }

    private function deriveSla(array $result): Carbon
    {
        $priority = $this->derivePriority($result);

        return match ($priority) {
            'critical' => now()->addMinutes(15),
            'high'     => now()->addMinutes(30),
            default    => now()->addHours(4),
        };
    }
}
