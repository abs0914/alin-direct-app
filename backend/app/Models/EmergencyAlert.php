<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmergencyAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'rider_id',
        'branch_id',
        'lat',
        'lng',
        'status',
        'emergency_job_id',
        'responded_by_rider_id',
        'notes',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'lat'         => 'decimal:7',
            'lng'         => 'decimal:7',
            'resolved_at' => 'datetime',
        ];
    }

    // ── Relationships ────────────────────────────────

    public function rider()
    {
        return $this->belongsTo(Rider::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function emergencyJob()
    {
        return $this->belongsTo(DeliveryJob::class, 'emergency_job_id');
    }

    public function respondedByRider()
    {
        return $this->belongsTo(Rider::class, 'responded_by_rider_id');
    }

    // ── Status helpers ───────────────────────────────

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isResponding(): bool
    {
        return $this->status === 'responding';
    }

    public function isResolved(): bool
    {
        return in_array($this->status, ['resolved', 'cancelled']);
    }
}

