<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->foreign('daily_closing_id')
                ->references('id')->on('daily_closings')
                ->nullOnDelete();
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->foreign('daily_closing_id')
                ->references('id')->on('daily_closings')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sales_transactions', function (Blueprint $table) {
            $table->dropForeign(['daily_closing_id']);
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['daily_closing_id']);
        });
    }
};

