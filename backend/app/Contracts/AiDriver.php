<?php

namespace App\Contracts;

interface AiDriver
{
    /**
     * Send a chat conversation and return the assistant's reply text.
     *
     * @param  array  $messages  [['role' => 'user'|'assistant', 'content' => '...']]
     * @param  string $systemPrompt
     * @param  bool   $useEscalationModel  Use the more capable model for complex cases
     */
    public function chat(array $messages, string $systemPrompt, bool $useEscalationModel = false): string;

    /**
     * Classify a message and return structured intent data.
     *
     * Returns:
     *   intent       - tracking | pricing | complaint | damage | payment | account | escalation | other
     *   confidence   - 0-100
     *   sentiment    - -2 (very negative) to 2 (very positive)
     *   should_escalate - bool
     *   escalation_reason - string|null
     */
    public function classify(string $userMessage, string $conversationHistory = ''): array;

    /**
     * Summarize a conversation for agent handoff.
     */
    public function summarize(array $messages): string;
}
