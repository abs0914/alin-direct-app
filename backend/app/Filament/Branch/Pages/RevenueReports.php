<?php

namespace App\Filament\Branch\Pages;

use App\Models\DeliveryJob;
use Filament\Pages\Page;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class RevenueReports extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-currency-dollar';

    protected static ?string $navigationGroup = 'Reports & Analytics';

    protected static ?int $navigationSort = 2;

    protected static ?string $navigationLabel = 'Revenue Reports';

    protected static ?string $title = 'Revenue Reports';

    protected static string $view = 'filament.branch.pages.revenue-reports';

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

        $todayRevenue = (clone $this->branchQuery())->whereDate('created_at', $today)->where('status', 'delivered')->sum('total_price');
        $todayCommission = (clone $this->branchQuery())->whereDate('created_at', $today)->where('status', 'delivered')->sum('platform_commission');
        $todayRiderEarnings = (clone $this->branchQuery())->whereDate('created_at', $today)->where('status', 'delivered')->sum('rider_earnings');

        $weekRevenue = (clone $this->branchQuery())->where('created_at', '>=', $thisWeekStart)->where('status', 'delivered')->sum('total_price');
        $weekCommission = (clone $this->branchQuery())->where('created_at', '>=', $thisWeekStart)->where('status', 'delivered')->sum('platform_commission');

        $monthRevenue = (clone $this->branchQuery())->where('created_at', '>=', $thisMonthStart)->where('status', 'delivered')->sum('total_price');
        $monthCommission = (clone $this->branchQuery())->where('created_at', '>=', $thisMonthStart)->where('status', 'delivered')->sum('platform_commission');

        $allTimeRevenue = (clone $this->branchQuery())->where('status', 'delivered')->sum('total_price');
        $allTimeCommission = (clone $this->branchQuery())->where('status', 'delivered')->sum('platform_commission');
        $allTimeRiderEarnings = (clone $this->branchQuery())->where('status', 'delivered')->sum('rider_earnings');

        $paymentMethods = (clone $this->branchQuery())->where('status', 'delivered')
            ->selectRaw('payment_method, COUNT(*) as count, SUM(total_price) as total')
            ->groupBy('payment_method')
            ->get()
            ->keyBy('payment_method')
            ->toArray();

        $codTotal = (clone $this->branchQuery())->where('status', 'delivered')->where('payment_method', 'cod')->count();
        $codSettled = (clone $this->branchQuery())->where('status', 'delivered')->where('payment_method', 'cod')->where('cod_settled', true)->count();
        $codUnsettled = $codTotal - $codSettled;

        $days = collect(range(6, 0))->map(fn ($i) => Carbon::today()->subDays($i));
        $revenueTrend = $days->map(fn ($day) => [
            'date' => $day->format('M d'),
            'revenue' => (float) (clone $this->branchQuery())->whereDate('created_at', $day)->where('status', 'delivered')->sum('total_price'),
            'commission' => (float) (clone $this->branchQuery())->whereDate('created_at', $day)->where('status', 'delivered')->sum('platform_commission'),
        ]);

        $avgOrderValue = (clone $this->branchQuery())->where('status', 'delivered')->avg('total_price') ?? 0;

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

