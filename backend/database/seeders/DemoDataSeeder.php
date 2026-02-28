<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\DeliveryJob;
use App\Models\JobOffer;
use App\Models\Payment;
use App\Models\PayoutRequest;
use App\Models\ProofOfDelivery;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // ── Branches ───────────────────────────────────────────────────
        $hq = Branch::where('code', 'HQ-MNL')->first();

        $makati = Branch::firstOrCreate(['code' => 'BR-MKT'], [
            'name' => 'ALiN Makati Branch',
            'type' => 'branch',
            'address' => '123 Ayala Ave, Makati City',
            'city' => 'Makati',
            'province' => 'Metro Manila',
            'lat' => 14.5547,
            'lng' => 121.0244,
            'service_radius_km' => 15.00,
            'phone' => '+639170000002',
            'email' => 'makati@alindirect.com',
            'is_active' => true,
        ]);

        $cebu = Branch::firstOrCreate(['code' => 'BR-CEB'], [
            'name' => 'ALiN Cebu Branch',
            'type' => 'branch',
            'address' => '456 Osmeña Blvd, Cebu City',
            'city' => 'Cebu City',
            'province' => 'Cebu',
            'lat' => 10.3157,
            'lng' => 123.8854,
            'service_radius_km' => 20.00,
            'phone' => '+639170000003',
            'email' => 'cebu@alindirect.com',
            'is_active' => true,
        ]);

        $davao = Branch::firstOrCreate(['code' => 'SAT-DVO'], [
            'name' => 'ALiN Davao Satellite',
            'type' => 'satellite',
            'address' => '789 Bolton St, Davao City',
            'city' => 'Davao City',
            'province' => 'Davao del Sur',
            'lat' => 7.0731,
            'lng' => 125.6128,
            'service_radius_km' => 10.00,
            'phone' => '+639170000004',
            'email' => 'davao@alindirect.com',
            'is_active' => true,
        ]);

        $branches = [$hq, $makati, $cebu, $davao];

        // ── Branch Managers ────────────────────────────────────────────
        $makatiMgr = User::firstOrCreate(['email' => 'makati.mgr@alindirect.com'], [
            'name' => 'Maria Santos',
            'phone' => '+639180000010',
            'password' => bcrypt('password'),
            'user_type' => 'branch_manager',
            'is_active' => true,
            'branch_id' => $makati->id,
        ]);
        $makatiMgr->assignRole('branch_manager');

        $cebuMgr = User::firstOrCreate(['email' => 'cebu.mgr@alindirect.com'], [
            'name' => 'Juan dela Cruz',
            'phone' => '+639180000011',
            'password' => bcrypt('password'),
            'user_type' => 'branch_manager',
            'is_active' => true,
            'branch_id' => $cebu->id,
        ]);
        $cebuMgr->assignRole('branch_manager');

        // ── Dispatchers ────────────────────────────────────────────────
        $dispatcher1 = User::firstOrCreate(['email' => 'dispatch1@alindirect.com'], [
            'name' => 'Pedro Reyes',
            'phone' => '+639180000020',
            'password' => bcrypt('password'),
            'user_type' => 'dispatcher',
            'is_active' => true,
            'branch_id' => $makati->id,
        ]);
        $dispatcher1->assignRole('dispatcher');

        // ── Rider Users & Riders ───────────────────────────────────────
        $riderData = [
            ['name' => 'Rico Magsaysay', 'phone' => '+639190000001', 'email' => 'rico@rider.com', 'branch' => $makati, 'vehicle' => 'motorcycle', 'plate' => 'ABC-1234', 'brand' => 'Honda', 'model' => 'Click 160', 'color' => 'Red', 'status' => 'approved', 'availability' => 'online', 'rating' => 4.8, 'deliveries' => 156],
            ['name' => 'Mark Gonzales', 'phone' => '+639190000002', 'email' => 'mark@rider.com', 'branch' => $makati, 'vehicle' => 'motorcycle', 'plate' => 'DEF-5678', 'brand' => 'Yamaha', 'model' => 'Mio i125', 'color' => 'Blue', 'status' => 'approved', 'availability' => 'on_job', 'rating' => 4.5, 'deliveries' => 89],
            ['name' => 'Jose Rizal Jr', 'phone' => '+639190000003', 'email' => 'jose@rider.com', 'branch' => $makati, 'vehicle' => 'mpv', 'plate' => 'GHI-9012', 'brand' => 'Toyota', 'model' => 'Avanza', 'color' => 'White', 'status' => 'approved', 'availability' => 'offline', 'rating' => 4.2, 'deliveries' => 45],
            ['name' => 'Carlo Aquino', 'phone' => '+639190000004', 'email' => 'carlo@rider.com', 'branch' => $cebu, 'vehicle' => 'motorcycle', 'plate' => 'JKL-3456', 'brand' => 'Honda', 'model' => 'Beat FI', 'color' => 'Black', 'status' => 'approved', 'availability' => 'online', 'rating' => 4.9, 'deliveries' => 210],
            ['name' => 'Danny Cruz', 'phone' => '+639190000005', 'email' => 'danny@rider.com', 'branch' => $cebu, 'vehicle' => 'van', 'plate' => 'MNO-7890', 'brand' => 'Nissan', 'model' => 'NV350', 'color' => 'White', 'status' => 'approved', 'availability' => 'online', 'rating' => 4.6, 'deliveries' => 78],
            ['name' => 'Benny Reyes', 'phone' => '+639190000006', 'email' => 'benny@rider.com', 'branch' => $makati, 'vehicle' => 'motorcycle', 'plate' => 'PQR-1122', 'brand' => 'Suzuki', 'model' => 'Raider 150', 'color' => 'Red', 'status' => 'pending', 'availability' => 'offline', 'rating' => 0, 'deliveries' => 0],
            ['name' => 'Alex Torres', 'phone' => '+639190000007', 'email' => 'alex@rider.com', 'branch' => $hq, 'vehicle' => 'truck', 'plate' => 'STU-3344', 'brand' => 'Isuzu', 'model' => 'NLR', 'color' => 'Blue', 'status' => 'approved', 'availability' => 'online', 'rating' => 4.7, 'deliveries' => 120],
            ['name' => 'Rodel Fajardo', 'phone' => '+639190000008', 'email' => 'rodel@rider.com', 'branch' => $hq, 'vehicle' => 'motorcycle', 'plate' => 'VWX-5566', 'brand' => 'Honda', 'model' => 'XRM 125', 'color' => 'Black', 'status' => 'suspended', 'availability' => 'offline', 'rating' => 3.1, 'deliveries' => 22],
        ];

        $riders = [];
        foreach ($riderData as $rd) {
            $rUser = User::firstOrCreate(['email' => $rd['email']], [
                'name' => $rd['name'],
                'phone' => $rd['phone'],
                'password' => bcrypt('password'),
                'user_type' => 'rider',
                'is_active' => true,
                'branch_id' => $rd['branch']->id,
            ]);
            $rUser->assignRole('rider');

            $riders[] = Rider::firstOrCreate(['user_id' => $rUser->id], [
                'branch_id' => $rd['branch']->id,
                'vehicle_type' => $rd['vehicle'],
                'plate_number' => $rd['plate'],
                'vehicle_brand' => $rd['brand'],
                'vehicle_model' => $rd['model'],
                'vehicle_color' => $rd['color'],
                'status' => $rd['status'],
                'availability' => $rd['availability'],
                'current_lat' => $rd['branch']->lat + (rand(-50, 50) / 10000),
                'current_lng' => $rd['branch']->lng + (rand(-50, 50) / 10000),
                'last_seen_at' => now()->subMinutes(rand(0, 120)),
                'terms_accepted' => $rd['status'] !== 'pending',
                'terms_accepted_at' => $rd['status'] !== 'pending' ? now()->subDays(rand(10, 60)) : null,
                'kyc_verified_at' => $rd['status'] === 'approved' ? now()->subDays(rand(5, 30)) : null,
                'rating' => $rd['rating'],
                'total_deliveries' => $rd['deliveries'],
            ]);
        }

        $this->command->info('✓ Riders seeded');

        // ── Customers ──────────────────────────────────────────────────
        $customerData = [
            ['name' => 'Ana Mercado', 'phone' => '+639200000001', 'email' => 'ana@customer.com', 'company' => null, 'address' => '15 Jupiter St, Makati City', 'lat' => 14.5565, 'lng' => 121.0195, 'bookings' => 12],
            ['name' => 'Roberto Lim', 'phone' => '+639200000002', 'email' => 'roberto@customer.com', 'company' => 'LimTech Corp', 'address' => '88 Gil Puyat Ave, Makati City', 'lat' => 14.5540, 'lng' => 121.0145, 'bookings' => 45],
            ['name' => 'Sophia Garcia', 'phone' => '+639200000003', 'email' => 'sophia@customer.com', 'company' => null, 'address' => '321 Mango Ave, Cebu City', 'lat' => 10.3139, 'lng' => 123.8915, 'bookings' => 8],
            ['name' => 'Miguel Torres', 'phone' => '+639200000004', 'email' => 'miguel@customer.com', 'company' => 'Torres Logistics', 'address' => '567 Rizal St, Manila', 'lat' => 14.5980, 'lng' => 120.9830, 'bookings' => 67],
            ['name' => 'Isabella Cruz', 'phone' => '+639200000005', 'email' => 'isabella@customer.com', 'company' => null, 'address' => '42 Tomas Morato Ave, QC', 'lat' => 14.6340, 'lng' => 121.0350, 'bookings' => 3],
            ['name' => 'FreshMart PH', 'phone' => '+639200000006', 'email' => 'orders@freshmart.ph', 'company' => 'FreshMart Philippines', 'address' => '100 EDSA, Mandaluyong', 'lat' => 14.5794, 'lng' => 121.0359, 'bookings' => 234],
        ];

        $customers = [];
        foreach ($customerData as $cd) {
            $cUser = User::firstOrCreate(['email' => $cd['email']], [
                'name' => $cd['name'],
                'phone' => $cd['phone'],
                'password' => bcrypt('password'),
                'user_type' => 'customer',
                'is_active' => true,
            ]);
            $cUser->assignRole('customer');

            $customers[] = Customer::firstOrCreate(['user_id' => $cUser->id], [
                'company_name' => $cd['company'],
                'default_address' => $cd['address'],
                'default_lat' => $cd['lat'],
                'default_lng' => $cd['lng'],
                'total_bookings' => $cd['bookings'],
            ]);
        }

        $this->command->info('✓ Customers seeded');

        // ── Delivery Jobs ──────────────────────────────────────────────
        $admin = User::where('email', 'admin@alindirect.com')->first();
        $statuses = ['pending', 'broadcasting', 'accepted', 'en_route_pickup', 'picked_up', 'in_transit', 'delivered', 'delivered', 'delivered', 'failed', 'cancelled'];
        $sizes = ['small', 'medium', 'large', 'extra_large'];
        $vehicleTypes = ['motorcycle', 'mpv', 'van', 'truck'];

        $dropoffAddresses = [
            ['name' => 'Liza Soberano', 'phone' => '+639210000001', 'address' => '25 McKinley Rd, BGC, Taguig', 'lat' => 14.5494, 'lng' => 121.0509],
            ['name' => 'John Lloyd', 'phone' => '+639210000002', 'address' => '100 Roxas Blvd, Pasay', 'lat' => 14.5538, 'lng' => 120.9972],
            ['name' => 'Kim Chiu', 'phone' => '+639210000003', 'address' => '77 Ortigas Ave, Pasig', 'lat' => 14.5875, 'lng' => 121.0613],
            ['name' => 'Daniel Padilla', 'phone' => '+639210000004', 'address' => '33 Commonwealth Ave, QC', 'lat' => 14.6780, 'lng' => 121.0831],
            ['name' => 'Sarah Lopez', 'phone' => '+639210000005', 'address' => '10 Colon St, Cebu City', 'lat' => 10.2953, 'lng' => 123.8997],
            ['name' => 'Vice Ganda', 'phone' => '+639210000006', 'address' => '55 Katipunan Ave, QC', 'lat' => 14.6312, 'lng' => 121.0749],
        ];

        $descriptions = [
            'Documents - Legal Papers',
            'Electronics - Laptop',
            'Food Package - Perishable',
            'Clothing - 2 Boxes',
            'Medical Supplies',
            'Office Equipment',
            'Personal Items - Fragile',
            'ALiN Cargo Pouch - Small',
            'ALiN Cargo Box - Medium',
            'Grocery Items - 3 Bags',
        ];

        $jobs = [];
        for ($i = 0; $i < 30; $i++) {
            $status = $statuses[array_rand($statuses)];
            $customer = $customers[array_rand($customers)];
            $branch = $branches[array_rand($branches)];
            $dropoff = $dropoffAddresses[array_rand($dropoffAddresses)];
            $vehicleType = $vehicleTypes[array_rand($vehicleTypes)];
            $baseFare = rand(50, 150);
            $distanceFare = rand(20, 100);
            $totalPrice = $baseFare + $distanceFare;
            $riderEarnings = round($totalPrice * 0.8, 2);
            $platformComm = round($totalPrice * 0.2, 2);

            // Assign rider only if status is beyond broadcasting
            $assignedRider = null;
            if (!in_array($status, ['pending', 'broadcasting', 'cancelled'])) {
                $approvedRiders = array_filter($riders, fn ($r) => $r->status === 'approved');
                if (!empty($approvedRiders)) {
                    $assignedRider = $approvedRiders[array_rand($approvedRiders)];
                }
            }

            $createdAt = now()->subDays(rand(0, 14))->subHours(rand(0, 23));
            $jobData = [
                'tracking_uuid' => Str::uuid()->toString(),
                'sender_id' => $customer->user_id,
                'rider_id' => $assignedRider?->id,
                'branch_id' => $branch->id,
                'created_by' => $admin?->id ?? $customer->user_id,
                'status' => $status,
                'vehicle_type' => $vehicleType,
                'pickup_contact_name' => $customer->user->name,
                'pickup_contact_phone' => $customer->user->phone,
                'pickup_address' => $customer->default_address,
                'pickup_lat' => $customer->default_lat,
                'pickup_lng' => $customer->default_lng,
                'dropoff_contact_name' => $dropoff['name'],
                'dropoff_contact_phone' => $dropoff['phone'],
                'dropoff_address' => $dropoff['address'],
                'dropoff_lat' => $dropoff['lat'],
                'dropoff_lng' => $dropoff['lng'],
                'package_description' => $descriptions[array_rand($descriptions)],
                'package_size' => $sizes[array_rand($sizes)],
                'package_weight_kg' => rand(1, 50) / 10,
                'distance_km' => rand(2, 25),
                'base_fare' => $baseFare,
                'distance_fare' => $distanceFare,
                'surge_multiplier' => 1.00,
                'total_price' => $totalPrice,
                'rider_earnings' => $assignedRider ? $riderEarnings : 0,
                'platform_commission' => $assignedRider ? $platformComm : 0,
                'payment_method' => rand(0, 1) ? 'online' : 'cod',
                'payment_status' => $status === 'delivered' ? 'paid' : 'pending',
                'cod_collected' => false,
                'cod_settled' => false,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];

            // Add timestamps based on status
            if (in_array($status, ['accepted', 'en_route_pickup', 'picked_up', 'in_transit', 'delivered', 'failed'])) {
                $jobData['accepted_at'] = $createdAt->copy()->addMinutes(rand(1, 10));
            }
            if (in_array($status, ['picked_up', 'in_transit', 'delivered'])) {
                $jobData['picked_up_at'] = $createdAt->copy()->addMinutes(rand(15, 30));
            }
            if ($status === 'delivered') {
                $jobData['delivered_at'] = $createdAt->copy()->addMinutes(rand(35, 90));
                $jobData['payment_status'] = 'paid';
                if ($jobData['payment_method'] === 'cod') {
                    $jobData['cod_collected'] = true;
                }
            }
            if ($status === 'failed') {
                $jobData['failed_at'] = $createdAt->copy()->addMinutes(rand(20, 60));
                $jobData['failure_reason'] = ['recipient_not_available', 'wrong_address', 'refused_delivery'][rand(0, 2)];
                $jobData['failure_notes'] = 'Attempted delivery but ' . $jobData['failure_reason'];
            }
            if ($status === 'cancelled') {
                $jobData['cancelled_at'] = $createdAt->copy()->addMinutes(rand(1, 15));
            }

            $job = DeliveryJob::create($jobData);
            $jobs[] = $job;
        }

        $this->command->info('✓ 30 Delivery Jobs seeded');

        // ── Job Offers ─────────────────────────────────────────────────
        $approvedRidersList = array_values(array_filter($riders, fn ($r) => $r->status === 'approved'));
        foreach ($jobs as $job) {
            if (in_array($job->status, ['broadcasting', 'accepted', 'en_route_pickup', 'picked_up', 'in_transit', 'delivered'])) {
                $numOffers = rand(1, 3);
                for ($o = 0; $o < $numOffers && $o < count($approvedRidersList); $o++) {
                    $offerRider = $approvedRidersList[$o];
                    $offerStatus = ($job->rider_id === $offerRider->id) ? 'accepted' : (['rejected', 'expired'][rand(0, 1)]);
                    if ($job->status === 'broadcasting') {
                        $offerStatus = 'pending';
                    }

                    JobOffer::firstOrCreate([
                        'job_id' => $job->id,
                        'rider_id' => $offerRider->id,
                    ], [
                        'status' => $offerStatus,
                        'expires_at' => now()->addMinutes(5),
                        'responded_at' => $offerStatus !== 'pending' ? now()->subMinutes(rand(1, 4)) : null,
                    ]);
                }
            }
        }

        $this->command->info('✓ Job Offers seeded');

        // ── Proof of Deliveries ────────────────────────────────────────
        foreach ($jobs as $job) {
            if ($job->status === 'delivered') {
                ProofOfDelivery::firstOrCreate(['job_id' => $job->id], [
                    'photo_url' => 'https://placehold.co/400x300/f5a524/451a03?text=POD+Photo',
                    'signature_url' => 'https://placehold.co/400x200/f5a524/451a03?text=Signature',
                    'recipient_name' => $job->dropoff_contact_name,
                    'relationship' => ['self', 'spouse', 'relative', 'guard', 'househelp'][rand(0, 4)],
                    'delivery_lat' => $job->dropoff_lat,
                    'delivery_lng' => $job->dropoff_lng,
                    'notes' => rand(0, 1) ? 'Received in good condition' : null,
                ]);
            }
        }

        $this->command->info('✓ Proof of Deliveries seeded');

        // ── Payments ───────────────────────────────────────────────────
        foreach ($jobs as $job) {
            if (in_array($job->status, ['delivered', 'in_transit', 'picked_up'])) {
                Payment::firstOrCreate([
                    'job_id' => $job->id,
                    'user_id' => $job->sender_id,
                ], [
                    'provider' => $job->payment_method === 'online' ? 'maya' : 'cod',
                    'type' => 'delivery_fee',
                    'reference_no' => 'PAY-' . strtoupper(Str::random(10)),
                    'amount' => $job->total_price,
                    'currency' => 'PHP',
                    'status' => $job->status === 'delivered' ? 'completed' : 'pending',
                ]);
            }
        }

        $this->command->info('✓ Payments seeded');

        // ── Payout Requests ────────────────────────────────────────────
        $payoutStatuses = ['pending', 'approved', 'approved', 'rejected'];
        foreach ($approvedRidersList as $rider) {
            $numPayouts = rand(0, 3);
            for ($p = 0; $p < $numPayouts; $p++) {
                $payoutStatus = $payoutStatuses[array_rand($payoutStatuses)];
                PayoutRequest::create([
                    'rider_id' => $rider->id,
                    'amount' => rand(500, 5000),
                    'status' => $payoutStatus,
                    'approved_by' => $payoutStatus === 'approved' ? $admin?->id : null,
                    'approved_at' => $payoutStatus === 'approved' ? now()->subDays(rand(1, 7)) : null,
                    'rejection_reason' => $payoutStatus === 'rejected' ? 'Insufficient balance for payout' : null,
                    'notes' => 'Weekly payout request',
                ]);
            }
        }

        $this->command->info('✓ Payout Requests seeded');
        $this->command->info('');
        $this->command->info('🎉 Demo data seeding complete!');
        $this->command->info('   - 4 Branches (HQ + 3)');
        $this->command->info('   - 8 Riders (various statuses)');
        $this->command->info('   - 6 Customers');
        $this->command->info('   - 30 Delivery Jobs');
        $this->command->info('   - Job Offers, Payments, PODs, Payouts');
    }
}

