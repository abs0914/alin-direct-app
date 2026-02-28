<?php

namespace App\Filament\Widgets;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\DeliveryJob;
use App\Models\Rider;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class HqStatsOverviewWidget extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $todayDeliveries = DeliveryJob::whereDate('created_at', today())->count();
        $activeRiders = Rider::where('availability', '!=', 'offline')
            ->where('status', 'approved')->count();
        $totalBranches = Branch::where('is_active', true)->count();
        $todayRevenue = DeliveryJob::whereDate('created_at', today())
            ->where('status', 'delivered')
            ->sum('total_price');
        $pendingDeliveries = DeliveryJob::whereIn('status', ['pending', 'broadcasting'])->count();
        $totalCustomers = Customer::count();
        $deliveredToday = DeliveryJob::whereDate('created_at', today())
            ->where('status', 'delivered')->count();
        $failedToday = DeliveryJob::whereDate('created_at', today())
            ->whereIn('status', ['failed', 'cancelled'])->count();

        return [
            Stat::make('Today\'s Deliveries', $todayDeliveries)
                ->description($deliveredToday . ' delivered, ' . $failedToday . ' failed')
                ->descriptionIcon('heroicon-m-clipboard-document-list')
                ->color('primary'),
            Stat::make('Active Riders', $activeRiders)
                ->description(Rider::where('status', 'approved')->count() . ' total approved')
                ->descriptionIcon('heroicon-m-truck')
                ->color('success'),
            Stat::make('Pending Dispatch', $pendingDeliveries)
                ->description('Awaiting rider assignment')
                ->descriptionIcon('heroicon-m-clock')
                ->color($pendingDeliveries > 10 ? 'danger' : 'warning'),
            Stat::make('Today\'s Revenue', '₱' . number_format($todayRevenue, 2))
                ->description('From delivered orders')
                ->descriptionIcon('heroicon-m-currency-dollar')
                ->color('success'),
            Stat::make('Active Branches', $totalBranches)
                ->description(Branch::count() . ' total branches')
                ->descriptionIcon('heroicon-m-building-office-2')
                ->color('info'),
            Stat::make('Total Customers', $totalCustomers)
                ->description('Registered customers')
                ->descriptionIcon('heroicon-m-users')
                ->color('primary'),
        ];
    }
}

