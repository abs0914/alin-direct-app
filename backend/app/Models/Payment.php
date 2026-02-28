<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_id',
        'user_id',
        'provider',
        'type',
        'reference_no',
        'maya_checkout_id',
        'maya_payment_id',
        'amount',
        'currency',
        'status',
        'payload_json',
        'webhook_payload',
        'idempotency_key',
        'failure_reason',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payload_json' => 'array',
            'webhook_payload' => 'array',
        ];
    }

    public function deliveryJob()
    {
        return $this->belongsTo(DeliveryJob::class, 'job_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

