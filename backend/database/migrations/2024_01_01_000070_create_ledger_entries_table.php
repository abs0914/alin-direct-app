<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Double-entry style financial ledger
        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // earning, commission, payout, cod_collection, cod_settlement, refund, adjustment, bonus
            $table->string('type');
            $table->decimal('amount', 12, 2);
            $table->decimal('balance_after', 12, 2);
            $table->string('reference_type')->nullable(); // delivery_jobs, payout_requests, etc.
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('status')->default('completed'); // pending, completed, reversed, held
            $table->text('description')->nullable();
            $table->string('idempotency_key')->unique()->nullable();
            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['reference_type', 'reference_id']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ledger_entries');
    }
};

