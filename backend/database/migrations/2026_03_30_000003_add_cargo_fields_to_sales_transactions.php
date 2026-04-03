<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add package_size and service_type to sales_transactions.
     *
     * These fields are relevant when the service belongs to the "ALiN Cargo" category.
     * They drive automatic flat-rate price calculation using the ALiN rate card.
     *
     * package_size values: box_xlarge, box_large, box_medium, box_small, box_5kg, box_3kg,
     *                      box_1kg, pouch_large, pouch_medium, pouch_small, pouch_xsmall
     * service_type values: intra (intra-region), cross (cross-region)
     */
    public function up(): void
    {
        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->string('package_size')->nullable()->after('box_type');
            $table->string('service_type')->nullable()->after('package_size');
        });
    }

    public function down(): void
    {
        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->dropColumn(['package_size', 'service_type']);
        });
    }
};

