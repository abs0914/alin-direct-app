<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add box_type column to delivery_jobs and sales_transactions.
     *
     * box_type values:
     *   own_box  – customer/sender provides the packaging (no surcharge)
     *   alin_box – ALiN provides the box (+ ₱50 flat surcharge applied at booking)
     */
    public function up(): void
    {
        Schema::table('delivery_jobs', function (Blueprint $table) {
            // Placed after package_size for logical grouping
            $table->string('box_type')->default('own_box')->after('package_size');
        });

        Schema::table('sales_transactions', function (Blueprint $table) {
            // Nullable: not all sales are box-related
            $table->string('box_type')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('delivery_jobs', function (Blueprint $table) {
            $table->dropColumn('box_type');
        });

        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->dropColumn('box_type');
        });
    }
};

