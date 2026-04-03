<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emergency_alerts', function (Blueprint $table) {
            $table->id();

            // Rider who triggered the SOS
            $table->foreignId('rider_id')->constrained('riders')->cascadeOnDelete();

            // Branch the rider belongs to (for notification routing)
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();

            // Last known location of the distressed rider
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();

            // Lifecycle: active → responding → resolved | cancelled
            $table->string('status')->default('active');

            // Emergency assistance job auto-created and broadcast to nearby riders
            $table->foreignId('emergency_job_id')
                ->nullable()
                ->constrained('delivery_jobs')
                ->nullOnDelete();

            // Rider who accepted the emergency assistance job
            $table->foreignId('responded_by_rider_id')
                ->nullable()
                ->constrained('riders')
                ->nullOnDelete();

            $table->text('notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['branch_id', 'status']);
            $table->index(['rider_id', 'status']);
            $table->index(['status', 'created_at']);
        });

        // Add is_emergency flag to delivery_jobs
        Schema::table('delivery_jobs', function (Blueprint $table) {
            $table->boolean('is_emergency')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('delivery_jobs', function (Blueprint $table) {
            $table->dropColumn('is_emergency');
        });

        Schema::dropIfExists('emergency_alerts');
    }
};

