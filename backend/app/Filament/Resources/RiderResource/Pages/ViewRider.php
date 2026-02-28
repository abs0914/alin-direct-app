<?php

namespace App\Filament\Resources\RiderResource\Pages;

use App\Filament\Resources\RiderResource;
use Filament\Actions;
use Filament\Resources\Pages\ViewRecord;

class ViewRider extends ViewRecord
{
    protected static string $resource = RiderResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\EditAction::make(),
            Actions\Action::make('approve')
                ->icon('heroicon-o-check-circle')
                ->color('success')
                ->requiresConfirmation()
                ->visible(fn () => $this->record->status === 'pending')
                ->action(fn () => $this->record->update([
                    'status' => 'approved',
                    'kyc_verified_at' => now(),
                    'kyc_verified_by' => auth()->id(),
                ])),
            Actions\Action::make('suspend')
                ->icon('heroicon-o-pause-circle')
                ->color('warning')
                ->requiresConfirmation()
                ->visible(fn () => $this->record->status === 'approved')
                ->action(fn () => $this->record->update(['status' => 'suspended'])),
            Actions\Action::make('reject')
                ->icon('heroicon-o-x-circle')
                ->color('danger')
                ->requiresConfirmation()
                ->visible(fn () => $this->record->status === 'pending')
                ->action(fn () => $this->record->update(['status' => 'rejected'])),
        ];
    }
}

