<?php

namespace App\Filament\Branch\Resources\SalesTransactionResource\Pages;

use App\Filament\Branch\Resources\SalesTransactionResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditSalesTransaction extends EditRecord
{
    protected static string $resource = SalesTransactionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}

