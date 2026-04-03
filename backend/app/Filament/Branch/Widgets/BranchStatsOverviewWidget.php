<?php

namespace App\Filament\Branch\Widgets;

use App\Models\DeliveryJob;
use App\Models\Rider;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class BranchStatsOverviewWidget extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $user = Auth::user();
        $branchId = $user?->branch_id;

        $query       = fn () => DeliveryJob::when($branchId, fn ($q) => $q->where('branch_id', $branchId));
        $riderQuery  = fn () => Rider::when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        $weekStart  = Carbon::now()->startOfWeek();
        $monthStart = Carbon::now()->startOfMonth();

        // --- Today ---
        $todayTotal     = $query()->whereDate('created_at', today())->count();
        $deliveredToday = $query()->whereDate('created_at', today())->where('status', 'delivered')->count();
        $failedToday    = $query()->whereDate('created_at', today())->whereIn('status', ['failed', 'cancelled'])->count();

        // --- This Week ---
        $weekTotal     = $query()->where('created_at', '>=', $weekStart)->count();
        $weekDelivered = $query()->where('created_at', '>=', $weekStart)->where('status', 'delivered')->count();
        $weekFailed    = $query()->where('created_at', '>=', $weekStart)->whereIn('status', ['failed', 'cancelled'])->count();

        // --- This Month ---
        $monthTotal     = $query()->where('created_at', '>=', $monthStart)->count();
        $monthDelivered = $query()->where('created_at', '>=', $monthStart)->where('status', 'delivered')->count();
        $monthRevenue   = $query()->where('created_at', '>=', $monthStart)->where('status', 'delivered')->sum('total_price');

        // --- Live / Operational ---
        $activeRiders  = $riderQuery()->where('availability', '!=', 'offline')->where('status', 'approved')->count();
        $totalApproved = $riderQuery()->where('status', 'approved')->count();
        $inTransit     = $query()->whereIn('status', ['accepted', 'en_route_pickup', 'at_pickup', 'picked_up', 'in_transit', 'at_dropoff'])->count();
        $pendingPickups= $query()->whereIn('status', ['pending', 'broadcasting'])->count();
        $pendingKyc    = $riderQuery()->where('status', 'pending')->count();

        // --- Success rate (this month) ---
        $successRate = $monthTotal > 0 ? round(($monthDelivered / $monthTotal) * 100) : 0;

        // --- 7-day sparkline for Today's Deliveries card ---
        $sparkline = collect(range(6, 0))->map(
            fn ($i) => $query()->whereDate('created_at', Carbon::today()->subDays($i))->count()
        )->values()->toArray();

        return [
            // Row 1 — Volume
            Stat::make("Today's Deliveries", $todayTotal)
                ->description("{$deliveredToday} delivered · {$failedToday} failed")
                ->descriptionIcon('heroicon-m-clipboard-document-list')
                ->chart($sparkline)
                ->color('primary'),

            Stat::make('This Week', $weekTotal)
                ->description("{$weekDelivered} delivered · {$weekFailed} failed")
                ->descriptionIcon('heroicon-m-calendar-days')
                ->color('primary'),

            Stat::make('This Month', $monthTotal)
                ->description("{$monthDelivered} delivered · {$successRate}% success rate")
                ->descriptionIcon('heroicon-m-calendar')
                ->color($successRate >= 80 ? 'success' : ($successRate >= 60 ? 'warning' : 'danger')),

            // Row 2 — Live Operations
            Stat::make('Active Riders', $activeRiders)
                ->description("{$totalApproved} total approved")
                ->descriptionIcon('heroicon-m-truck')
                ->color('success'),

            Stat::make('In Transit', $inTransit)
                ->description('Deliveries currently on the road')
                ->descriptionIcon('heroicon-m-arrow-path')
                ->color('info'),

            Stat::make('Pending Dispatch', $pendingPickups)
                ->description('Awaiting rider assignment')
                ->descriptionIcon('heroicon-m-clock')
                ->color($pendingPickups > 5 ? 'danger' : 'warning'),

            // Row 3 — Finance & Compliance
            Stat::make("Month's Revenue", '₱' . number_format($monthRevenue, 2))
                ->description('From delivered orders this month')
                ->descriptionIcon('heroicon-m-currency-dollar')
                ->color('success'),

            Stat::make('Pending KYC', $pendingKyc)
                ->description('Rider applications to review')
                ->descriptionIcon('heroicon-m-document-check')
                ->color($pendingKyc > 0 ? 'warning' : 'success'),
        ];
    }
}

