<?php

namespace App\Filament\Widgets;

use App\Models\DeliveryJob;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Carbon;

class HqDeliveryChartWidget extends ChartWidget
{
    protected static ?string $heading = 'Delivery Trends (Last 7 Days)';

    protected static ?int $sort = 2;

    protected function getData(): array
    {
        $days = collect(range(6, 0))->map(fn ($i) => Carbon::today()->subDays($i));

        $delivered = $days->map(fn ($day) => DeliveryJob::whereDate('created_at', $day)
            ->where('status', 'delivered')->count());

        $failed = $days->map(fn ($day) => DeliveryJob::whereDate('created_at', $day)
            ->whereIn('status', ['failed', 'cancelled'])->count());

        $total = $days->map(fn ($day) => DeliveryJob::whereDate('created_at', $day)->count());

        return [
            'datasets' => [
                [
                    'label' => 'Total',
                    'data' => $total->toArray(),
                    'borderColor' => '#f5a524',
                    'backgroundColor' => 'rgba(245, 165, 36, 0.1)',
                ],
                [
                    'label' => 'Delivered',
                    'data' => $delivered->toArray(),
                    'borderColor' => '#22c55e',
                    'backgroundColor' => 'rgba(34, 197, 94, 0.1)',
                ],
                [
                    'label' => 'Failed/Cancelled',
                    'data' => $failed->toArray(),
                    'borderColor' => '#ef4444',
                    'backgroundColor' => 'rgba(239, 68, 68, 0.1)',
                ],
            ],
            'labels' => $days->map(fn ($day) => $day->format('M d'))->toArray(),
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }
}

