<?php

use App\Http\Controllers\Api\RiderApiController;
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

    // ── Rider / Driver App API ──────────────────────
    Route::prefix('rider')->group(function () {
        Route::post('/register', [RiderApiController::class, 'register']);
        Route::get('/profile', [RiderApiController::class, 'profile']);
        Route::put('/profile', [RiderApiController::class, 'updateProfile']);
        Route::put('/availability', [RiderApiController::class, 'updateAvailability']);
        Route::put('/location', [RiderApiController::class, 'updateLocation']);

        // Jobs
        Route::get('/jobs/active', [RiderApiController::class, 'activeJob']);
        Route::get('/jobs/history', [RiderApiController::class, 'jobHistory']);
        Route::put('/jobs/{job}/status', [RiderApiController::class, 'updateJobStatus']);
        Route::post('/jobs/{job}/pod', [RiderApiController::class, 'submitPod']);

        // Offers
        Route::post('/offers/{offer}/respond', [RiderApiController::class, 'respondToOffer']);

        // Earnings & Payouts
        Route::get('/earnings', [RiderApiController::class, 'earnings']);
        Route::post('/payouts', [RiderApiController::class, 'requestPayout']);

        // Documents (KYC)
        Route::post('/documents', [RiderApiController::class, 'uploadDocument']);
    });
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]);
});

