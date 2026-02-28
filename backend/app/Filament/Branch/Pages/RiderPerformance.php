<?php

namespace App\Filament\Branch\Pages;

use App\Models\DeliveryJob;
use App\Models\Rider;
use Filament\Pages\Page;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class RiderPerformance extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-user-group';

    protected static ?string $navigationGroup = 'Reports & Analytics';

    protected static ?int $navigationSort = 3;

    protected static ?string $navigationLabel = 'Rider Performance';

    protected static ?string $title = 'Rider Performance';

    protected static string $view = 'filament.branch.pages.rider-performance';

    private function branchRiderQuery()
    {
        $branchId = Auth::user()?->branch_id;
        return Rider::when($branchId, fn ($q) => $q->where('branch_id', $branchId));
    }

    protected function getViewData(): array
    {
        $branchId = Auth::user()?->branch_id;

        $totalRiders = (clone $this->branchRiderQuery())->count();
        $approvedRiders = (clone $this->branchRiderQuery())->where('status', 'approved')->count();
        $pendingRiders = (clone $this->branchRiderQuery())->where('status', 'pending')->count();
        $suspendedRiders = (clone $this->branchRiderQuery())->where('status', 'suspended')->count();
        $onlineRiders = (clone $this->branchRiderQuery())->where('availability', 'online')->where('status', 'approved')->count();

        $vehicleTypes = (clone $this->branchRiderQuery())
            ->selectRaw('vehicle_type, COUNT(*) as count')
            ->groupBy('vehicle_type')
            ->pluck('count', 'vehicle_type')
            ->toArray();

        $topRiders = (clone $this->branchRiderQuery())
            ->withCount(['deliveryJobs as completed_deliveries' => function ($q) {
                $q->where('status', 'delivered');
            }])
            ->with('user:id,name,phone')
            ->where('status', 'approved')
            ->orderByDesc('completed_deliveries')
            ->limit(10)
            ->get();

        $avgRating = (clone $this->branchRiderQuery())->where('status', 'approved')->whereNotNull('rating')->avg('rating') ?? 0;

        $activeLastWeek = (clone $this->branchRiderQuery())
            ->where('status', 'approved')
            ->where('last_seen_at', '>=', Carbon::now()->subDays(7))
            ->count();

        $activeLastMonth = (clone $this->branchRiderQuery())
            ->where('status', 'approved')
            ->where('last_seen_at', '>=', Carbon::now()->subDays(30))
            ->count();

        $retentionRate7d = $approvedRiders > 0 ? round(($activeLastWeek / $approvedRiders) * 100, 1) : 0;
        $retentionRate30d = $approvedRiders > 0 ? round(($activeLastMonth / $approvedRiders) * 100, 1) : 0;

        $branchDelivered = DeliveryJob::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'delivered')->count();
        $avgDeliveriesPerRider = $approvedRiders > 0 ? round($branchDelivered / $approvedRiders, 1) : 0;

        $totalRiderEarnings = DeliveryJob::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->where('status', 'delivered')->sum('rider_earnings');
        $avgEarningsPerRider = $approvedRiders > 0 ? round($totalRiderEarnings / $approvedRiders, 2) : 0;

        return compact(
            'totalRiders', 'approvedRiders', 'pendingRiders', 'suspendedRiders', 'onlineRiders',
            'vehicleTypes', 'topRiders', 'avgRating',
            'activeLastWeek', 'activeLastMonth', 'retentionRate7d', 'retentionRate30d',
            'avgDeliveriesPerRider', 'avgEarningsPerRider'
        );
    }
}

