<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobOffer extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_id',
        'rider_id',
        'status',
        'expires_at',
        'responded_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'responded_at' => 'datetime',
        ];
    }

    public function deliveryJob()
    {
        return $this->belongsTo(DeliveryJob::class, 'job_id');
    }

    public function rider()
    {
        return $this->belongsTo(Rider::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}

