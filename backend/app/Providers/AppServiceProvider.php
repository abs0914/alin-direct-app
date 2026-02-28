<?php

namespace App\Providers;

use App\Auth\SupabaseGuard;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
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
