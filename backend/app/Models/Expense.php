<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Expense extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'branch_id',
        'category',
        'vendor_name',
        'amount',
        'payment_method',
        'reference_number',
        'description',
        'receipt_path',
        'created_by',
        'daily_closing_id',
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

