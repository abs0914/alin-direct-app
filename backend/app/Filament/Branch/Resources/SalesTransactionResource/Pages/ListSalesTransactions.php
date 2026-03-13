<?php

namespace App\Filament\Branch\Resources\SalesTransactionResource\Pages;

use App\Filament\Branch\Resources\SalesTransactionResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListSalesTransactions extends ListRecords
{
    protected static string $resource = SalesTransactionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make()
                ->label('Record Sale'),
        ];
    }
}

