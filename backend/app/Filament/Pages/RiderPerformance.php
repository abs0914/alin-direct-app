<?php

namespace App\Filament\Pages;

use App\Models\DeliveryJob;
use App\Models\Rider;
use Filament\Pages\Page;
use Illuminate\Support\Carbon;

class RiderPerformance extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-user-group';

    protected static ?string $navigationGroup = 'Reports & Analytics';

    protected static ?int $navigationSort = 3;

    protected static ?string $navigationLabel = 'Rider Performance';

    protected static ?string $title = 'Rider Performance';

    protected static string $view = 'filament.pages.rider-performance';

    protected function getViewData(): array
    {
        // Rider counts by status
        $totalRiders = Rider::count();
        $approvedRiders = Rider::where('status', 'approved')->count();
        $pendingRiders = Rider::where('status', 'pending')->count();
        $suspendedRiders = Rider::where('status', 'suspended')->count();
        $onlineRiders = Rider::where('availability', 'online')->where('status', 'approved')->count();

        // Vehicle type breakdown
        $vehicleTypes = Rider::selectRaw('vehicle_type, COUNT(*) as count')
            ->groupBy('vehicle_type')
            ->pluck('count', 'vehicle_type')
            ->toArray();

        // Top 10 riders by deliveries
        $topRiders = Rider::withCount(['deliveryJobs as completed_deliveries' => function ($q) {
                $q->where('status', 'delivered');
            }])
            ->with('user:id,name,phone')
            ->with('branch:id,name')
            ->where('status', 'approved')
            ->orderByDesc('completed_deliveries')
            ->limit(10)
            ->get();

        // Average rating
        $avgRating = Rider::where('status', 'approved')->whereNotNull('rating')->avg('rating') ?? 0;

        // Rider retention (active in last 7 days)
        $activeLastWeek = Rider::where('status', 'approved')
            ->where('last_seen_at', '>=', Carbon::now()->subDays(7))
            ->count();

        // Rider retention (active in last 30 days)
        $activeLastMonth = Rider::where('status', 'approved')
            ->where('last_seen_at', '>=', Carbon::now()->subDays(30))
            ->count();

        $retentionRate7d = $approvedRiders > 0 ? round(($activeLastWeek / $approvedRiders) * 100, 1) : 0;
        $retentionRate30d = $approvedRiders > 0 ? round(($activeLastMonth / $approvedRiders) * 100, 1) : 0;

        // Avg deliveries per rider (approved)
        $avgDeliveriesPerRider = $approvedRiders > 0
            ? round(DeliveryJob::where('status', 'delivered')->count() / $approvedRiders, 1)
            : 0;

        // Avg earnings per rider
        $totalRiderEarnings = DeliveryJob::where('status', 'delivered')->sum('rider_earnings');
        $avgEarningsPerRider = $approvedRiders > 0 ? round($totalRiderEarnings / $approvedRiders, 2) : 0;

        return compact(
            'totalRiders', 'approvedRiders', 'pendingRiders', 'suspendedRiders', 'onlineRiders',
            'vehicleTypes', 'topRiders', 'avgRating',
            'activeLastWeek', 'activeLastMonth', 'retentionRate7d', 'retentionRate30d',
            'avgDeliveriesPerRider', 'avgEarningsPerRider'
        );
    }
}

