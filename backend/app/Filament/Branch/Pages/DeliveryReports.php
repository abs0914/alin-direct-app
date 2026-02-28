<?php

namespace App\Filament\Branch\Pages;

use App\Models\DeliveryJob;
use Filament\Pages\Page;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class DeliveryReports extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-list';

    protected static ?string $navigationGroup = 'Reports & Analytics';

    protected static ?int $navigationSort = 1;

    protected static ?string $navigationLabel = 'Delivery Reports';

    protected static ?string $title = 'Delivery Reports';

    protected static string $view = 'filament.branch.pages.delivery-reports';

    private function branchQuery()
    {
        $branchId = Auth::user()?->branch_id;
        return DeliveryJob::when($branchId, fn ($q) => $q->where('branch_id', $branchId));
    }

    protected function getViewData(): array
    {
        $today = Carbon::today();
        $thisWeekStart = Carbon::now()->startOfWeek();
        $thisMonthStart = Carbon::now()->startOfMonth();

        $todayTotal = (clone $this->branchQuery())->whereDate('created_at', $today)->count();
        $todayDelivered = (clone $this->branchQuery())->whereDate('created_at', $today)->where('status', 'delivered')->count();
        $todayFailed = (clone $this->branchQuery())->whereDate('created_at', $today)->whereIn('status', ['failed', 'cancelled'])->count();
        $todayPending = (clone $this->branchQuery())->whereDate('created_at', $today)->whereIn('status', ['pending', 'broadcasting'])->count();
        $todayInTransit = (clone $this->branchQuery())->whereDate('created_at', $today)->whereIn('status', ['accepted', 'picked_up', 'in_transit'])->count();

        $weekTotal = (clone $this->branchQuery())->where('created_at', '>=', $thisWeekStart)->count();
        $weekDelivered = (clone $this->branchQuery())->where('created_at', '>=', $thisWeekStart)->where('status', 'delivered')->count();

        $monthTotal = (clone $this->branchQuery())->where('created_at', '>=', $thisMonthStart)->count();
        $monthDelivered = (clone $this->branchQuery())->where('created_at', '>=', $thisMonthStart)->where('status', 'delivered')->count();

        $allTimeTotal = (clone $this->branchQuery())->count();
        $allTimeDelivered = (clone $this->branchQuery())->where('status', 'delivered')->count();

        $days = collect(range(6, 0))->map(fn ($i) => Carbon::today()->subDays($i));
        $dailyTrend = $days->map(fn ($day) => [
            'date' => $day->format('M d'),
            'total' => (clone $this->branchQuery())->whereDate('created_at', $day)->count(),
            'delivered' => (clone $this->branchQuery())->whereDate('created_at', $day)->where('status', 'delivered')->count(),
            'failed' => (clone $this->branchQuery())->whereDate('created_at', $day)->whereIn('status', ['failed', 'cancelled'])->count(),
        ]);

        $statusBreakdown = (clone $this->branchQuery())
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $vehicleBreakdown = (clone $this->branchQuery())
            ->selectRaw('vehicle_type, COUNT(*) as count')
            ->groupBy('vehicle_type')
            ->pluck('count', 'vehicle_type')
            ->toArray();

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

