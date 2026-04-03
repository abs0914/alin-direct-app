<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Driver
    |--------------------------------------------------------------------------
    | Supported: "claude", "ollama"
    |
    */
    'driver' => env('SUPPORT_AI_DRIVER', 'claude'),

    'claude' => [
        'api_key'          => env('ANTHROPIC_API_KEY'),
        'routine_model'    => env('CLAUDE_ROUTINE_MODEL', 'claude-haiku-4-5-20251001'),
        'escalation_model' => env('CLAUDE_ESCALATION_MODEL', 'claude-sonnet-4-6'),
    ],

    'ollama' => [
        'base_url' => env('OLLAMA_BASE_URL', 'http://localhost:11434'),
        'model'    => env('OLLAMA_MODEL', 'qwen2.5:7b'),
    ],

];
