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
                            Forms\Components\TextInput::make('amount')
                                ->numeric()
                                ->prefix('₱')
                                ->required()
                                ->minValue(0.01),
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

