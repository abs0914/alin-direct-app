<?php

namespace App\Filament\Pages;

use App\Models\DeliveryJob;
use Filament\Pages\Page;
use Illuminate\Support\Carbon;

class RevenueReports extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-currency-dollar';

    protected static ?string $navigationGroup = 'Reports & Analytics';

    protected static ?int $navigationSort = 2;

    protected static ?string $navigationLabel = 'Revenue Reports';

    protected static ?string $title = 'Revenue Reports';

    protected static string $view = 'filament.pages.revenue-reports';

    protected function getViewData(): array
    {
        $today = Carbon::today();
        $thisWeekStart = Carbon::now()->startOfWeek();
        $thisMonthStart = Carbon::now()->startOfMonth();

        // Today's revenue
        $todayRevenue = DeliveryJob::whereDate('created_at', $today)->where('status', 'delivered')->sum('total_price');
        $todayCommission = DeliveryJob::whereDate('created_at', $today)->where('status', 'delivered')->sum('platform_commission');
        $todayRiderEarnings = DeliveryJob::whereDate('created_at', $today)->where('status', 'delivered')->sum('rider_earnings');

        // Weekly revenue
        $weekRevenue = DeliveryJob::where('created_at', '>=', $thisWeekStart)->where('status', 'delivered')->sum('total_price');
        $weekCommission = DeliveryJob::where('created_at', '>=', $thisWeekStart)->where('status', 'delivered')->sum('platform_commission');

        // Monthly revenue
        $monthRevenue = DeliveryJob::where('created_at', '>=', $thisMonthStart)->where('status', 'delivered')->sum('total_price');
        $monthCommission = DeliveryJob::where('created_at', '>=', $thisMonthStart)->where('status', 'delivered')->sum('platform_commission');

        // All-time revenue
        $allTimeRevenue = DeliveryJob::where('status', 'delivered')->sum('total_price');
        $allTimeCommission = DeliveryJob::where('status', 'delivered')->sum('platform_commission');
        $allTimeRiderEarnings = DeliveryJob::where('status', 'delivered')->sum('rider_earnings');

        // Payment method breakdown
        $paymentMethods = DeliveryJob::where('status', 'delivered')
            ->selectRaw('payment_method, COUNT(*) as count, SUM(total_price) as total')
            ->groupBy('payment_method')
            ->get()
            ->keyBy('payment_method')
            ->toArray();

        // COD stats
        $codTotal = DeliveryJob::where('status', 'delivered')->where('payment_method', 'cod')->count();
        $codSettled = DeliveryJob::where('status', 'delivered')->where('payment_method', 'cod')->where('cod_settled', true)->count();
        $codUnsettled = $codTotal - $codSettled;

        // Daily revenue trend (last 7 days)
        $days = collect(range(6, 0))->map(fn ($i) => Carbon::today()->subDays($i));
        $revenueTrend = $days->map(fn ($day) => [
            'date' => $day->format('M d'),
            'revenue' => (float) DeliveryJob::whereDate('created_at', $day)->where('status', 'delivered')->sum('total_price'),
            'commission' => (float) DeliveryJob::whereDate('created_at', $day)->where('status', 'delivered')->sum('platform_commission'),
        ]);

        // Average order value
        $avgOrderValue = DeliveryJob::where('status', 'delivered')->avg('total_price') ?? 0;

        return compact(
            'todayRevenue', 'todayCommission', 'todayRiderEarnings',
            'weekRevenue', 'weekCommission',
            'monthRevenue', 'monthCommission',
            'allTimeRevenue', 'allTimeCommission', 'allTimeRiderEarnings',
            'paymentMethods', 'codTotal', 'codSettled', 'codUnsettled',
            'revenueTrend', 'avgOrderValue'
        );
    }
}

