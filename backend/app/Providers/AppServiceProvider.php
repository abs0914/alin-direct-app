<?php

namespace App\Providers;

use App\Auth\SupabaseGuard;
use App\Contracts\AiDriver;
use App\Services\Ai\ClaudeDriver;
use App\Services\Ai\OllamaDriver;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(AiDriver::class, function () {
            return match (config('ai.driver')) {
                'ollama' => new OllamaDriver(),
                default  => new ClaudeDriver(),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register the Supabase auth guard driver
        Auth::extend('supabase', function ($app, $name, array $config) {
            return new SupabaseGuard($app['request']);
        });
    }
}
