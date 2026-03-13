<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalesTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'branch_id',
        'service_id',
        'amount',
        'payment_method',
        'reference_number',
        'customer_name',
        'created_by',
        'daily_closing_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    // ── Relationships ──────────────────────────────

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function dailyClosing()
    {
        return $this->belongsTo(DailyClosing::class);
    }

    // ── Helpers ──────────────────────────────

    public function isLocked(): bool
    {
        return $this->dailyClosing?->status === 'closed';
    }
}

