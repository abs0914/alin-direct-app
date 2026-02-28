<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->nullable()->constrained('delivery_jobs')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider')->default('maya'); // maya, cod, manual
            $table->string('type')->default('checkout'); // checkout, disbursement, refund
            $table->string('reference_no')->unique()->nullable();
            $table->string('maya_checkout_id')->nullable();
            $table->string('maya_payment_id')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('PHP');
            $table->string('status')->default('pending'); // pending, processing, completed, failed, refunded, expired
            $table->json('payload_json')->nullable();
            $table->json('webhook_payload')->nullable();
            $table->string('idempotency_key')->unique()->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();

            $table->index(['job_id', 'status']);
            $table->index(['user_id', 'type', 'status']);
            $table->index(['provider', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

