<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected $fillable = [
        'supabase_id',
        'name',
        'phone',
        'email',
        'password',
        'user_type',
        'is_active',
        'avatar_url',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    // ── Relationships ──────────────────────────────

    public function rider()
    {
        return $this->hasOne(Rider::class);
    }

    public function customer()
    {
        return $this->hasOne(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    // ── Helpers ────────────────────────────────────

    public function isAdmin(): bool
    {
        return $this->user_type === 'admin';
    }

    public function isBranchManager(): bool
    {
        return $this->user_type === 'branch_manager';
    }

    public function isRider(): bool
    {
        return $this->user_type === 'rider';
    }

    public function isCustomer(): bool
    {
        return $this->user_type === 'customer';
    }
}
