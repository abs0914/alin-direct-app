<?php

namespace App\Filament\Branch\Resources\DeliveryJobResource\Pages;

use App\Filament\Branch\Resources\DeliveryJobResource;
use Filament\Actions;
use Filament\Resources\Pages\ViewRecord;

class ViewDeliveryJob extends ViewRecord
{
    protected static string $resource = DeliveryJobResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\EditAction::make(),
            Actions\Action::make('broadcast')
                ->icon('heroicon-o-signal')
                ->color('info')
                ->requiresConfirmation()
                ->modalHeading('Broadcast to Riders')
                ->modalDescription('This will send this job offer to all available riders in the branch.')
                ->visible(fn () => $this->record->status === 'pending')
                ->action(fn () => $this->record->update(['status' => 'broadcasting'])),
            Actions\Action::make('cancel')
                ->icon('heroicon-o-x-circle')
                ->color('danger')
                ->requiresConfirmation()
                ->visible(fn () => in_array($this->record->status, ['pending', 'broadcasting']))
                ->action(fn () => $this->record->update([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                ])),
        ];
    }
}

