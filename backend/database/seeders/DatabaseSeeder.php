<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // 1. Seed roles & permissions first
        $this->call(RolesAndPermissionsSeeder::class);

        // 2. Create default HQ branch
        $hqBranch = Branch::firstOrCreate(
            ['code' => 'HQ-MNL'],
            [
                'name' => 'ALiN HQ - Manila',
                'type' => 'hub',
                'address' => 'Manila, Metro Manila',
                'city' => 'Manila',
                'province' => 'Metro Manila',
                'lat' => 14.5995,
                'lng' => 120.9842,
                'service_radius_km' => 25.00,
                'is_active' => true,
            ]
        );

        // 3. Create super admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@alinmove.com'],
            [
                'name' => 'ALiN Admin',
                'password' => bcrypt('password'),
                'user_type' => 'admin',
                'is_active' => true,
                'branch_id' => $hqBranch->id,
            ]
        );
        $admin->assignRole('admin');

        // 4. Create a test branch manager
        $manager = User::firstOrCreate(
            ['email' => 'manager@alinmove.com'],
            [
                'name' => 'Branch Manager',
                'password' => bcrypt('password'),
                'user_type' => 'branch_manager',
                'is_active' => true,
                'branch_id' => $hqBranch->id,
            ]
        );
        $manager->assignRole('branch_manager');

        // 5. Seed service catalog (categories & sub-services)
        $this->call(ServiceCatalogSeeder::class);

        // 6. Seed demo data
        $this->call(DemoDataSeeder::class);
    }
}
