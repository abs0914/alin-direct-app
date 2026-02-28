<?php

namespace App\Filament\Resources\BranchResource\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class RidersRelationManager extends RelationManager
{
    protected static string $relationship = 'riders';

    protected static ?string $title = 'Riders';

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Name')
                    ->searchable(),
                Tables\Columns\TextColumn::make('user.phone')
                    ->label('Phone'),
                Tables\Columns\TextColumn::make('vehicle_type')
                    ->badge(),
                Tables\Columns\TextColumn::make('plate_number'),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'approved' => 'success',
                        'pending' => 'warning',
                        'suspended' => 'danger',
                        'rejected' => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('availability')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'online' => 'success',
                        'on_job' => 'info',
                        'offline' => 'gray',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('rating')
                    ->numeric(2),
                Tables\Columns\TextColumn::make('total_deliveries')
                    ->label('Deliveries'),
            ])
            ->defaultSort('created_at', 'desc');
    }
}

