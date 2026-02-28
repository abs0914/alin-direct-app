<?php

namespace App\Filament\Resources\DeliveryJobResource\RelationManagers;

use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class JobOffersRelationManager extends RelationManager
{
    protected static string $relationship = 'jobOffers';

    protected static ?string $title = 'Job Offers';

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('rider.user.name')
                    ->label('Rider')
                    ->searchable(),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pending' => 'warning',
                        'accepted' => 'success',
                        'rejected' => 'danger',
                        'expired' => 'gray',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('expires_at')
                    ->dateTime('M d, H:i'),
                Tables\Columns\TextColumn::make('responded_at')
                    ->dateTime('M d, H:i'),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime('M d, H:i'),
            ])
            ->defaultSort('created_at', 'desc');
    }
}

