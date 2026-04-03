<?php

namespace App\Filament\Branch\Resources;

use App\Filament\Branch\Resources\SalesTransactionResource\Pages;
use App\Models\SalesTransaction;
use App\Models\Service;
use App\Models\ServiceCategory;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;



class SalesTransactionResource extends Resource
{
    protected static ?string $model = SalesTransaction::class;

    // ── ALiN Cargo Rate Card (PHP) ─────────────────────────────────────────────
    // Structure: [size_key][box_type][service_type] = price
    private const RATE_CARD = [
        'box_xlarge'   => ['alin_box' => ['intra' => 3575, 'cross' => 3860], 'own_box' => ['intra' => 3145, 'cross' => 3400]],
        'box_large'    => ['alin_box' => ['intra' => 2750, 'cross' => 2970], 'own_box' => ['intra' => 2420, 'cross' => 2615]],
        'box_medium'   => ['alin_box' => ['intra' => 1690, 'cross' => 1850], 'own_box' => ['intra' => 1488, 'cross' => 1630]],
        'box_small'    => ['alin_box' => ['intra' =>  900, 'cross' =>  980], 'own_box' => ['intra' =>  790, 'cross' =>  865]],
        'box_5kg'      => ['alin_box' => ['intra' =>  285, 'cross' =>  320], 'own_box' => ['intra' =>  158, 'cross' =>  280]],
        'box_3kg'      => ['alin_box' => ['intra' =>  180, 'cross' =>  205], 'own_box' => ['intra' =>  150, 'cross' =>  180]],
        'box_1kg'      => ['alin_box' => ['intra' =>  120, 'cross' =>  140], 'own_box' => ['intra' =>  107, 'cross' =>  123]],
        'pouch_large'  => ['alin_box' => ['intra' =>  160, 'cross' =>  190], 'own_box' => ['intra' =>  160, 'cross' =>  190]],
        'pouch_medium' => ['alin_box' => ['intra' =>  145, 'cross' =>  175], 'own_box' => ['intra' =>  145, 'cross' =>  175]],
        'pouch_small'  => ['alin_box' => ['intra' =>  115, 'cross' =>  135], 'own_box' => ['intra' =>  115, 'cross' =>  135]],
        'pouch_xsmall' => ['alin_box' => ['intra' =>   75, 'cross' =>   90], 'own_box' => ['intra' =>   75, 'cross' =>   90]],
    ];

    /** Flat rate lookup; returns 0 when no matching entry. */
    private static function lookupRate(string $size, string $boxType, string $serviceType): float
    {
        return (float) (self::RATE_CARD[$size][$boxType][$serviceType] ?? 0);
    }

    /** True when the selected service belongs to the ALiN Cargo category. */
    private static function isAlinCargoService(?int $serviceId): bool
    {
        if (!$serviceId) {
            return false;
        }
        $service = Service::with('category')->find($serviceId);
        return $service?->category?->slug === 'alin-cargo';
    }

    /** Recalculate and set the amount field from current form state. */
    private static function recalculateAmount(Forms\Set $set, Forms\Get $get): void
    {
        $size        = $get('package_size');
        $boxType     = $get('box_type')     ?? 'own_box';
        $serviceType = $get('service_type') ?? 'intra';

        if (!$size) {
            return;
        }

        $price = self::lookupRate($size, $boxType, $serviceType);
        if ($price > 0) {
            $set('amount', $price);
        }
    }

    protected static ?string $navigationIcon = 'heroicon-o-shopping-cart';

    protected static ?string $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 1;

    protected static ?string $navigationLabel = 'Sales';

    protected static ?string $modelLabel = 'Sale';

