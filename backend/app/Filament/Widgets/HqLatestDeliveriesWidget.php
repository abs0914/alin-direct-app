<?php

namespace App\Filament\Widgets;

use App\Models\DeliveryJob;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class HqLatestDeliveriesWidget extends BaseWidget
{
    protected static ?string $heading = 'Latest Deliveries';

    protected static ?int $sort = 3;

    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(DeliveryJob::query()->latest()->limit(10))
            ->columns([
                Tables\Columns\TextColumn::make('tracking_uuid')
                    ->label('Tracking')
                    ->limit(12)
                    ->copyable()
                    ->searchable(),
                Tables\Columns\TextColumn::make('branch.name')
                    ->label('Branch')
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pending' => 'gray',
                        'broadcasting' => 'info',
                        'accepted', 'en_route_pickup', 'at_pickup' => 'warning',
                        'picked_up', 'in_transit', 'at_dropoff' => 'primary',
                        'delivered' => 'success',
                        'failed', 'cancelled' => 'danger',
                        'returned' => 'gray',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('pickup_contact_name')
                    ->label('From'),
                Tables\Columns\TextColumn::make('dropoff_contact_name')
                    ->label('To'),
                Tables\Columns\TextColumn::make('rider.user.name')
                    ->label('Rider')
                    ->default('Unassigned'),
                Tables\Columns\TextColumn::make('total_price')
                    ->money('PHP')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime('M d, H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->paginated(false);
    }
}

