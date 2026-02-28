<?php

namespace App\Filament\Branch\Resources\RiderResource\Pages;

use App\Filament\Branch\Resources\RiderResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditRider extends EditRecord
{
    protected static string $resource = RiderResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
