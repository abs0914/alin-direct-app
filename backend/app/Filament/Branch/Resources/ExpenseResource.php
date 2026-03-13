<?php

namespace App\Filament\Branch\Resources;

use App\Filament\Branch\Resources\ExpenseResource\Pages;
use App\Models\Expense;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Support\Enums\Alignment;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ExpenseResource extends Resource
{
    protected static ?string $model = Expense::class;

    protected static ?string $navigationIcon = 'heroicon-o-receipt-percent';

    protected static ?string $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 2;

    protected static ?string $navigationLabel = 'Expenses';

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

    public static function getCategoryOptions(): array
    {
        return [
            'utilities' => 'Utilities',
            'supplies' => 'Supplies',
            'salaries' => 'Salaries',
            'rent' => 'Rent',
            'maintenance' => 'Maintenance',
            'transportation' => 'Transportation',
            'communication' => 'Communication',
            'marketing' => 'Marketing',
            'other' => 'Other',
        ];
    }

    public static function getCategoryMeta(): array
    {
        return [
            'utilities' => ['label' => 'Utilities', 'icon' => 'heroicon-o-bolt', 'color' => '#f59e0b'],
            'supplies' => ['label' => 'Supplies', 'icon' => 'heroicon-o-archive-box', 'color' => '#3b82f6'],
            'salaries' => ['label' => 'Salaries', 'icon' => 'heroicon-o-users', 'color' => '#10b981'],
            'rent' => ['label' => 'Rent', 'icon' => 'heroicon-o-home', 'color' => '#8b5cf6'],
            'maintenance' => ['label' => 'Maintenance', 'icon' => 'heroicon-o-wrench-screwdriver', 'color' => '#ef4444'],
            'transportation' => ['label' => 'Transportation', 'icon' => 'heroicon-o-truck', 'color' => '#06b6d4'],
            'communication' => ['label' => 'Communication', 'icon' => 'heroicon-o-device-phone-mobile', 'color' => '#ec4899'],
            'marketing' => ['label' => 'Marketing', 'icon' => 'heroicon-o-megaphone', 'color' => '#f97316'],
            'other' => ['label' => 'Other', 'icon' => 'heroicon-o-ellipsis-horizontal-circle', 'color' => '#6b7280'],
        ];
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
                    Forms\Components\Section::make('Select Expense Category')
                        ->columnSpan(1)
                        ->schema([
                            Forms\Components\ViewField::make('category')
                                ->view('filament.branch.components.expense-category-card-selector')
                                ->required(),
                        ]),
                    Forms\Components\Section::make('Expense Details')
                        ->columnSpan(1)
                        ->columns(2)
                        ->schema([
                            Forms\Components\TextInput::make('vendor_name')
                                ->label('Vendor / Supplier')
                                ->maxLength(255),
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
                                    'check' => 'Check',
                                ])
                                ->required(),
                            Forms\Components\TextInput::make('reference_number')
                                ->maxLength(100)
                                ->visible(fn (Forms\Get $get) => in_array($get('payment_method'), ['gcash', 'maya', 'bank_transfer', 'check'])),
                            Forms\Components\Textarea::make('description')
                                ->rows(2)
                                ->columnSpanFull(),
                            Forms\Components\FileUpload::make('receipt_path')
                                ->label('Receipt')
                                ->image()
                                ->directory('receipts')
                                ->maxSize(5120)
                                ->columnSpanFull(),
                            Forms\Components\Actions::make([
                                Forms\Components\Actions\Action::make('cancelCreateExpense')
                                    ->label('Cancel')
                                    ->color('gray')
                                    ->url(static::getUrl('index')),
                                Forms\Components\Actions\Action::make('submitCreateExpense')
                                    ->label('Create')
                                    ->submit('form')
                                    ->formId('form'),
                            ])
                                ->columnSpanFull()
                                ->alignment(Alignment::End)
                                ->visibleOn('create'),
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
                Tables\Columns\TextColumn::make('category')
                    ->badge()
                    ->formatStateUsing(fn (string $state) => ucfirst($state))
                    ->sortable(),
                Tables\Columns\TextColumn::make('vendor_name')
                    ->label('Vendor')
                    ->searchable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('amount')
                    ->money('PHP')
                    ->sortable(),
                Tables\Columns\TextColumn::make('payment_method')
                    ->badge()
                    ->formatStateUsing(fn (string $state) => match($state) {
                        'cash' => 'Cash', 'gcash' => 'GCash', 'maya' => 'Maya',
                        'bank_transfer' => 'Bank Transfer', 'check' => 'Check',
                        default => $state,
                    }),
                Tables\Columns\TextColumn::make('creator.name')
                    ->label('Recorded By')
                    ->toggleable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('category')
                    ->options(static::getCategoryOptions()),
                Tables\Filters\SelectFilter::make('payment_method')
                    ->options([
                        'cash' => 'Cash', 'gcash' => 'GCash', 'maya' => 'Maya',
                        'bank_transfer' => 'Bank Transfer', 'check' => 'Check',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make()
                    ->hidden(fn (Expense $record) => $record->isLocked()),
                Tables\Actions\DeleteAction::make()
                    ->hidden(fn (Expense $record) => $record->isLocked()),
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
            'index' => Pages\ListExpenses::route('/'),
            'create' => Pages\CreateExpense::route('/create'),
            'view' => Pages\ViewExpense::route('/{record}'),
            'edit' => Pages\EditExpense::route('/{record}/edit'),
        ];
    }
}