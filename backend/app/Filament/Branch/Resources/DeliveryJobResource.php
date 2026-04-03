<?php

namespace App\Filament\Branch\Resources;

use App\Filament\Branch\Resources\DeliveryJobResource\Pages;
use App\Filament\Branch\Resources\DeliveryJobResource\RelationManagers;
use App\Models\DeliveryJob;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Illuminate\Support\Facades\Auth;

class DeliveryJobResource extends Resource
{
    protected static ?string $model = DeliveryJob::class;

    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-list';

    protected static ?string $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 1;

    protected static function canAccessResource(): bool
    {
        return Auth::user()?->canHandleBranchOperations() ?? false;
    }

    public static function shouldRegisterNavigation(): bool
    {
        return static::canAccessResource();
    }

    public static function canViewAny(): bool
    {
        return static::canAccessResource();
    }

    public static function canCreate(): bool
    {
        return static::canAccessResource();
    }

    public static function canView(Model $record): bool
    {
        return static::canAccessResource();
    }

    public static function canEdit(Model $record): bool
    {
        return static::canAccessResource();
    }

    public static function canDelete(Model $record): bool
    {
        return static::canAccessResource();
    }

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery();
        $branchId = Auth::user()?->branch_id;

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query;
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Job Details')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('tracking_uuid')
                            ->label('Tracking ID')
                            ->disabled()
                            ->dehydrated(false)
                            ->visibleOn('edit'),
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
                        Forms\Components\Select::make('rider_id')
                            ->relationship('rider', 'id')
                            ->getOptionLabelFromRecordUsing(fn ($record) => $record->user->name ?? "Rider #{$record->id}")
                            ->searchable()
                            ->preload()
                            ->nullable(),
                    ]),
                Forms\Components\Section::make('Pickup Details')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('pickup_contact_name')->required(),
                        Forms\Components\TextInput::make('pickup_contact_phone')->tel()->required(),
                        Forms\Components\Textarea::make('pickup_address')->required()->columnSpanFull(),
                        Forms\Components\Textarea::make('pickup_notes')->columnSpanFull(),
                    ]),
                Forms\Components\Section::make('Dropoff Details')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('dropoff_contact_name')->required(),
                        Forms\Components\TextInput::make('dropoff_contact_phone')->tel()->required(),
                        Forms\Components\Textarea::make('dropoff_address')->required()->columnSpanFull(),
                        Forms\Components\Textarea::make('dropoff_notes')->columnSpanFull(),
                    ]),
                Forms\Components\Section::make('Package & Payment')
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
                        Forms\Components\Select::make('box_type')
                            ->label('Box Type')
                            ->options([
                                'own_box'  => '🗃️ Own Box (customer-provided)',
                                'alin_box' => '📦 ALiN Box (+₱50 fee)',
                            ])
                            ->default('own_box')
                            ->required()
                            ->helperText(fn (Forms\Get $get) => $get('box_type') === 'alin_box'
                                ? 'ALiN provides the packaging box. ₱50 box fee is included in the total.'
                                : 'Customer provides their own packaging.'),
                        Forms\Components\TextInput::make('package_weight_kg')
                            ->label('Weight (kg)')
                            ->numeric()
                            ->suffix('kg'),
                        Forms\Components\TextInput::make('total_price')
                            ->numeric()
                            ->prefix('₱')
                            ->disabled(),
                        Forms\Components\Select::make('payment_method')
                            ->options([
                                'online' => 'Online (Maya)',
                                'cod' => 'Cash on Delivery',
                            ])
                            ->required(),
                        Forms\Components\Toggle::make('cod_collected')
                            ->label('COD Collected'),
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
                Tables\Columns\TextColumn::make('box_type')
                    ->label('Box')
                    ->badge()
                    ->formatStateUsing(fn (string $state) => match ($state) {
                        'own_box'  => 'Own Box',
                        'alin_box' => 'ALiN Box',
                        default    => $state,
                    })
                    ->color(fn (string $state) => $state === 'alin_box' ? 'warning' : 'gray')
                    ->toggleable(),
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
                Tables\Columns\IconColumn::make('cod_collected')
                    ->label('COD')
                    ->boolean()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime('M d, H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'broadcasting' => 'Broadcasting',
                        'accepted' => 'Accepted',
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
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('broadcast')
                    ->icon('heroicon-o-signal')
                    ->color('info')
                    ->requiresConfirmation()
                    ->modalHeading('Broadcast to Riders')
                    ->modalDescription('This will send this job offer to all available riders in the branch.')
                    ->visible(fn ($record) => $record->status === 'pending')
                    ->action(fn ($record) => $record->update(['status' => 'broadcasting'])),
                Tables\Actions\Action::make('cancel')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn ($record) => in_array($record->status, ['pending', 'broadcasting']))
                    ->action(fn ($record) => $record->update([
                        'status' => 'cancelled',
                        'cancelled_at' => now(),
                    ])),
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
                    ->columns(3)
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
                    ]),

                Infolists\Components\Grid::make(2)
                    ->schema([
                        Infolists\Components\Section::make('Pickup')
                            ->icon('heroicon-o-arrow-up-tray')
                            ->schema([
                                Infolists\Components\TextEntry::make('pickup_contact_name')->label('Contact'),
                                Infolists\Components\TextEntry::make('pickup_contact_phone')->label('Phone'),
                                Infolists\Components\TextEntry::make('pickup_address')->label('Address'),
                                Infolists\Components\TextEntry::make('pickup_notes')->label('Notes'),
                            ]),
                        Infolists\Components\Section::make('Dropoff')
                            ->icon('heroicon-o-arrow-down-tray')
                            ->schema([
                                Infolists\Components\TextEntry::make('dropoff_contact_name')->label('Contact'),
                                Infolists\Components\TextEntry::make('dropoff_contact_phone')->label('Phone'),
                                Infolists\Components\TextEntry::make('dropoff_address')->label('Address'),
                                Infolists\Components\TextEntry::make('dropoff_notes')->label('Notes'),
                            ]),
                    ]),

                Infolists\Components\Section::make('Package & Payment')
                    ->columns(4)
                    ->schema([
                        Infolists\Components\TextEntry::make('package_description'),
                        Infolists\Components\TextEntry::make('package_size')->badge(),
                        Infolists\Components\TextEntry::make('box_type')
                            ->label('Box Type')
                            ->badge()
                            ->formatStateUsing(fn (string $state) => match ($state) {
                                'own_box'  => '🗃️ Own Box',
                                'alin_box' => '📦 ALiN Box',
                                default    => $state,
                            })
                            ->color(fn (string $state) => $state === 'alin_box' ? 'warning' : 'gray'),
                        Infolists\Components\TextEntry::make('package_weight_kg')->suffix(' kg'),
                        Infolists\Components\TextEntry::make('total_price')->money('PHP')->weight('bold'),
                        Infolists\Components\TextEntry::make('payment_method')
                            ->badge()
                            ->color(fn (string $state): string => match ($state) {
                                'online' => 'success',
                                'cod' => 'warning',
                                default => 'gray',
                            }),
                        Infolists\Components\IconEntry::make('cod_collected')->boolean(),
                    ]),

                Infolists\Components\Section::make('Rider')
                    ->columns(3)
                    ->schema([
                        Infolists\Components\TextEntry::make('rider.user.name')->label('Name')->default('Unassigned'),
                        Infolists\Components\TextEntry::make('rider.user.phone')->label('Phone'),
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
                        Infolists\Components\TextEntry::make('proofOfDelivery.relationship'),
                        Infolists\Components\TextEntry::make('proofOfDelivery.notes'),
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
        return [];
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
