<?php

namespace App\Filament\Branch\Resources\DeliveryJobResource\Pages;

use App\Filament\Branch\Resources\DeliveryJobResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditDeliveryJob extends EditRecord
{
    protected static string $resource = DeliveryJobResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
