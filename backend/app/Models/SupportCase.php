<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'delivery_job_id',
        'branch_id',
        'category',
        'subcategory',
        'priority',
        'assigned_team',
        'assigned_agent_id',
        'sla_due_at',
        'status',
        'resolution_code',
        'resolution_notes',
        'resolved_at',
        'resolved_by',
        'ai_summary',
    ];

    protected function casts(): array
    {
        return [
            'sla_due_at'  => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    // ── Relationships ────────────────────────────────

    public function conversation()
    {
        return $this->belongsTo(SupportConversation::class, 'conversation_id');
    }

    public function deliveryJob()
    {
        return $this->belongsTo(DeliveryJob::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function assignedAgent()
    {
        return $this->belongsTo(User::class, 'assigned_agent_id');
    }

    public function resolvedBy()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    // ── Helpers ──────────────────────────────────────

    public function isBreachingSla(): bool
    {
        return $this->sla_due_at && $this->sla_due_at->isPast() && $this->status !== 'resolved';
    }

    public function isCritical(): bool
    {
        return $this->priority === 'critical';
    }
}
