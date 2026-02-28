<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DeliveryJobResource\Pages;
use App\Filament\Resources\DeliveryJobResource\RelationManagers;
use App\Models\DeliveryJob;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class DeliveryJobResource extends Resource
{
    protected static ?string $model = DeliveryJob::class;

    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-list';

    protected static ?string $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 1;

    protected static ?string $recordTitleAttribute = 'tracking_uuid';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Job Assignment')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('tracking_uuid')
                            ->label('Tracking ID')
                            ->disabled()
                            ->dehydrated(false)
                            ->visibleOn('edit'),
                        Forms\Components\Select::make('branch_id')
                            ->relationship('branch', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\Select::make('rider_id')
                            ->relationship('rider', 'id')
                            ->getOptionLabelFromRecordUsing(fn ($record) => $record->user->name ?? "Rider #{$record->id}")
                            ->searchable()
                            ->preload()
                            ->nullable(),
                        Forms\Components\Select::make('status')
                            ->options([
                                'pending' => 'Pending',
                                'broadcasting' => 'Broadcasting',
                                'accepted' => 'Accepted',
                                'en_route_pickup' => 'En Route to Pickup',
                                'at_pickup' => 'At Pickup',
                                'picked_up' => 'Picked Up',
                                'in_transit' => 'In Transit',
                                'at_dropoff' => 'At Dropoff',
                                'delivered' => 'Delivered',
                                'failed' => 'Failed',
                                'cancelled' => 'Cancelled',
                                'returned' => 'Returned',
                            ])
                            ->required(),
                        Forms\Components\Select::make('vehicle_type')
                            ->options([
                                'motorcycle' => 'Motorcycle',
                                'mpv' => 'MPV',
                                'van' => 'Van',
                                'truck' => 'Truck',
                            ])
                            ->required(),
                    ]),
                Forms\Components\Section::make('Pickup Details')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('pickup_contact_name')->required(),
                        Forms\Components\TextInput::make('pickup_contact_phone')->tel()->required(),
                        Forms\Components\Textarea::make('pickup_address')->required()->columnSpanFull(),
                        Forms\Components\TextInput::make('pickup_lat')->label('Latitude')->numeric(),
                        Forms\Components\TextInput::make('pickup_lng')->label('Longitude')->numeric(),
                        Forms\Components\Textarea::make('pickup_notes')->columnSpanFull(),
                    ]),
                Forms\Components\Section::make('Dropoff Details')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('dropoff_contact_name')->required(),
                        Forms\Components\TextInput::make('dropoff_contact_phone')->tel()->required(),
                        Forms\Components\Textarea::make('dropoff_address')->required()->columnSpanFull(),
                        Forms\Components\TextInput::make('dropoff_lat')->label('Latitude')->numeric(),
                        Forms\Components\TextInput::make('dropoff_lng')->label('Longitude')->numeric(),
                        Forms\Components\Textarea::make('dropoff_notes')->columnSpanFull(),
                    ]),
                Forms\Components\Section::make('Package Information')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('package_description'),
                        Forms\Components\Select::make('package_size')
                            ->options([
                                'small' => 'Small',
                                'medium' => 'Medium',
                                'large' => 'Large',
                                'extra_large' => 'Extra Large',
                            ])
                            ->required(),
                        Forms\Components\TextInput::make('package_weight_kg')
                            ->label('Weight (kg)')
                            ->numeric()
                            ->suffix('kg'),
                        Forms\Components\TextInput::make('distance_km')
                            ->label('Distance (km)')
                            ->numeric()
                            ->suffix('km'),
                    ]),
                Forms\Components\Section::make('Pricing')
                    ->columns(3)
                    ->schema([
                        Forms\Components\TextInput::make('base_fare')->numeric()->prefix('₱')->default(0),
                        Forms\Components\TextInput::make('distance_fare')->numeric()->prefix('₱')->default(0),
                        Forms\Components\TextInput::make('surge_multiplier')->numeric()->default(1)->step(0.1),
                        Forms\Components\TextInput::make('total_price')->numeric()->prefix('₱')->default(0),
                        Forms\Components\TextInput::make('rider_earnings')->numeric()->prefix('₱')->default(0),
                        Forms\Components\TextInput::make('platform_commission')->numeric()->prefix('₱')->default(0),
                    ]),
                Forms\Components\Section::make('Payment')
                    ->columns(2)
                    ->schema([
                        Forms\Components\Select::make('payment_method')
                            ->options([
                                'online' => 'Online (Maya)',
                                'cod' => 'Cash on Delivery',
                            ])
                            ->required(),
                        Forms\Components\Select::make('payment_status')
                            ->options([
                                'pending' => 'Pending',
                                'paid' => 'Paid',
                                'failed' => 'Failed',
                                'refunded' => 'Refunded',
                            ])
                            ->required(),
                        Forms\Components\Toggle::make('cod_collected'),
                        Forms\Components\Toggle::make('cod_settled'),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('tracking_uuid')
                    ->label('Tracking')
                    ->searchable()
                    ->copyable()
                    ->limit(12),
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
                    ->label('From')
                    ->searchable(),
                Tables\Columns\TextColumn::make('dropoff_contact_name')
                    ->label('To')
                    ->searchable(),
                Tables\Columns\TextColumn::make('vehicle_type')
                    ->badge(),
                Tables\Columns\TextColumn::make('total_price')
                    ->label('Total')
                    ->money('PHP')
                    ->sortable(),
                Tables\Columns\TextColumn::make('payment_method')
                    ->label('Payment')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'online' => 'success',
                        'cod' => 'warning',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('payment_status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'paid' => 'success',
                        'pending' => 'warning',
                        'failed' => 'danger',
                        'refunded' => 'info',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime('M d, Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'broadcasting' => 'Broadcasting',
                        'accepted' => 'Accepted',
                        'en_route_pickup' => 'En Route to Pickup',
                        'picked_up' => 'Picked Up',
                        'in_transit' => 'In Transit',
                        'delivered' => 'Delivered',
                        'failed' => 'Failed',
                        'cancelled' => 'Cancelled',
                    ])
                    ->multiple(),
                Tables\Filters\SelectFilter::make('payment_method')
                    ->options([
                        'online' => 'Online (Maya)',
                        'cod' => 'Cash on Delivery',
                    ]),
                Tables\Filters\SelectFilter::make('branch')
                    ->relationship('branch', 'name'),
                Tables\Filters\SelectFilter::make('vehicle_type')
                    ->options([
                        'motorcycle' => 'Motorcycle',
                        'mpv' => 'MPV',
                        'van' => 'Van',
                        'truck' => 'Truck',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
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
                Infolists\Components\Section::make('Job Overview')
                    ->columns(4)
                    ->schema([
                        Infolists\Components\TextEntry::make('tracking_uuid')
                            ->label('Tracking ID')
                            ->copyable()
                            ->weight('bold'),
                        Infolists\Components\TextEntry::make('status')
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
                        Infolists\Components\TextEntry::make('vehicle_type')->badge(),
                        Infolists\Components\TextEntry::make('branch.name')->label('Branch'),
                    ]),

                Infolists\Components\Grid::make(2)
                    ->schema([
                        Infolists\Components\Section::make('Pickup Details')
                            ->icon('heroicon-o-arrow-up-tray')
                            ->schema([
                                Infolists\Components\TextEntry::make('pickup_contact_name')->label('Contact'),
                                Infolists\Components\TextEntry::make('pickup_contact_phone')->label('Phone'),
                                Infolists\Components\TextEntry::make('pickup_address')->label('Address'),
                                Infolists\Components\TextEntry::make('pickup_notes')->label('Notes'),
                            ]),
                        Infolists\Components\Section::make('Dropoff Details')
                            ->icon('heroicon-o-arrow-down-tray')
                            ->schema([
                                Infolists\Components\TextEntry::make('dropoff_contact_name')->label('Contact'),
                                Infolists\Components\TextEntry::make('dropoff_contact_phone')->label('Phone'),
                                Infolists\Components\TextEntry::make('dropoff_address')->label('Address'),
                                Infolists\Components\TextEntry::make('dropoff_notes')->label('Notes'),
                            ]),
                    ]),

                Infolists\Components\Section::make('Package & Pricing')
                    ->columns(4)
                    ->schema([
                        Infolists\Components\TextEntry::make('package_description')->label('Description'),
                        Infolists\Components\TextEntry::make('package_size')->badge(),
                        Infolists\Components\TextEntry::make('package_weight_kg')->label('Weight')->suffix(' kg'),
                        Infolists\Components\TextEntry::make('distance_km')->label('Distance')->suffix(' km'),
                        Infolists\Components\TextEntry::make('base_fare')->money('PHP'),
                        Infolists\Components\TextEntry::make('distance_fare')->money('PHP'),
                        Infolists\Components\TextEntry::make('surge_multiplier')->label('Surge'),
                        Infolists\Components\TextEntry::make('total_price')->money('PHP')->weight('bold'),
                        Infolists\Components\TextEntry::make('rider_earnings')->money('PHP'),
                        Infolists\Components\TextEntry::make('platform_commission')->money('PHP'),
                    ]),

                Infolists\Components\Section::make('Payment')
                    ->columns(4)
                    ->schema([
                        Infolists\Components\TextEntry::make('payment_method')
                            ->badge()
                            ->color(fn (string $state): string => match ($state) {
                                'online' => 'success',
                                'cod' => 'warning',
                                default => 'gray',
                            }),
                        Infolists\Components\TextEntry::make('payment_status')
                            ->badge()
                            ->color(fn (string $state): string => match ($state) {
                                'paid' => 'success',
                                'pending' => 'warning',
                                'failed' => 'danger',
                                'refunded' => 'info',
                                default => 'gray',
                            }),
                        Infolists\Components\IconEntry::make('cod_collected')->boolean(),
                        Infolists\Components\IconEntry::make('cod_settled')->boolean(),
                    ]),

                Infolists\Components\Section::make('Rider Assignment')
                    ->columns(3)
                    ->schema([
                        Infolists\Components\TextEntry::make('rider.user.name')->label('Rider')->default('Unassigned'),
                        Infolists\Components\TextEntry::make('rider.user.phone')->label('Rider Phone'),
                        Infolists\Components\TextEntry::make('rider.vehicle_type')->label('Vehicle')->badge(),
                    ]),

                Infolists\Components\Section::make('Timeline')
                    ->columns(3)
                    ->schema([
                        Infolists\Components\TextEntry::make('created_at')->dateTime(),
                        Infolists\Components\TextEntry::make('accepted_at')->dateTime(),
                        Infolists\Components\TextEntry::make('picked_up_at')->dateTime(),
                        Infolists\Components\TextEntry::make('delivered_at')->dateTime(),
                        Infolists\Components\TextEntry::make('failed_at')->dateTime(),
                        Infolists\Components\TextEntry::make('cancelled_at')->dateTime(),
                    ]),

                Infolists\Components\Section::make('Proof of Delivery')
                    ->visible(fn ($record) => $record->proofOfDelivery !== null)
                    ->columns(3)
                    ->schema([
                        Infolists\Components\ImageEntry::make('proofOfDelivery.photo_url')
                            ->label('Photo')
                            ->height(200),
                        Infolists\Components\ImageEntry::make('proofOfDelivery.signature_url')
                            ->label('Signature')
                            ->height(200),
                        Infolists\Components\TextEntry::make('proofOfDelivery.recipient_name')
                            ->label('Recipient'),
                        Infolists\Components\TextEntry::make('proofOfDelivery.relationship')
                            ->label('Relationship'),
                        Infolists\Components\TextEntry::make('proofOfDelivery.notes')
                            ->label('Notes'),
                    ]),

                Infolists\Components\Section::make('Failure Details')
                    ->visible(fn ($record) => in_array($record->status, ['failed', 'cancelled']))
                    ->schema([
                        Infolists\Components\TextEntry::make('failure_reason'),
                        Infolists\Components\TextEntry::make('failure_notes'),
                    ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            RelationManagers\JobOffersRelationManager::class,
            RelationManagers\PaymentsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDeliveryJobs::route('/'),
            'create' => Pages\CreateDeliveryJob::route('/create'),
            'view' => Pages\ViewDeliveryJob::route('/{record}'),
            'edit' => Pages\EditDeliveryJob::route('/{record}/edit'),
        ];
    }
}
