<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CustomerResource\Pages;
use App\Models\Customer;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class CustomerResource extends Resource
{
    protected static ?string $model = Customer::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-group';

    protected static ?string $navigationGroup = 'Users & Access';

    protected static ?int $navigationSort = 2;

    protected static ?string $recordTitleAttribute = 'user.name';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Customer Information')
                    ->columns(2)
                    ->schema([
                        Forms\Components\Select::make('user_id')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required()
                            ->createOptionForm([
                                Forms\Components\TextInput::make('name')->required(),
                                Forms\Components\TextInput::make('phone')->tel()->required(),
                                Forms\Components\TextInput::make('email')->email(),
                                Forms\Components\Hidden::make('user_type')->default('customer'),
                                Forms\Components\Hidden::make('password')->default(bcrypt('password')),
                            ]),
                        Forms\Components\TextInput::make('company_name')
                            ->maxLength(255),
                    ]),
                Forms\Components\Section::make('Default Address')
                    ->columns(2)
                    ->schema([
                        Forms\Components\Textarea::make('default_address')
                            ->columnSpanFull(),
                        Forms\Components\TextInput::make('default_lat')
                            ->label('Latitude')
                            ->numeric(),
                        Forms\Components\TextInput::make('default_lng')
                            ->label('Longitude')
                            ->numeric(),
                    ]),
                Forms\Components\Section::make('Payment')
                    ->schema([
                        Forms\Components\TextInput::make('maya_customer_id')
                            ->label('Maya Customer ID'),
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
                Tables\Columns\TextColumn::make('user.email')
                    ->label('Email')
                    ->searchable(),
                Tables\Columns\TextColumn::make('company_name')
                    ->searchable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('total_bookings')
                    ->label('Bookings')
                    ->sortable(),
                Tables\Columns\TextColumn::make('default_address')
                    ->limit(30)
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\Filter::make('has_company')
                    ->query(fn ($query) => $query->whereNotNull('company_name'))
                    ->label('B2B Clients'),
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
                Infolists\Components\Section::make('Customer Details')
                    ->columns(3)
                    ->schema([
                        Infolists\Components\TextEntry::make('user.name')->label('Name'),
                        Infolists\Components\TextEntry::make('user.phone')->label('Phone'),
                        Infolists\Components\TextEntry::make('user.email')->label('Email'),
                        Infolists\Components\TextEntry::make('company_name')->label('Company'),
                        Infolists\Components\TextEntry::make('total_bookings')->label('Total Bookings'),
                        Infolists\Components\TextEntry::make('maya_customer_id')->label('Maya ID'),
                    ]),
                Infolists\Components\Section::make('Default Address')
                    ->columns(3)
                    ->schema([
                        Infolists\Components\TextEntry::make('default_address')->columnSpanFull(),
                        Infolists\Components\TextEntry::make('default_lat')->label('Latitude'),
                        Infolists\Components\TextEntry::make('default_lng')->label('Longitude'),
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
            'index' => Pages\ListCustomers::route('/'),
            'create' => Pages\CreateCustomer::route('/create'),
            'view' => Pages\ViewCustomer::route('/{record}'),
            'edit' => Pages\EditCustomer::route('/{record}/edit'),
        ];
    }
}

