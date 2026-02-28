<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BranchResource\Pages;
use App\Filament\Resources\BranchResource\RelationManagers;
use App\Models\Branch;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class BranchResource extends Resource
{
    protected static ?string $model = Branch::class;

    protected static ?string $navigationIcon = 'heroicon-o-building-office-2';

    protected static ?string $navigationGroup = 'Network';

    protected static ?string $recordTitleAttribute = 'name';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Branch Details')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('code')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(20),
                        Forms\Components\Select::make('type')
                            ->options([
                                'hub' => 'Hub',
                                'branch' => 'Branch',
                                'satellite' => 'Satellite',
                            ])
                            ->required(),
                        Forms\Components\Toggle::make('is_active')
                            ->default(true),
                    ]),
                Forms\Components\Section::make('Location')
                    ->columns(2)
                    ->schema([
                        Forms\Components\Textarea::make('address')
                            ->columnSpanFull(),
                        Forms\Components\TextInput::make('city'),
                        Forms\Components\TextInput::make('province'),
                        Forms\Components\TextInput::make('lat')
                            ->label('Latitude')
                            ->numeric()
                            ->step(0.0000001),
                        Forms\Components\TextInput::make('lng')
                            ->label('Longitude')
                            ->numeric()
                            ->step(0.0000001),
                        Forms\Components\TextInput::make('service_radius_km')
                            ->label('Service Radius (km)')
                            ->numeric()
                            ->default(10)
                            ->suffix('km'),
                    ]),
                Forms\Components\Section::make('Contact')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('phone')->tel(),
                        Forms\Components\TextInput::make('email')->email(),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('code')
                    ->badge()
                    ->searchable(),
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('type')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'hub' => 'primary',
                        'branch' => 'success',
                        'satellite' => 'warning',
                    }),
                Tables\Columns\TextColumn::make('city')
                    ->searchable(),
                Tables\Columns\TextColumn::make('service_radius_km')
                    ->label('Radius')
                    ->suffix(' km')
                    ->sortable(),
                Tables\Columns\TextColumn::make('users_count')
                    ->label('Staff')
                    ->counts('users'),
                Tables\Columns\TextColumn::make('riders_count')
                    ->label('Riders')
                    ->counts('riders'),
                Tables\Columns\IconColumn::make('is_active')
                    ->boolean(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->options([
                        'hub' => 'Hub',
                        'branch' => 'Branch',
                        'satellite' => 'Satellite',
                    ]),
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Active'),
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
                Infolists\Components\Section::make('Branch Details')
                    ->columns(4)
                    ->schema([
                        Infolists\Components\TextEntry::make('name')->weight('bold'),
                        Infolists\Components\TextEntry::make('code')->badge(),
                        Infolists\Components\TextEntry::make('type')
                            ->badge()
                            ->color(fn (string $state): string => match ($state) {
                                'hub' => 'primary',
                                'branch' => 'success',
                                'satellite' => 'warning',
                            }),
                        Infolists\Components\IconEntry::make('is_active')->boolean()->label('Active'),
                    ]),

                Infolists\Components\Section::make('Location')
                    ->columns(3)
                    ->schema([
                        Infolists\Components\TextEntry::make('address')->columnSpanFull(),
                        Infolists\Components\TextEntry::make('city'),
                        Infolists\Components\TextEntry::make('province'),
                        Infolists\Components\TextEntry::make('service_radius_km')
                            ->label('Service Radius')
                            ->suffix(' km'),
                        Infolists\Components\TextEntry::make('lat')->label('Latitude'),
                        Infolists\Components\TextEntry::make('lng')->label('Longitude'),
                    ]),

                Infolists\Components\Section::make('Contact')
                    ->columns(2)
                    ->schema([
                        Infolists\Components\TextEntry::make('phone'),
                        Infolists\Components\TextEntry::make('email'),
                    ]),

                Infolists\Components\Section::make('Statistics')
                    ->columns(3)
                    ->schema([
                        Infolists\Components\TextEntry::make('riders_count')
                            ->label('Total Riders')
                            ->state(fn ($record) => $record->riders()->count()),
                        Infolists\Components\TextEntry::make('active_riders')
                            ->label('Active Riders')
                            ->state(fn ($record) => $record->riders()->where('status', 'approved')->count()),
                        Infolists\Components\TextEntry::make('delivery_count')
                            ->label('Total Deliveries')
                            ->state(fn ($record) => $record->deliveryJobs()->count()),
                    ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            RelationManagers\RidersRelationManager::class,
            RelationManagers\DeliveryJobsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListBranches::route('/'),
            'create' => Pages\CreateBranch::route('/create'),
            'view' => Pages\ViewBranch::route('/{record}'),
            'edit' => Pages\EditBranch::route('/{record}/edit'),
        ];
    }
}
