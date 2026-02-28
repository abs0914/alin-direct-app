<?php

namespace App\Filament\Resources\BranchResource\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class DeliveryJobsRelationManager extends RelationManager
{
    protected static string $relationship = 'deliveryJobs';

    protected static ?string $title = 'Delivery Jobs';

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('tracking_uuid')
                    ->label('Tracking')
                    ->limit(12)
                    ->copyable(),
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
                Tables\Columns\TextColumn::make('rider.user.name')
                    ->label('Rider')
                    ->default('Unassigned'),
                Tables\Columns\TextColumn::make('pickup_contact_name')
                    ->label('From'),
                Tables\Columns\TextColumn::make('dropoff_contact_name')
                    ->label('To'),
                Tables\Columns\TextColumn::make('total_price')
                    ->money('PHP'),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime('M d, Y H:i'),
            ])
            ->defaultSort('created_at', 'desc');
    }
}

