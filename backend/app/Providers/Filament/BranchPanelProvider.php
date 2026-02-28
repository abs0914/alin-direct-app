<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Widgets;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class BranchPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->id('branch')
            ->path('branch')
            ->login()
            ->brandName('ALiN Direct Branch')
            ->brandLogo(asset('images/ALiN Direct.png'))
            ->brandLogoHeight('5.5rem')
            ->darkMode(false)
            ->colors([
                'primary' => [
                    50 => '#fffbeb',
                    100 => '#fef3c7',
                    200 => '#fde68a',
                    300 => '#fcd34d',
                    400 => '#fbbf24',
                    500 => '#f5a524',
                    600 => '#d97706',
                    700 => '#b45309',
                    800 => '#92400e',
                    900 => '#78350f',
                    950 => '#451a03',
                ],
                'danger' => Color::Red,
                'warning' => Color::Amber,
                'success' => Color::Green,
                'info' => Color::Blue,
            ])
            ->sidebarCollapsibleOnDesktop()
            ->sidebarWidth('16rem')
            ->navigationGroups([
                'Dashboard',
                'Operations',
                'Riders',
                'Customers',
                'Finance',
                'Reports & Analytics',
                'Settings',
            ])
            ->discoverResources(in: app_path('Filament/Branch/Resources'), for: 'App\\Filament\\Branch\\Resources')
            ->discoverPages(in: app_path('Filament/Branch/Pages'), for: 'App\\Filament\\Branch\\Pages')
            ->pages([
                Pages\Dashboard::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Branch/Widgets'), for: 'App\\Filament\\Branch\\Widgets')
            ->widgets([])
            ->renderHook(
                'panels::head.end',
                fn () => '<link rel="stylesheet" href="' . asset('css/filament-custom.css') . '">'
            )
            ->renderHook(
                \Filament\View\PanelsRenderHook::TOPBAR_START,
                fn () => '<div style="font-size: 1.1rem; font-weight: 700; color: #111827; white-space: nowrap;">ALiN Cargo Express Taguig Branch</div>'
            )
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }
}

