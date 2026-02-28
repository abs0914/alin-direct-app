<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_jobs', function (Blueprint $table) {
            $table->id();
            $table->uuid('tracking_uuid')->unique();
            $table->foreignId('sender_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('rider_id')->nullable()->constrained('riders')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            // Status workflow: pending, broadcasting, accepted, en_route_pickup, arrived_pickup,
            // picked_up, in_transit, arrived_dropoff, delivered, failed, cancelled, returned
            $table->string('status')->default('pending');

            // Vehicle requirement
            $table->string('vehicle_type')->default('motorcycle'); // motorcycle, mpv, van, truck

            // Pickup details
            $table->string('pickup_contact_name');
            $table->string('pickup_contact_phone');
            $table->text('pickup_address');
            $table->decimal('pickup_lat', 10, 7)->nullable();
            $table->decimal('pickup_lng', 10, 7)->nullable();
            $table->text('pickup_notes')->nullable();

            // Dropoff details
            $table->string('dropoff_contact_name');
            $table->string('dropoff_contact_phone');
            $table->text('dropoff_address');
            $table->decimal('dropoff_lat', 10, 7)->nullable();
            $table->decimal('dropoff_lng', 10, 7)->nullable();
            $table->text('dropoff_notes')->nullable();

            // Package info
            $table->string('package_description')->nullable();
            $table->string('package_size')->default('small'); // small, medium, large, extra_large
            $table->decimal('package_weight_kg', 8, 2)->nullable();

            // Pricing
            $table->decimal('distance_km', 8, 2)->nullable();
            $table->decimal('base_fare', 10, 2)->default(0);
            $table->decimal('distance_fare', 10, 2)->default(0);
            $table->decimal('surge_multiplier', 4, 2)->default(1.00);
            $table->decimal('total_price', 10, 2)->default(0);
            $table->decimal('rider_earnings', 10, 2)->default(0);
            $table->decimal('platform_commission', 10, 2)->default(0);

            // Payment
            $table->string('payment_method')->default('cod'); // online, cod
            $table->string('payment_status')->default('pending'); // pending, paid, refunded, failed
            $table->boolean('cod_collected')->default(false);
            $table->boolean('cod_settled')->default(false);
            $table->timestamp('cod_settled_at')->nullable();
            $table->foreignId('cod_settled_by')->nullable()->constrained('users')->nullOnDelete();

            // Failure tracking
            $table->string('failure_reason')->nullable();
            $table->text('failure_notes')->nullable();

            // Timestamps
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for performance
            $table->index(['branch_id', 'status']);
            $table->index(['rider_id', 'status']);
            $table->index(['sender_id', 'status']);
            $table->index(['status', 'created_at']);
            $table->index(['payment_status', 'cod_collected', 'cod_settled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_jobs');
    }
};

