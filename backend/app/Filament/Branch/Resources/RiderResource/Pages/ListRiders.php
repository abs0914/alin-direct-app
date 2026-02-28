<?php

namespace App\Filament\Branch\Resources\RiderResource\Pages;

use App\Filament\Branch\Resources\RiderResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListRiders extends ListRecords
{
    protected static string $resource = RiderResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
