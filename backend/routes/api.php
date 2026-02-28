<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Protected by Supabase JWT middleware. Mobile apps send the Supabase
| access_token as a Bearer token; the middleware validates it and
| resolves (or auto-provisions) the corresponding Laravel user.
|
*/

Route::middleware('supabase.auth')->group(function () {

    // Current user profile
    Route::get('/me', function (Request $request) {
        $user = $request->user();
        $user->load(['rider', 'customer']);
        return response()->json($user);
    });

    // Update profile
    Route::put('/me', function (Request $request) {
        $user = $request->user();
        $user->update($request->only(['name', 'email', 'avatar_url']));
        return response()->json($user);
    });

    // Health check (no auth)
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]);
});

