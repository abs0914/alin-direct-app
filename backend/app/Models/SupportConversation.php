<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'channel',
        'status',
        'owner_type',
        'owner_agent_id',
        'branch_id',
        'delivery_job_id',
        'intent',
        'ai_confidence',
        'sentiment_score',
        'escalation_flag',
        'first_response_at',
        'resolved_at',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'escalation_flag'   => 'boolean',
            'first_response_at' => 'datetime',
            'resolved_at'       => 'datetime',
            'last_message_at'   => 'datetime',
        ];
    }

    // ── Relationships ────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function ownerAgent()
    {
        return $this->belongsTo(User::class, 'owner_agent_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function deliveryJob()
    {
        return $this->belongsTo(DeliveryJob::class);
    }

    public function messages()
    {
        return $this->hasMany(SupportMessage::class, 'conversation_id')->orderBy('created_at');
    }

    public function latestMessage()
    {
        return $this->hasOne(SupportMessage::class, 'conversation_id')->latestOfMany();
    }

    public function case()
    {
        return $this->hasOne(SupportCase::class, 'conversation_id');
    }

    // ── Status helpers ───────────────────────────────

    public function isOpen(): bool
    {
        return in_array($this->status, ['open', 'bot_handling', 'pending_agent', 'agent_active']);
    }

    public function needsAgent(): bool
    {
        return $this->escalation_flag || $this->status === 'pending_agent';
    }

    public function markEscalated(string $ownerType = 'hq', ?int $branchId = null): void
    {
        $this->update([
            'escalation_flag' => true,
            'status'          => 'pending_agent',
            'owner_type'      => $ownerType,
            'branch_id'       => $branchId ?? $this->branch_id,
        ]);
    }
}
