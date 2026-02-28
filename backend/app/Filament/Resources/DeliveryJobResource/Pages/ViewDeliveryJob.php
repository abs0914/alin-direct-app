<?php

namespace App\Filament\Resources\DeliveryJobResource\Pages;

use App\Filament\Resources\DeliveryJobResource;
use Filament\Actions;
use Filament\Resources\Pages\ViewRecord;

class ViewDeliveryJob extends ViewRecord
{
    protected static string $resource = DeliveryJobResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\EditAction::make(),
        ];
    }
}

