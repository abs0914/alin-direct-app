<?php

namespace App\Filament\Pages;

use App\Models\Branch;
use App\Models\DeliveryJob;
use App\Models\Rider;
use Filament\Pages\Page;

class BranchPerformance extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-building-office-2';

    protected static ?string $navigationGroup = 'Reports & Analytics';

    protected static ?int $navigationSort = 4;

    protected static ?string $navigationLabel = 'Branch Performance';

    protected static ?string $title = 'Branch Performance';

    protected static string $view = 'filament.pages.branch-performance';

    protected function getViewData(): array
    {
        $branches = Branch::where('is_active', true)
            ->withCount([
                'riders',
                'riders as approved_riders_count' => function ($q) {
                    $q->where('status', 'approved');
                },
                'riders as online_riders_count' => function ($q) {
                    $q->where('status', 'approved')->where('availability', 'online');
                },
                'deliveryJobs as total_jobs_count',
                'deliveryJobs as delivered_jobs_count' => function ($q) {
                    $q->where('status', 'delivered');
                },
                'deliveryJobs as failed_jobs_count' => function ($q) {
                    $q->whereIn('status', ['failed', 'cancelled']);
                },
                'deliveryJobs as pending_jobs_count' => function ($q) {
                    $q->whereIn('status', ['pending', 'broadcasting']);
                },
            ])
            ->withSum(['deliveryJobs as total_revenue' => function ($q) {
                $q->where('status', 'delivered');
            }], 'total_price')
            ->withSum(['deliveryJobs as total_commission' => function ($q) {
                $q->where('status', 'delivered');
            }], 'platform_commission')
            ->get()
            ->map(function ($branch) {
                $branch->success_rate = $branch->total_jobs_count > 0
                    ? round(($branch->delivered_jobs_count / $branch->total_jobs_count) * 100, 1)
                    : 0;
                return $branch;
            });

        $totalActiveBranches = $branches->count();
        $totalRiders = $branches->sum('riders_count');
        $totalDeliveries = $branches->sum('total_jobs_count');
        $totalRevenue = $branches->sum('total_revenue');

        return compact('branches', 'totalActiveBranches', 'totalRiders', 'totalDeliveries', 'totalRevenue');
    }
}

