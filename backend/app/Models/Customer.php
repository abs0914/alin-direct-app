<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'company_name',
        'default_address',
        'default_lat',
        'default_lng',
        'maya_customer_id',
        'total_bookings',
    ];

    protected function casts(): array
    {
        return [
            'default_lat' => 'decimal:7',
            'default_lng' => 'decimal:7',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function deliveryJobs()
    {
        return $this->hasManyThrough(DeliveryJob::class, User::class, 'id', 'sender_id', 'user_id', 'id');
    }
}

