<?php

namespace App\Auth;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

class SupabaseGuard implements Guard
{
    protected ?Authenticatable $user = null;
    protected Request $request;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    /**
     * Determine if the current user is authenticated.
     */
    public function check(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Determine if the current user is a guest.
     */
    public function guest(): bool
    {
        return !$this->check();
    }

    /**
     * Get the ID for the currently authenticated user.
     */
    public function id(): int|string|null
    {
        return $this->user()?->getAuthIdentifier();
    }

    /**
     * Get the currently authenticated user by validating the Supabase JWT.
     */
    public function user(): ?Authenticatable
    {
        if ($this->user !== null) {
            return $this->user;
        }

        $token = $this->request->bearerToken();

        if (!$token) {
            return null;
        }

        try {
            $secret = config('supabase.jwt_secret');

            if (empty($secret)) {
                return null;
            }

            $decoded = JWT::decode($token, new Key($secret, 'HS256'));

            // The 'sub' claim contains the Supabase Auth user UUID
            $supabaseId = $decoded->sub ?? null;

            if (!$supabaseId) {
                return null;
            }

            // Look up the Laravel user by supabase_id
            $this->user = User::where('supabase_id', $supabaseId)
                ->where('is_active', true)
                ->first();

            return $this->user;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Validate a user's credentials (not used for JWT auth).
     */
    public function validate(array $credentials = []): bool
    {
        return false;
    }

    /**
     * Determine if the guard has a user instance.
     */
    public function hasUser(): bool
    {
        return $this->user !== null;
    }

    /**
     * Set the current user.
     */
    public function setUser(Authenticatable $user): static
    {
        $this->user = $user;

        return $this;
    }
}

