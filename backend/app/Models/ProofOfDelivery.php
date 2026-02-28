<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProofOfDelivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_id',
        'photo_url',
        'signature_url',
        'recipient_name',
        'relationship',
        'delivery_lat',
        'delivery_lng',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'delivery_lat' => 'decimal:7',
            'delivery_lng' => 'decimal:7',
        ];
    }

    public function deliveryJob()
    {
        return $this->belongsTo(DeliveryJob::class, 'job_id');
    }
}

