<?php

namespace App\Filament\Branch\Resources;

use App\Filament\Branch\Resources\CustomerResource\Pages;
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

    protected static ?string $navigationGroup = 'Customers';

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
                            ->required(),
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
                Tables\Columns\TextColumn::make('company_name')
                    ->searchable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('total_bookings')
                    ->label('Bookings')
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
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
                        Infolists\Components\TextEntry::make('default_address')->label('Address')->columnSpanFull(),
                    ]),
            ]);
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

