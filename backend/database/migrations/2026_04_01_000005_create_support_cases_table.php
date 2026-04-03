<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_cases', function (Blueprint $table) {
            $table->id();

            $table->foreignId('conversation_id')
                ->constrained('support_conversations')
                ->cascadeOnDelete();

            $table->foreignId('delivery_job_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();

            // category: tracking | pricing | complaint | damage | payment | refund | account | other
            $table->string('category');
            $table->string('subcategory')->nullable();

            // priority: low | normal | high | critical
            $table->string('priority')->default('normal');

            // assigned_team: bot | branch | hq | back_office
            $table->string('assigned_team')->default('bot');
            $table->foreignId('assigned_agent_id')->nullable()->constrained('users')->nullOnDelete();

            // SLA deadline
            $table->timestamp('sla_due_at')->nullable();

            // status: open | in_progress | pending_customer | resolved | closed
            $table->string('status')->default('open');

            // Resolution
            $table->string('resolution_code')->nullable(); // resolved | no_action | escalated | false_alarm
            $table->text('resolution_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();

            // AI-generated summary for handoff
            $table->text('ai_summary')->nullable();

            $table->timestamps();

            $table->index(['branch_id', 'status']);
            $table->index(['assigned_team', 'status']);
            $table->index(['priority', 'status', 'sla_due_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_cases');
    }
};
