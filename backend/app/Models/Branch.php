<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'type',
        'address',
        'city',
        'province',
        'lat',
        'lng',
        'service_radius_km',
        'phone',
        'email',
        'is_active',
        'operating_hours',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'decimal:7',
            'lng' => 'decimal:7',
            'service_radius_km' => 'decimal:2',
            'is_active' => 'boolean',
            'operating_hours' => 'array',
        ];
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function riders()
    {
        return $this->hasMany(Rider::class);
    }

    public function deliveryJobs()
    {
        return $this->hasMany(DeliveryJob::class);
    }

    public function salesTransactions()
    {
        return $this->hasMany(SalesTransaction::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function dailyClosings()
    {
        return $this->hasMany(DailyClosing::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
}

