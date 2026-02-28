<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class DeliveryJob extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tracking_uuid', 'sender_id', 'rider_id', 'branch_id', 'created_by',
        'status', 'vehicle_type',
        'pickup_contact_name', 'pickup_contact_phone', 'pickup_address',
        'pickup_lat', 'pickup_lng', 'pickup_notes',
        'dropoff_contact_name', 'dropoff_contact_phone', 'dropoff_address',
        'dropoff_lat', 'dropoff_lng', 'dropoff_notes',
        'package_description', 'package_size', 'package_weight_kg',
        'distance_km', 'base_fare', 'distance_fare', 'surge_multiplier',
        'total_price', 'rider_earnings', 'platform_commission',
        'payment_method', 'payment_status', 'cod_collected', 'cod_settled',
        'cod_settled_at', 'cod_settled_by',
        'failure_reason', 'failure_notes',
        'accepted_at', 'picked_up_at', 'delivered_at', 'failed_at', 'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'pickup_lat' => 'decimal:7',
            'pickup_lng' => 'decimal:7',
            'dropoff_lat' => 'decimal:7',
            'dropoff_lng' => 'decimal:7',
            'distance_km' => 'decimal:2',
            'base_fare' => 'decimal:2',
            'distance_fare' => 'decimal:2',
            'surge_multiplier' => 'decimal:2',
            'total_price' => 'decimal:2',
            'rider_earnings' => 'decimal:2',
            'platform_commission' => 'decimal:2',
            'cod_collected' => 'boolean',
            'cod_settled' => 'boolean',
            'cod_settled_at' => 'datetime',
            'accepted_at' => 'datetime',
            'picked_up_at' => 'datetime',
            'delivered_at' => 'datetime',
            'failed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function ($job) {
            if (empty($job->tracking_uuid)) {
                $job->tracking_uuid = Str::uuid()->toString();
            }
        });
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function rider()
    {
        return $this->belongsTo(Rider::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function jobOffers()
    {
        return $this->hasMany(JobOffer::class, 'job_id');
    }

    public function proofOfDelivery()
    {
        return $this->hasOne(ProofOfDelivery::class, 'job_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'job_id');
    }

    public function ledgerEntries()
    {
        return $this->morphMany(LedgerEntry::class, 'reference');
    }
}

