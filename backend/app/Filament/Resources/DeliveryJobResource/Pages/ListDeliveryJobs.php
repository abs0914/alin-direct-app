<?php

namespace App\Filament\Resources\DeliveryJobResource\Pages;

use App\Filament\Resources\DeliveryJobResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListDeliveryJobs extends ListRecords
{
    protected static string $resource = DeliveryJobResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
