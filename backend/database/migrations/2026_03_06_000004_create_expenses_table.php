<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->string('category');             // utilities, supplies, salaries, rent, maintenance, other
            $table->string('vendor_name')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('payment_method');       // cash, gcash, maya, bank_transfer, check
            $table->string('reference_number')->nullable();
            $table->text('description')->nullable();
            $table->string('receipt_path')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('daily_closing_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['branch_id', 'created_at']);
            $table->index(['daily_closing_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};

