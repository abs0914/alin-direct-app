<?php

namespace App\Models;

use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements FilamentUser
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
        'branch_id',
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

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    // ── Helpers ────────────────────────────────────

    public function canAccessPanel(Panel $panel): bool
    {
        return match ($panel->getId()) {
            'admin' => $this->canAccessAdminPortal(),
            'branch' => $this->canAccessBranchPortal(),
            default => false,
        };
    }

    public function hasUserTypeOrRole(array|string $values): bool
    {
        $values = is_array($values) ? $values : [$values];
        $expanded = [];

        foreach ($values as $value) {
            $expanded[] = $value;

            if ($value === 'staff') {
                $expanded[] = 'dispatcher';
            }
        }

        $expanded = array_values(array_unique($expanded));

        return in_array($this->user_type, $expanded, true)
            || $this->hasAnyRole($expanded);
    }

    public function primaryRoleFromUserType(): ?string
    {
        return match ($this->user_type) {
            'admin' => 'admin',
            'hq_admin' => 'hq_admin',
            'branch_owner' => 'branch_owner',
            'branch_manager' => 'branch_manager',
            'staff', 'dispatcher' => 'staff',
            'rider' => 'rider',
            'customer' => 'customer',
            default => null,
        };
    }

    public function syncPrimaryRoleFromUserType(): void
    {
        $role = $this->primaryRoleFromUserType();

        if (! $role) {
            return;
        }

        $roles = $this->roles()->pluck('name')->all();
        $roles = array_diff($roles, ['dispatcher']);
        $roles[] = $role;

        $this->syncRoles(array_values(array_unique($roles)));
    }

    public function canAccessAdminPortal(): bool
    {
        return $this->is_active
            && $this->hasUserTypeOrRole(['admin', 'hq_admin']);
    }

    public function canAccessBranchPortal(): bool
    {
        if (! $this->is_active || $this->isRider() || $this->isCustomer()) {
            return false;
        }

        if ($this->hasUserTypeOrRole(['admin', 'hq_admin'])) {
            return true;
        }

        return $this->branch_id !== null
            && $this->hasUserTypeOrRole(['branch_owner', 'branch_manager', 'staff']);
    }

    public function canHandleBranchOperations(): bool
    {
        return $this->canAccessBranchPortal()
            && $this->hasUserTypeOrRole(['admin', 'hq_admin', 'branch_owner', 'branch_manager', 'staff']);
    }

    public function canManageBranchPeople(): bool
    {
        return $this->canAccessBranchPortal()
            && $this->hasUserTypeOrRole(['admin', 'hq_admin', 'branch_owner', 'branch_manager']);
    }

    public function canManageBranchReports(): bool
    {
        return $this->canAccessBranchPortal()
            && $this->hasUserTypeOrRole(['admin', 'hq_admin', 'branch_owner', 'branch_manager']);
    }

    public function canManageBranchFinancials(): bool
    {
        return $this->canManageBranchReports();
    }

    public function isAdmin(): bool
    {
        return $this->hasUserTypeOrRole('admin');
    }

    public function isHqAdmin(): bool
    {
        return $this->hasUserTypeOrRole('hq_admin');
    }

    public function isBranchOwner(): bool
    {
        return $this->hasUserTypeOrRole('branch_owner');
    }

    public function isBranchManager(): bool
    {
        return $this->hasUserTypeOrRole('branch_manager');
    }

    public function isStaff(): bool
    {
        return $this->hasUserTypeOrRole('staff');
    }

    public function isRider(): bool
    {
        return $this->hasUserTypeOrRole('rider');
    }

    public function isCustomer(): bool
    {
        return $this->hasUserTypeOrRole('customer');
    }
}
