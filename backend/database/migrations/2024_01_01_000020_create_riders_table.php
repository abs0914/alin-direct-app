<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('riders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('vehicle_type')->default('motorcycle'); // motorcycle, mpv, van, truck
            $table->string('plate_number')->nullable();
            $table->string('vehicle_brand')->nullable();
            $table->string('vehicle_model')->nullable();
            $table->string('vehicle_color')->nullable();
            $table->string('status')->default('pending'); // pending, approved, suspended, rejected, blacklisted
            $table->string('availability')->default('offline'); // offline, online, on_job
            $table->decimal('current_lat', 10, 7)->nullable();
            $table->decimal('current_lng', 10, 7)->nullable();
            $table->timestamp('last_seen_at')->nullable();

            // KYC Documents
            $table->string('license_url')->nullable();
            $table->string('or_cr_url')->nullable();
            $table->string('nbi_clearance_url')->nullable();
            $table->string('selfie_url')->nullable();
            $table->timestamp('kyc_verified_at')->nullable();
            $table->foreignId('kyc_verified_by')->nullable()->constrained('users')->nullOnDelete();

            // Agreement
            $table->boolean('terms_accepted')->default(false);
            $table->timestamp('terms_accepted_at')->nullable();

            // Maya Payout
            $table->string('maya_wallet_id')->nullable();
            $table->string('maya_phone')->nullable();

            $table->decimal('rating', 3, 2)->default(0.00);
            $table->integer('total_deliveries')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['branch_id', 'status', 'availability']);
            $table->index(['vehicle_type', 'availability']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('riders');
    }
};

