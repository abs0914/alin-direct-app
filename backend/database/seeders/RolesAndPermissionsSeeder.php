<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ── Permissions ───────────────────────────────────────
        $permissions = [
            // Branch management
            'branches.view', 'branches.create', 'branches.edit', 'branches.delete',

            // User management
            'users.view', 'users.create', 'users.edit', 'users.delete',

            // Rider management
            'riders.view', 'riders.approve', 'riders.suspend', 'riders.blacklist',

            // Delivery job management
            'jobs.view', 'jobs.create', 'jobs.dispatch', 'jobs.cancel', 'jobs.reassign',

            // Financial
            'ledger.view', 'payouts.view', 'payouts.approve', 'payouts.process',
            'cod.verify', 'cod.settle',

            // Operations (Sales, Expenses, EOD)
            'attendance.view', 'attendance.manage_own',
            'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
            'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
            'eod.view', 'eod.close',

            // Reports & Analytics
            'reports.branch', 'reports.global', 'analytics.view',

            // System config
            'config.view', 'config.edit',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // ── Roles ─────────────────────────────────────────────

        // Super Admin - full access
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->givePermissionTo(Permission::all());

        $hqAdmin = Role::firstOrCreate(['name' => 'hq_admin', 'guard_name' => 'web']);
        $hqAdmin->syncPermissions(Permission::whereNotIn('name', [
            'config.edit',
            'branches.delete',
            'users.delete',
        ])->get());

        $branchOwner = Role::firstOrCreate(['name' => 'branch_owner', 'guard_name' => 'web']);
        $branchOwner->syncPermissions([
            'branches.view',
            'users.view', 'users.create', 'users.edit',
            'riders.view', 'riders.approve', 'riders.suspend',
            'jobs.view', 'jobs.create', 'jobs.dispatch', 'jobs.cancel', 'jobs.reassign',
            'ledger.view', 'payouts.view',
            'cod.verify', 'cod.settle',
            'attendance.view', 'attendance.manage_own',
            'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
            'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
            'eod.view', 'eod.close',
            'reports.branch', 'analytics.view',
        ]);

        // Branch Manager - branch-level operations
        $branchManager = Role::firstOrCreate(['name' => 'branch_manager', 'guard_name' => 'web']);
        $branchManager->syncPermissions([
            'users.view', 'users.create', 'users.edit',
            'riders.view', 'riders.approve', 'riders.suspend',
            'jobs.view', 'jobs.create', 'jobs.dispatch', 'jobs.cancel', 'jobs.reassign',
            'cod.verify', 'cod.settle',
            'ledger.view', 'payouts.view',
            'reports.branch',
            'analytics.view',
            'attendance.view', 'attendance.manage_own',
            'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
            'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete',
            'eod.view', 'eod.close',
        ]);

        $staff = Role::firstOrCreate(['name' => 'staff', 'guard_name' => 'web']);
        $staff->syncPermissions([
            'attendance.view', 'attendance.manage_own',
            'riders.view',
            'jobs.view', 'jobs.create', 'jobs.dispatch', 'jobs.cancel',
            'cod.verify',
            'sales.view', 'sales.create', 'sales.edit',
            'expenses.view', 'expenses.create', 'expenses.edit',
        ]);

        // Legacy role retained so existing dispatcher accounts continue to work.
        $dispatcher = Role::firstOrCreate(['name' => 'dispatcher', 'guard_name' => 'web']);
        $dispatcher->syncPermissions($staff->permissions);

        // Rider - mobile app only, minimal web permissions
        Role::firstOrCreate(['name' => 'rider', 'guard_name' => 'web']);

        // Customer - mobile app only
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    }
}

