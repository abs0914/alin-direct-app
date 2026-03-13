<?php

namespace App\Filament\Branch\Resources\SalesTransactionResource\Pages;

use App\Filament\Branch\Resources\SalesTransactionResource;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Auth;

class CreateSalesTransaction extends CreateRecord
{
    protected static string $resource = SalesTransactionResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['branch_id'] = Auth::user()->branch_id;
        $data['created_by'] = Auth::id();
        return $data;
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}

