<?php

namespace App\Filament\Branch\Resources;

use App\Filament\Branch\Resources\SupportConversationResource\Pages;
use App\Models\SupportConversation;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class SupportConversationResource extends Resource
{
    protected static ?string $model = SupportConversation::class;
    protected static ?string $navigationIcon  = 'heroicon-o-chat-bubble-left-right';
    protected static ?string $navigationGroup = 'Support';
    protected static ?string $navigationLabel = 'Support Queue';
    protected static ?string $modelLabel      = 'Conversation';
    protected static ?int    $navigationSort  = 10;

    public static function canAccess(): bool
    {
        return Auth::user()?->canHandleBranchOperations() ?? false;
    }

    public static function shouldRegisterNavigation(): bool
    {
        return static::canAccess();
    }

    public static function canCreate(): bool { return false; }
    public static function canDelete(Model $record): bool { return false; }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->where('branch_id', Auth::user()?->branch_id)
            ->whereIn('status', ['pending_agent', 'agent_active', 'bot_handling', 'open'])
            ->with(['user:id,name,phone', 'latestMessage', 'case']);
    }

    public static function getNavigationBadge(): ?string
    {
        return (string) static::getEloquentQuery()
            ->whereIn('status', ['pending_agent'])
            ->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'danger';
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('last_message_at', 'desc')
            ->poll('15s')
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Customer')
                    ->searchable()
                    ->weight('semibold'),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'pending_agent' => 'danger',
                        'agent_active'  => 'warning',
                        'bot_handling'  => 'info',
                        default         => 'gray',
                    }),

                Tables\Columns\TextColumn::make('intent')
                    ->badge()
                    ->color(fn (?string $state) => match ($state) {
                        'complaint', 'damage' => 'danger',
                        'payment'             => 'warning',
                        'tracking'            => 'info',
                        default               => 'gray',
                    }),

                Tables\Columns\IconColumn::make('escalation_flag')
                    ->label('Escalated')
                    ->boolean()
                    ->trueIcon('heroicon-s-exclamation-triangle')
                    ->trueColor('danger'),

                Tables\Columns\TextColumn::make('case.priority')
                    ->label('Priority')
                    ->badge()
                    ->color(fn (?string $state) => match ($state) {
                        'critical' => 'danger',
                        'high'     => 'warning',
                        'normal'   => 'success',
                        default    => 'gray',
                    }),

                Tables\Columns\TextColumn::make('last_message_at')
                    ->label('Last Message')
                    ->since()
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending_agent' => 'Needs Agent',
                        'agent_active'  => 'Agent Active',
                        'bot_handling'  => 'Bot Handling',
                    ]),
            ])
            ->actions([
                Tables\Actions\Action::make('claim')
                    ->label('Claim')
                    ->icon('heroicon-o-hand-raised')
                    ->color('warning')
                    ->visible(fn (SupportConversation $r) => $r->status === 'pending_agent')
                    ->action(function (SupportConversation $record) {
                        $record->update([
                            'status'         => 'agent_active',
                            'owner_type'     => 'branch',
                            'owner_agent_id' => Auth::id(),
                        ]);
                        if ($record->case) {
                            $record->case->update([
                                'status'            => 'in_progress',
                                'assigned_agent_id' => Auth::id(),
                            ]);
                        }
                        Notification::make()->title('Conversation claimed')->success()->send();
                    }),

                Tables\Actions\ViewAction::make(),
            ]);
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('Customer')
                    ->columns(3)
                    ->schema([
                        Infolists\Components\TextEntry::make('user.name')->label('Name'),
                        Infolists\Components\TextEntry::make('user.phone')->label('Phone'),
                        Infolists\Components\TextEntry::make('channel')->badge(),
                    ]),

                Infolists\Components\Section::make('Conversation')
                    ->schema([
                        Infolists\Components\TextEntry::make('status')->badge(),
                        Infolists\Components\TextEntry::make('intent')->badge(),
                        Infolists\Components\TextEntry::make('case.ai_summary')
                            ->label('AI Summary')
                            ->columnSpanFull()
                            ->placeholder('No summary yet.'),
                    ])
                    ->columns(2),

                Infolists\Components\Section::make('Messages')
                    ->schema([
                        Infolists\Components\RepeatableEntry::make('messages')
                            ->label('')
                            ->schema([
                                Infolists\Components\TextEntry::make('sender_type')
                                    ->badge()
                                    ->color(fn (string $state) => match ($state) {
                                        'bot'    => 'info',
                                        'agent'  => 'success',
                                        default  => 'gray',
                                    }),
                                Infolists\Components\TextEntry::make('body')
                                    ->columnSpan(3),
                                Infolists\Components\TextEntry::make('created_at')
                                    ->since(),
                            ])
                            ->columns(5),
                    ]),

                Infolists\Components\Section::make('Reply')
                    ->schema([
                        Infolists\Components\Actions::make([
                            Infolists\Components\Actions\Action::make('reply')
                                ->label('Send Reply')
                                ->icon('heroicon-o-paper-airplane')
                                ->form([
                                    Forms\Components\Textarea::make('body')
                                        ->label('Message')
                                        ->required()
                                        ->rows(3),
                                    Forms\Components\Select::make('message_type')
                                        ->options([
                                            'text'          => 'Reply to Customer',
                                            'internal_note' => 'Internal Note (not shown to customer)',
                                        ])
                                        ->default('text'),
                                ])
                                ->action(function (SupportConversation $record, array $data) {
                                    \App\Models\SupportMessage::create([
                                        'conversation_id' => $record->id,
                                        'sender_type'     => 'agent',
                                        'sender_id'       => Auth::id(),
                                        'body'            => $data['body'],
                                        'message_type'    => $data['message_type'],
                                    ]);
                                    $record->update(['last_message_at' => now()]);
                                    Notification::make()->title('Reply sent')->success()->send();
                                }),

                            Infolists\Components\Actions\Action::make('resolve')
                                ->label('Resolve')
                                ->icon('heroicon-o-check-circle')
                                ->color('success')
                                ->requiresConfirmation()
                                ->action(function (SupportConversation $record) {
                                    $record->update(['status' => 'resolved', 'resolved_at' => now()]);
                                    if ($record->case) {
                                        $record->case->update([
                                            'status'          => 'resolved',
                                            'resolution_code' => 'resolved',
                                            'resolved_at'     => now(),
                                            'resolved_by'     => Auth::id(),
                                        ]);
                                    }
                                    Notification::make()->title('Conversation resolved')->success()->send();
                                }),
                        ]),
                    ]),
            ]);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSupportConversations::route('/'),
            'view'  => Pages\ViewSupportConversation::route('/{record}'),
        ];
    }
}
