<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyClosing extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'business_date',
        'opening_balance',
        'total_cash_sales',
        'total_digital_sales',
        'total_cash_expenses',
        'total_digital_expenses',
        'expected_cash',
        'actual_cash',
        'variance',
        'manager_notes',
        'closed_by',
        'closed_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'business_date' => 'date',
            'opening_balance' => 'decimal:2',
            'total_cash_sales' => 'decimal:2',
            'total_digital_sales' => 'decimal:2',
            'total_cash_expenses' => 'decimal:2',
            'total_digital_expenses' => 'decimal:2',
            'expected_cash' => 'decimal:2',
            'actual_cash' => 'decimal:2',
            'variance' => 'decimal:2',
            'closed_at' => 'datetime',
        ];
    }

    // ── Relationships ──────────────────────────────

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function closedByUser()
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function salesTransactions()
    {
        return $this->hasMany(SalesTransaction::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    // ── Helpers ──────────────────────────────

    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    public function totalSales(): float
    {
        return $this->total_cash_sales + $this->total_digital_sales;
    }

    public function totalExpenses(): float
    {
        return $this->total_cash_expenses + $this->total_digital_expenses;
    }

    public function netCashFlow(): float
    {
        return $this->totalSales() - $this->totalExpenses();
    }
}