    protected static ?string $pluralModelLabel = 'Sales';

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
        return $form->schema([
            Forms\Components\Grid::make(2)
                ->schema([
                    Forms\Components\Section::make('Select Service')
                        ->columnSpan(1)
                        ->schema([
                            Forms\Components\ViewField::make('service_id')
                                ->view('filament.branch.components.service-card-selector')
                                ->required(),
                        ]),
                    Forms\Components\Section::make('Transaction Details')
                        ->columnSpan(1)
                        ->schema([

                            // ── ALiN Cargo fields (visible only when an ALiN Cargo service is selected) ──

                            Forms\Components\Select::make('package_size')
                                ->label('Package Size')
                                ->options([
                                    'Boxes' => [
                                        'box_1kg'    => '📦 Box 1 kg',
                                        'box_3kg'    => '📦 Box 3 kg',
                                        'box_5kg'    => '📦 Box 5 kg',
                                        'box_small'  => '📦 Box Small (10 kg)',
                                        'box_medium' => '📦 Box Medium (20 kg)',
                                        'box_large'  => '📦 Box Large (30 kg)',
                                        'box_xlarge' => '📦 Box XLarge (40 kg)',
                                    ],
                                    'Pouches' => [
                                        'pouch_xsmall' => '🛍️ Pouch XSmall (1 kg)',
                                        'pouch_small'  => '🛍️ Pouch Small (2 kg)',
                                        'pouch_medium' => '🛍️ Pouch Medium (3 kg)',
                                        'pouch_large'  => '🛍️ Pouch Large (5 kg)',
                                    ],
                                ])
                                ->live()
                                ->afterStateUpdated(fn (Forms\Set $set, Forms\Get $get) => self::recalculateAmount($set, $get))
                                ->visible(fn (Forms\Get $get) => self::isAlinCargoService((int) $get('service_id')))
                                ->helperText('Select the size to auto-fill the rate-card price.'),

                            Forms\Components\Select::make('service_type')
                                ->label('Service Type')
                                ->options([
                                    'intra' => '🏙️ Intra-region',
                                    'cross' => '🚢 Cross-region',
                                ])
                                ->default('intra')
                                ->live()
                                ->afterStateUpdated(fn (Forms\Set $set, Forms\Get $get) => self::recalculateAmount($set, $get))
                                ->visible(fn (Forms\Get $get) => self::isAlinCargoService((int) $get('service_id'))),

                            Forms\Components\Select::make('box_type')
                                ->label('Box Type')
                                ->options([
                                    'own_box'  => '🗃️ Own Box (customer-provided)',
                                    'alin_box' => '📦 ALiN Box (ALiN-provided)',
                                ])
                                ->default('own_box')
                                ->live()
                                ->afterStateUpdated(fn (Forms\Set $set, Forms\Get $get) => self::recalculateAmount($set, $get))
                                ->visible(fn (Forms\Get $get) => self::isAlinCargoService((int) $get('service_id')))
                                ->helperText(fn (Forms\Get $get) => $get('box_type') === 'alin_box'
                                    ? 'ALiN provides the packaging. ALiN Box rates apply.'
                                    : 'Customer provides their own packaging. Own Box rates apply.'),

                            // ── Common fields ──

                            Forms\Components\TextInput::make('amount')
                                ->numeric()
                                ->prefix('₱')
                                ->required()
                                ->minValue(0.01)
                                ->helperText(fn (Forms\Get $get) => self::isAlinCargoService((int) $get('service_id'))
                                    ? 'Auto-filled from rate card. You may adjust if needed.'
                                    : null),
                            Forms\Components\Select::make('payment_method')
                                ->options([
                                    'cash' => 'Cash',
                                    'gcash' => 'GCash',
                                    'maya' => 'Maya',
                                    'bank_transfer' => 'Bank Transfer',
                                ])
                                ->required(),
                            Forms\Components\TextInput::make('reference_number')
                                ->maxLength(100)
                                ->visible(fn (Forms\Get $get) => in_array($get('payment_method'), ['gcash', 'maya', 'bank_transfer'])),
                            Forms\Components\TextInput::make('customer_name')
                                ->maxLength(255),
                            Forms\Components\Textarea::make('notes')
                                ->rows(2),
                        ]),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Time')
                    ->dateTime('M d, Y h:i A')
                    ->sortable(),
                Tables\Columns\TextColumn::make('service.category.name')
                    ->label('Category')
                    ->badge()
                    ->sortable(),
                Tables\Columns\TextColumn::make('service.name')
                    ->label('Service')
                    ->searchable(),
                Tables\Columns\TextColumn::make('amount')
                    ->money('PHP')
                    ->sortable(),
                Tables\Columns\TextColumn::make('payment_method')
                    ->badge()
                    ->formatStateUsing(fn (string $state) => match($state) {
                        'cash' => 'Cash',
                        'gcash' => 'GCash',
                        'maya' => 'Maya',
                        'bank_transfer' => 'Bank Transfer',
                        default => $state,
                    })
                    ->color(fn (string $state) => match($state) {
                        'cash' => 'success',
                        'gcash' => 'info',
                        'maya' => 'warning',
                        'bank_transfer' => 'primary',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('package_size')
                    ->label('Size')
                    ->formatStateUsing(fn (?string $state) => match ($state) {
                        'box_xlarge'   => 'Box XLarge',
                        'box_large'    => 'Box Large',
                        'box_medium'   => 'Box Medium',
                        'box_small'    => 'Box Small',
                        'box_5kg'      => 'Box 5 kg',
                        'box_3kg'      => 'Box 3 kg',
                        'box_1kg'      => 'Box 1 kg',
                        'pouch_large'  => 'Pouch L',
                        'pouch_medium' => 'Pouch M',
                        'pouch_small'  => 'Pouch S',
                        'pouch_xsmall' => 'Pouch XS',
                        default        => $state ?? '—',
                    })
                    ->toggleable()
                    ->toggledHiddenByDefault(),
                Tables\Columns\TextColumn::make('service_type')
                    ->label('Route')
                    ->badge()
                    ->formatStateUsing(fn (?string $state) => match ($state) {
                        'intra' => 'Intra',
                        'cross' => 'Cross',
                        default => '—',
                    })
                    ->color(fn (?string $state) => $state === 'cross' ? 'info' : 'gray')
                    ->toggleable()
                    ->toggledHiddenByDefault(),
                Tables\Columns\TextColumn::make('box_type')
                    ->label('Box Type')
                    ->badge()
                    ->formatStateUsing(fn (?string $state) => match ($state) {
                        'own_box'  => '🗃️ Own Box',
                        'alin_box' => '📦 ALiN Box',
                        default    => '—',
                    })
                    ->color(fn (?string $state) => $state === 'alin_box' ? 'warning' : 'gray')
                    ->toggleable()
                    ->toggledHiddenByDefault(),
                Tables\Columns\TextColumn::make('customer_name')
                    ->searchable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('creator.name')
                    ->label('Recorded By')
                    ->toggleable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('payment_method')
                    ->options([
                        'cash' => 'Cash',
                        'gcash' => 'GCash',
                        'maya' => 'Maya',
                        'bank_transfer' => 'Bank Transfer',
                    ]),
                Tables\Filters\SelectFilter::make('service')
                    ->relationship('service', 'name'),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make()
                    ->hidden(fn (SalesTransaction $record) => $record->isLocked()),
                Tables\Actions\DeleteAction::make()
                    ->hidden(fn (SalesTransaction $record) => $record->isLocked()),
            ])
            ->bulkActions([]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSalesTransactions::route('/'),
            'create' => Pages\CreateSalesTransaction::route('/create'),
            'view' => Pages\ViewSalesTransaction::route('/{record}'),
            'edit' => Pages\EditSalesTransaction::route('/{record}/edit'),
        ];
    }

    public static function mutateFormDataBeforeCreate(array $data): array
    {
        $data['branch_id'] = Auth::user()->branch_id;
        $data['created_by'] = Auth::id();
        return $data;
    }
}

