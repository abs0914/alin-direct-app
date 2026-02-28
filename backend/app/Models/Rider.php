<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rider extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'branch_id',
        'vehicle_type',
        'plate_number',
        'vehicle_brand',
        'vehicle_model',
        'vehicle_color',
        'status',
        'availability',
        'current_lat',
        'current_lng',
        'last_seen_at',
        'license_url',
        'or_cr_url',
        'nbi_clearance_url',
        'selfie_url',
        'kyc_verified_at',
        'kyc_verified_by',
        'terms_accepted',
        'terms_accepted_at',
        'maya_wallet_id',
        'maya_phone',
        'rating',
        'total_deliveries',
    ];

    protected function casts(): array
    {
        return [
            'current_lat' => 'decimal:7',
            'current_lng' => 'decimal:7',
            'last_seen_at' => 'datetime',
            'kyc_verified_at' => 'datetime',
            'terms_accepted' => 'boolean',
            'terms_accepted_at' => 'datetime',
            'rating' => 'decimal:2',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function deliveryJobs()
    {
        return $this->hasMany(DeliveryJob::class);
    }

    public function jobOffers()
    {
        return $this->hasMany(JobOffer::class);
    }

    public function payoutRequests()
    {
        return $this->hasMany(PayoutRequest::class);
    }

    public function kycVerifiedBy()
    {
        return $this->belongsTo(User::class, 'kyc_verified_by');
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isOnline(): bool
    {
        return $this->availability === 'online';
    }

    public function isAvailableForJob(): bool
    {
        return $this->isApproved() && $this->isOnline();
    }
}

