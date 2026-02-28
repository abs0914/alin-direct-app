<?php

namespace App\Filament\Resources;

use App\Filament\Resources\RiderResource\Pages;
use App\Filament\Resources\RiderResource\RelationManagers;
use App\Models\Rider;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class RiderResource extends Resource
{
    protected static ?string $model = Rider::class;

    protected static ?string $navigationIcon = 'heroicon-o-truck';

    protected static ?string $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Rider Profile')
                    ->columns(2)
                    ->schema([
                        Forms\Components\Select::make('user_id')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\Select::make('branch_id')
                            ->relationship('branch', 'name')
                            ->searchable()
                            ->preload(),
                        Forms\Components\Select::make('status')
                            ->options([
                                'pending' => 'Pending',
                                'approved' => 'Approved',
                                'suspended' => 'Suspended',
                                'rejected' => 'Rejected',
                                'blacklisted' => 'Blacklisted',
                            ])
                            ->required(),
                        Forms\Components\Select::make('availability')
                            ->options([
                                'offline' => 'Offline',
                                'online' => 'Online',
                                'on_job' => 'On Job',
                            ])
                            ->required(),
                    ]),
                Forms\Components\Section::make('Vehicle Information')
                    ->columns(2)
                    ->schema([
                        Forms\Components\Select::make('vehicle_type')
                            ->options([
                                'motorcycle' => 'Motorcycle',
                                'mpv' => 'MPV',
                                'van' => 'Van',
                                'truck' => 'Truck',
                            ])
                            ->required(),
                        Forms\Components\TextInput::make('plate_number'),
                        Forms\Components\TextInput::make('vehicle_brand'),
                        Forms\Components\TextInput::make('vehicle_model'),
                        Forms\Components\TextInput::make('vehicle_color'),
                    ]),
                Forms\Components\Section::make('Maya Payout')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('maya_wallet_id'),
                        Forms\Components\TextInput::make('maya_phone')->tel(),
                    ]),
                Forms\Components\Section::make('Performance')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('rating')
                            ->numeric()
                            ->disabled(),
                        Forms\Components\TextInput::make('total_deliveries')
                            ->numeric()
                            ->disabled(),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('user.phone')
                    ->label('Phone')
                    ->searchable(),
                Tables\Columns\TextColumn::make('branch.name')
                    ->label('Branch')
                    ->sortable(),
                Tables\Columns\TextColumn::make('vehicle_type')
                    ->badge(),
                Tables\Columns\TextColumn::make('plate_number')
                    ->searchable(),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'approved' => 'success',
                        'pending' => 'warning',
                        'suspended' => 'danger',
                        'rejected' => 'danger',
                        'blacklisted' => 'gray',
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
                    ->numeric(2)
                    ->sortable(),
                Tables\Columns\TextColumn::make('total_deliveries')
                    ->label('Deliveries')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'approved' => 'Approved',
                        'suspended' => 'Suspended',
                        'rejected' => 'Rejected',
                        'blacklisted' => 'Blacklisted',
                    ]),
                Tables\Filters\SelectFilter::make('vehicle_type')
                    ->options([
                        'motorcycle' => 'Motorcycle',
                        'mpv' => 'MPV',
                        'van' => 'Van',
                        'truck' => 'Truck',
                    ]),
                Tables\Filters\SelectFilter::make('branch')
                    ->relationship('branch', 'name'),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('approve')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn ($record) => $record->status === 'pending')
                    ->action(fn ($record) => $record->update([
                        'status' => 'approved',
                        'kyc_verified_at' => now(),
                        'kyc_verified_by' => auth()->id(),
                    ])),
                Tables\Actions\Action::make('reject')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn ($record) => $record->status === 'pending')
                    ->action(fn ($record) => $record->update(['status' => 'rejected'])),
                Tables\Actions\Action::make('suspend')
                    ->icon('heroicon-o-pause-circle')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->visible(fn ($record) => $record->status === 'approved')
                    ->action(fn ($record) => $record->update(['status' => 'suspended'])),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('Rider Profile')
                    ->columns(4)
                    ->schema([
                        Infolists\Components\TextEntry::make('user.name')->label('Name')->weight('bold'),
                        Infolists\Components\TextEntry::make('user.phone')->label('Phone'),
                        Infolists\Components\TextEntry::make('user.email')->label('Email'),
                        Infolists\Components\TextEntry::make('branch.name')->label('Branch'),
                        Infolists\Components\TextEntry::make('status')
                            ->badge()
                            ->color(fn (string $state): string => match ($state) {
                                'approved' => 'success',
                                'pending' => 'warning',
                                'suspended' => 'danger',
                                'rejected' => 'danger',
                                'blacklisted' => 'gray',
                                default => 'gray',
                            }),
                        Infolists\Components\TextEntry::make('availability')
                            ->badge()
                            ->color(fn (string $state): string => match ($state) {
                                'online' => 'success',
                                'on_job' => 'info',
                                'offline' => 'gray',
                                default => 'gray',
                            }),
                        Infolists\Components\TextEntry::make('rating')->label('Rating'),
                        Infolists\Components\TextEntry::make('total_deliveries')->label('Total Deliveries'),
                    ]),

                Infolists\Components\Section::make('Vehicle Information')
                    ->columns(4)
                    ->schema([
                        Infolists\Components\TextEntry::make('vehicle_type')->badge(),
                        Infolists\Components\TextEntry::make('plate_number'),
                        Infolists\Components\TextEntry::make('vehicle_brand'),
                        Infolists\Components\TextEntry::make('vehicle_model'),
                        Infolists\Components\TextEntry::make('vehicle_color'),
                    ]),

                Infolists\Components\Section::make('KYC Documents')
                    ->columns(2)
                    ->schema([
                        Infolists\Components\ImageEntry::make('license_url')
                            ->label('Driver\'s License')
                            ->height(200),
                        Infolists\Components\ImageEntry::make('or_cr_url')
                            ->label('OR/CR')
                            ->height(200),
                        Infolists\Components\ImageEntry::make('nbi_clearance_url')
                            ->label('NBI Clearance')
                            ->height(200),
                        Infolists\Components\ImageEntry::make('selfie_url')
                            ->label('Selfie with ID')
                            ->height(200),
                    ]),

                Infolists\Components\Section::make('KYC Verification')
                    ->columns(3)
                    ->schema([
                        Infolists\Components\TextEntry::make('kyc_verified_at')
                            ->label('Verified At')
                            ->dateTime(),
                        Infolists\Components\TextEntry::make('kycVerifiedBy.name')
                            ->label('Verified By'),
                        Infolists\Components\IconEntry::make('terms_accepted')
                            ->label('Terms Accepted')
                            ->boolean(),
                        Infolists\Components\TextEntry::make('terms_accepted_at')
                            ->dateTime(),
                    ]),

                Infolists\Components\Section::make('Maya Payout')
                    ->columns(2)
                    ->schema([
                        Infolists\Components\TextEntry::make('maya_wallet_id'),
                        Infolists\Components\TextEntry::make('maya_phone'),
                    ]),

                Infolists\Components\Section::make('Location')
                    ->columns(3)
                    ->schema([
                        Infolists\Components\TextEntry::make('current_lat')->label('Latitude'),
                        Infolists\Components\TextEntry::make('current_lng')->label('Longitude'),
                        Infolists\Components\TextEntry::make('last_seen_at')->dateTime(),
                    ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            RelationManagers\DeliveryJobsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListRiders::route('/'),
            'create' => Pages\CreateRider::route('/create'),
            'view' => Pages\ViewRider::route('/{record}'),
            'edit' => Pages\EditRider::route('/{record}/edit'),
        ];
    }
}
