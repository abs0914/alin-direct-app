<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'sender_type',
        'sender_id',
        'body',
        'message_type',
        'attachment_url',
        'ai_confidence',
        'ai_metadata',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'ai_metadata' => 'array',
            'read_at'     => 'datetime',
        ];
    }

    // ── Relationships ────────────────────────────────

    public function conversation()
    {
        return $this->belongsTo(SupportConversation::class, 'conversation_id');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    // ── Helpers ──────────────────────────────────────

    public function isFromBot(): bool
    {
        return $this->sender_type === 'bot';
    }

    public function isInternal(): bool
    {
        return $this->message_type === 'internal_note';
    }
}
