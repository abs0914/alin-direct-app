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

        // Branch Manager - branch-level operations
        $branchManager = Role::firstOrCreate(['name' => 'branch_manager', 'guard_name' => 'web']);
        $branchManager->givePermissionTo([
            'riders.view', 'riders.approve', 'riders.suspend',
            'jobs.view', 'jobs.create', 'jobs.dispatch', 'jobs.cancel', 'jobs.reassign',
            'cod.verify', 'cod.settle',
            'ledger.view', 'payouts.view',
            'reports.branch',
        ]);

        // Dispatcher - day-to-day job management
        $dispatcher = Role::firstOrCreate(['name' => 'dispatcher', 'guard_name' => 'web']);
        $dispatcher->givePermissionTo([
            'riders.view',
            'jobs.view', 'jobs.create', 'jobs.dispatch', 'jobs.cancel',
            'cod.verify',
        ]);

        // Rider - mobile app only, minimal web permissions
        Role::firstOrCreate(['name' => 'rider', 'guard_name' => 'web']);

        // Customer - mobile app only
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);
    }
}

