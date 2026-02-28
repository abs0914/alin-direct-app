<?php

namespace App\Filament\Pages;

use App\Models\DeliveryJob;
use Filament\Pages\Page;
use Illuminate\Support\Carbon;

class DeliveryReports extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-list';

    protected static ?string $navigationGroup = 'Reports & Analytics';

    protected static ?int $navigationSort = 1;

    protected static ?string $navigationLabel = 'Delivery Reports';

    protected static ?string $title = 'Delivery Reports';

    protected static string $view = 'filament.pages.delivery-reports';

    protected function getViewData(): array
    {
        $today = Carbon::today();
        $thisWeekStart = Carbon::now()->startOfWeek();
        $thisMonthStart = Carbon::now()->startOfMonth();

        // Today's stats
        $todayTotal = DeliveryJob::whereDate('created_at', $today)->count();
        $todayDelivered = DeliveryJob::whereDate('created_at', $today)->where('status', 'delivered')->count();
        $todayFailed = DeliveryJob::whereDate('created_at', $today)->whereIn('status', ['failed', 'cancelled'])->count();
        $todayPending = DeliveryJob::whereDate('created_at', $today)->whereIn('status', ['pending', 'broadcasting'])->count();
        $todayInTransit = DeliveryJob::whereDate('created_at', $today)->whereIn('status', ['accepted', 'picked_up', 'in_transit'])->count();

        // Weekly stats
        $weekTotal = DeliveryJob::where('created_at', '>=', $thisWeekStart)->count();
        $weekDelivered = DeliveryJob::where('created_at', '>=', $thisWeekStart)->where('status', 'delivered')->count();

        // Monthly stats
        $monthTotal = DeliveryJob::where('created_at', '>=', $thisMonthStart)->count();
        $monthDelivered = DeliveryJob::where('created_at', '>=', $thisMonthStart)->where('status', 'delivered')->count();

        // All-time stats
        $allTimeTotal = DeliveryJob::count();
        $allTimeDelivered = DeliveryJob::where('status', 'delivered')->count();

        // Last 7 days trend
        $days = collect(range(6, 0))->map(fn ($i) => Carbon::today()->subDays($i));
        $dailyTrend = $days->map(fn ($day) => [
            'date' => $day->format('M d'),
            'total' => DeliveryJob::whereDate('created_at', $day)->count(),
            'delivered' => DeliveryJob::whereDate('created_at', $day)->where('status', 'delivered')->count(),
            'failed' => DeliveryJob::whereDate('created_at', $day)->whereIn('status', ['failed', 'cancelled'])->count(),
        ]);

        // Status breakdown (all-time)
        $statusBreakdown = DeliveryJob::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Vehicle type breakdown
        $vehicleBreakdown = DeliveryJob::selectRaw('vehicle_type, COUNT(*) as count')
            ->groupBy('vehicle_type')
            ->pluck('count', 'vehicle_type')
            ->toArray();

        // Success rate
        $successRate = $allTimeTotal > 0 ? round(($allTimeDelivered / $allTimeTotal) * 100, 1) : 0;

        return compact(
            'todayTotal', 'todayDelivered', 'todayFailed', 'todayPending', 'todayInTransit',
            'weekTotal', 'weekDelivered',
            'monthTotal', 'monthDelivered',
            'allTimeTotal', 'allTimeDelivered',
            'dailyTrend', 'statusBreakdown', 'vehicleBreakdown', 'successRate'
        );
    }
}

