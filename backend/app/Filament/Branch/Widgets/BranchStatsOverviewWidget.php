<?php

namespace App\Filament\Branch\Widgets;

use App\Models\DeliveryJob;
use App\Models\Rider;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\Auth;

class BranchStatsOverviewWidget extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $user = Auth::user();
        $branchId = $user?->branch_id;

        $query = fn () => DeliveryJob::when($branchId, fn ($q) => $q->where('branch_id', $branchId));
        $riderQuery = fn () => Rider::when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        $todayDeliveries = $query()->whereDate('created_at', today())->count();
        $activeRiders = $riderQuery()->where('availability', '!=', 'offline')
            ->where('status', 'approved')->count();
        $pendingPickups = $query()->whereIn('status', ['pending', 'broadcasting'])->count();
        $todayRevenue = $query()->whereDate('created_at', today())
            ->where('status', 'delivered')->sum('total_price');
        $deliveredToday = $query()->whereDate('created_at', today())
            ->where('status', 'delivered')->count();
        $inTransit = $query()->whereIn('status', ['en_route_pickup', 'at_pickup', 'picked_up', 'in_transit', 'at_dropoff'])->count();
        $pendingKyc = $riderQuery()->where('status', 'pending')->count();
        $codPending = $query()->where('payment_method', 'cod')
            ->where('cod_collected', true)->where('cod_settled', false)->count();

        return [
            Stat::make('Today\'s Deliveries', $todayDeliveries)
                ->description($deliveredToday . ' completed')
                ->descriptionIcon('heroicon-m-clipboard-document-list')
                ->color('primary'),
            Stat::make('Active Riders', $activeRiders)
                ->description($riderQuery()->where('status', 'approved')->count() . ' total approved')
                ->descriptionIcon('heroicon-m-truck')
                ->color('success'),
            Stat::make('In Transit', $inTransit)
                ->description('Active deliveries')
                ->descriptionIcon('heroicon-m-arrow-path')
                ->color('info'),
            Stat::make('Pending Dispatch', $pendingPickups)
                ->description('Awaiting assignment')
                ->descriptionIcon('heroicon-m-clock')
                ->color($pendingPickups > 5 ? 'danger' : 'warning'),
            Stat::make('Today\'s Revenue', '₱' . number_format($todayRevenue, 2))
                ->description('From completed deliveries')
                ->descriptionIcon('heroicon-m-currency-dollar')
                ->color('success'),
            Stat::make('Pending KYC', $pendingKyc)
                ->description('Rider applications to review')
                ->descriptionIcon('heroicon-m-document-check')
                ->color($pendingKyc > 0 ? 'warning' : 'success'),
        ];
    }
}

