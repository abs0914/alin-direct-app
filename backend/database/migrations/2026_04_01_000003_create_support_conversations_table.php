<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_conversations', function (Blueprint $table) {
            $table->id();

            // Who initiated (customer or rider)
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Channel: app, messenger, web
            $table->string('channel')->default('app');

            // Lifecycle: open → bot_handling → pending_agent → agent_active → resolved | closed
            $table->string('status')->default('open');

            // Current owner of the conversation
            $table->string('owner_type')->nullable(); // 'bot' | 'branch' | 'hq'
            $table->foreignId('owner_agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();

            // Linked delivery job (optional context)
            $table->foreignId('delivery_job_id')->nullable()->constrained()->nullOnDelete();

            // AI classification
            $table->string('intent')->nullable(); // tracking, pricing, complaint, escalation, etc.
            $table->unsignedTinyInteger('ai_confidence')->nullable(); // 0-100
            $table->tinyInteger('sentiment_score')->nullable(); // -2 to 2
            $table->boolean('escalation_flag')->default(false);

            // Timestamps
            $table->timestamp('first_response_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['branch_id', 'status']);
            $table->index(['status', 'escalation_flag']);
            $table->index('last_message_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_conversations');
    }
};
