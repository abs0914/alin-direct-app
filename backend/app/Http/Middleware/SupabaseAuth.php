<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SupabaseAuth
{
    /**
     * Handle an incoming request.
     * Validates the Supabase JWT and auto-provisions a Laravel user if needed.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        try {
            $secret = config('supabase.jwt_secret');

            if (empty($secret)) {
                return response()->json(['message' => 'Auth not configured.'], 500);
            }

            $decoded = JWT::decode($token, new Key($secret, 'HS256'));

            $supabaseId = $decoded->sub ?? null;

            if (!$supabaseId) {
                return response()->json(['message' => 'Invalid token payload.'], 401);
            }

            // Find or create the Laravel user
            $user = User::where('supabase_id', $supabaseId)->first();

            if (!$user) {
                // Auto-provision: create a new Laravel user from Supabase claims
                $phone = $decoded->phone ?? null;
                $email = $decoded->email ?? null;

                $user = User::create([
                    'supabase_id' => $supabaseId,
                    'name' => $phone ?? $email ?? 'User',
                    'phone' => $phone,
                    'email' => $email,
                    'user_type' => 'customer', // Default; updated during registration
                    'phone_verified_at' => $phone ? now() : null,
                    'email_verified_at' => $email ? now() : null,
                ]);
            }

            if (!$user->is_active) {
                return response()->json(['message' => 'Account deactivated.'], 403);
            }

            // Set the authenticated user on the request
            auth()->setUser($user);
            $request->setUserResolver(fn () => $user);

        } catch (\Firebase\JWT\ExpiredException $e) {
            return response()->json(['message' => 'Token expired.'], 401);
        } catch (\Firebase\JWT\SignatureInvalidException $e) {
            return response()->json(['message' => 'Invalid token signature.'], 401);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Authentication failed.'], 401);
        }

        return $next($request);
    }
}

