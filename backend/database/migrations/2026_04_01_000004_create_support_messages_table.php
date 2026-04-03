<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('conversation_id')
                ->constrained('support_conversations')
                ->cascadeOnDelete();

            // sender_type: 'customer' | 'rider' | 'agent' | 'bot'
            $table->string('sender_type');
            $table->foreignId('sender_id')->nullable()->constrained('users')->nullOnDelete();

            $table->text('body');

            // message_type: 'text' | 'image' | 'status_update' | 'handoff_note' | 'internal_note'
            $table->string('message_type')->default('text');

            $table->string('attachment_url')->nullable();

            // AI metadata (for bot messages)
            $table->unsignedTinyInteger('ai_confidence')->nullable();
            $table->json('ai_metadata')->nullable(); // intent, escalation_reason, etc.

            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
            $table->index(['sender_type', 'conversation_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_messages');
    }
};
