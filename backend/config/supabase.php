<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Supabase Configuration
    |--------------------------------------------------------------------------
    */

    'url' => env('SUPABASE_URL', 'http://127.0.0.1:54321'),

    'anon_key' => env('SUPABASE_ANON_KEY', ''),

    'service_role_key' => env('SUPABASE_SERVICE_ROLE_KEY', ''),

    'jwt_secret' => env('SUPABASE_JWT_SECRET', ''),

];

