<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PayoutRequestResource\Pages;
use App\Models\PayoutRequest;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class PayoutRequestResource extends Resource
{
    protected static ?string $model = PayoutRequest::class;

    protected static ?string $navigationIcon = 'heroicon-o-banknotes';

    protected static ?string $navigationGroup = 'Finance';

    protected static ?int $navigationSort = 2;

    protected static ?string $navigationLabel = 'Payout Requests';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Payout Details')
                    ->columns(2)
                    ->schema([
                        Forms\Components\Select::make('rider_id')
                            ->relationship('rider', 'id')
                            ->getOptionLabelFromRecordUsing(fn ($record) => $record->user->name ?? "Rider #{$record->id}")
                            ->searchable()
                            ->preload()
                            ->required(),
                        Forms\Components\TextInput::make('amount')
                            ->numeric()
                            ->prefix('₱')
                            ->required(),
                        Forms\Components\Select::make('status')
                            ->options([
                                'pending' => 'Pending',
                                'approved' => 'Approved',
                                'processing' => 'Processing',
                                'completed' => 'Completed',
                                'rejected' => 'Rejected',
                            ])
                            ->required(),
                        Forms\Components\Textarea::make('notes')
                            ->columnSpanFull(),
                        Forms\Components\Textarea::make('rejection_reason')
                            ->columnSpanFull()
                            ->visible(fn ($get) => $get('status') === 'rejected'),
                    ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('rider.user.name')
                    ->label('Rider')
                    ->searchable(),
                Tables\Columns\TextColumn::make('amount')
                    ->money('PHP')
                    ->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'pending' => 'warning',
                        'approved' => 'info',
                        'processing' => 'primary',
                        'completed' => 'success',
                        'rejected' => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('approvedBy.name')
                    ->label('Approved By')
                    ->toggleable(),
                Tables\Columns\TextColumn::make('approved_at')
                    ->dateTime()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime('M d, Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'approved' => 'Approved',
                        'processing' => 'Processing',
                        'completed' => 'Completed',
                        'rejected' => 'Rejected',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\Action::make('approve')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn ($record) => $record->status === 'pending')
                    ->action(fn ($record) => $record->update([
                        'status' => 'approved',
                        'approved_by' => auth()->id(),
                        'approved_at' => now(),
                    ])),
                Tables\Actions\Action::make('reject')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->form([
                        Forms\Components\Textarea::make('rejection_reason')->required(),
                    ])
                    ->visible(fn ($record) => $record->status === 'pending')
                    ->action(fn ($record, array $data) => $record->update([
                        'status' => 'rejected',
                        'rejection_reason' => $data['rejection_reason'],
                    ])),
            ]);
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('Payout Request Details')
                    ->columns(3)
                    ->schema([
                        Infolists\Components\TextEntry::make('rider.user.name')->label('Rider'),
                        Infolists\Components\TextEntry::make('amount')->money('PHP'),
                        Infolists\Components\TextEntry::make('status')->badge(),
                        Infolists\Components\TextEntry::make('approvedBy.name')->label('Approved By'),
                        Infolists\Components\TextEntry::make('approved_at')->dateTime(),
                        Infolists\Components\TextEntry::make('maya_disbursement_id'),
                        Infolists\Components\TextEntry::make('notes')->columnSpanFull(),
                        Infolists\Components\TextEntry::make('rejection_reason')->columnSpanFull(),
                    ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPayoutRequests::route('/'),
            'view' => Pages\ViewPayoutRequest::route('/{record}'),
        ];
    }
}

