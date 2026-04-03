<?php

namespace App\Filament\Resources;

use App\Filament\Resources\KnowledgeArticleResource\Pages;
use App\Models\KnowledgeArticle;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class KnowledgeArticleResource extends Resource
{
    protected static ?string $model = KnowledgeArticle::class;
    protected static ?string $navigationIcon  = 'heroicon-o-book-open';
    protected static ?string $navigationGroup = 'Support';
    protected static ?string $navigationLabel = 'Knowledge Base';
    protected static ?int    $navigationSort  = 11;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('title')
                    ->required()
                    ->maxLength(255)
                    ->columnSpanFull(),

                Forms\Components\Select::make('category')
                    ->required()
                    ->options([
                        'tracking'   => 'Tracking',
                        'pricing'    => 'Pricing',
                        'policy'     => 'Policy',
                        'complaint'  => 'Complaint Handling',
                        'damage'     => 'Damage & Claims',
                        'payment'    => 'Payment',
                        'account'    => 'Account Help',
                        'other'      => 'Other',
                    ]),

                Forms\Components\Toggle::make('is_active')
                    ->label('Active (visible to AI)')
                    ->default(true),

                Forms\Components\TagsInput::make('tags')
                    ->nullable(),

                Forms\Components\Textarea::make('content')
                    ->required()
                    ->rows(12)
                    ->columnSpanFull()
                    ->helperText('This content is injected into the AI system prompt. Be precise and factual.'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('title')
                    ->searchable()
                    ->weight('semibold'),

                Tables\Columns\TextColumn::make('category')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'damage', 'complaint' => 'danger',
                        'payment'             => 'warning',
                        'tracking'            => 'info',
                        default               => 'gray',
                    }),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean(),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Last Updated')
                    ->since()
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('category')
                    ->options([
                        'tracking'  => 'Tracking',
                        'pricing'   => 'Pricing',
                        'policy'    => 'Policy',
                        'complaint' => 'Complaint Handling',
                        'damage'    => 'Damage & Claims',
                        'payment'   => 'Payment',
                        'account'   => 'Account Help',
                    ]),
                Tables\Filters\TernaryFilter::make('is_active')->label('Active'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListKnowledgeArticles::route('/'),
            'create' => Pages\CreateKnowledgeArticle::route('/create'),
            'edit'   => Pages\EditKnowledgeArticle::route('/{record}/edit'),
        ];
    }
}
