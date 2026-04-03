<?php

namespace App\Filament\Branch\Widgets;

use App\Models\DeliveryJob;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class BranchDeliveryChartWidget extends ChartWidget
{
    protected static ?string $heading = '7-Day Delivery Trend';

    protected static ?int $sort = 2;          // Between stats (1) and deliveries table (3)

    protected int | string | array $columnSpan = 'full';

    protected static ?string $maxHeight = '220px';

    protected function getData(): array
    {
        $branchId = Auth::user()?->branch_id;

        $days = collect(range(6, 0))->map(fn ($i) => Carbon::today()->subDays($i));

        $labels    = $days->map(fn ($d) => $d->format('M d'))->toArray();

        $delivered = $days->map(fn ($d) => DeliveryJob::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereDate('created_at', $d)
            ->where('status', 'delivered')
            ->count()
        )->toArray();

        $failed = $days->map(fn ($d) => DeliveryJob::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereDate('created_at', $d)
            ->whereIn('status', ['failed', 'cancelled'])
            ->count()
        )->toArray();

        $inTransit = $days->map(fn ($d) => DeliveryJob::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereDate('created_at', $d)
            ->whereIn('status', ['accepted', 'en_route_pickup', 'at_pickup', 'picked_up', 'in_transit', 'at_dropoff'])
            ->count()
        )->toArray();

        return [
            'datasets' => [
                [
                    'label'           => 'Delivered',
                    'data'            => $delivered,
                    'backgroundColor' => 'rgba(22, 163, 74, 0.75)',   // green-600
                    'borderColor'     => 'rgba(22, 163, 74, 1)',
                    'borderWidth'     => 2,
                    'borderRadius'    => 4,
                ],
                [
                    'label'           => 'In Transit / Active',
                    'data'            => $inTransit,
                    'backgroundColor' => 'rgba(59, 130, 246, 0.65)',  // blue-500
                    'borderColor'     => 'rgba(59, 130, 246, 1)',
                    'borderWidth'     => 2,
                    'borderRadius'    => 4,
                ],
                [
                    'label'           => 'Failed / Cancelled',
                    'data'            => $failed,
                    'backgroundColor' => 'rgba(239, 68, 68, 0.65)',   // red-500
                    'borderColor'     => 'rgba(239, 68, 68, 1)',
                    'borderWidth'     => 2,
                    'borderRadius'    => 4,
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }

    protected function getOptions(): array
    {
        return [
            'plugins' => [
                'legend' => ['position' => 'top'],
            ],
            'scales' => [
                'x' => ['stacked' => false],
                'y' => [
                    'stacked'   => false,
                    'beginAtZero' => true,
                    'ticks'     => ['stepSize' => 1, 'precision' => 0],
                ],
            ],
        ];
    }
}

