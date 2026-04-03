<?php

namespace App\Filament\Branch\Pages;

use App\Models\EmergencyAlert;
use App\Models\Rider;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Polling;

class EmergencyMonitor extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-exclamation-triangle';

    protected static ?string $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 3;

    protected static ?string $navigationLabel = 'Emergency Monitor';

    protected static ?string $title = 'Emergency Monitor';

    protected static string $view = 'filament.branch.pages.emergency-monitor';

    public static function canAccess(): bool
    {
        return Auth::user()?->canHandleBranchOperations() ?? false;
    }

    public static function shouldRegisterNavigation(): bool
    {
        return false; // Consolidated into OperationsMap
    }

    private function branchId(): ?int
    {
        return Auth::user()?->branch_id;
    }

    // ── Computed: Active Alerts ─────────────────────────────────

    #[Computed]
    #[Polling(interval: '5s')]
    public function activeAlerts(): Collection
    {
        return EmergencyAlert::where('branch_id', $this->branchId())
            ->whereIn('status', ['active', 'responding'])
            ->with(['rider.user', 'respondedByRider.user', 'emergencyJob'])
            ->orderByDesc('created_at')
            ->get();
    }

    #[Computed]
    #[Polling(interval: '10s')]
    public function recentlyResolved(): Collection
    {
        return EmergencyAlert::where('branch_id', $this->branchId())
            ->whereIn('status', ['resolved', 'cancelled'])
            ->where('resolved_at', '>=', Carbon::now()->subHours(8))
            ->with(['rider.user', 'respondedByRider.user'])
            ->orderByDesc('resolved_at')
            ->limit(10)
            ->get();
    }

    #[Computed]
    public function onlineRiderCount(): int
    {
        return Rider::where('branch_id', $this->branchId())
            ->where('status', 'approved')
            ->where('availability', 'online')
            ->count();
    }

    // ── Actions ────────────────────────────────────────────────

    /**
     * Force-resolve an emergency from the branch panel.
     */
    public function resolveAlert(int $alertId): void
    {
        $alert = EmergencyAlert::where('branch_id', $this->branchId())
            ->whereIn('status', ['active', 'responding'])
            ->find($alertId);

        if (! $alert) {
            Notification::make()->title('Alert not found or already closed.')->danger()->send();
            return;
        }

        $alert->update([
            'status'      => 'resolved',
            'resolved_at' => now(),
        ]);

        if ($alert->emergency_job_id) {
            \App\Models\DeliveryJob::where('id', $alert->emergency_job_id)
                ->whereNotIn('status', ['delivered', 'cancelled'])
                ->update(['status' => 'delivered', 'delivered_at' => now()]);
        }

        if ($alert->responded_by_rider_id) {
            Rider::where('id', $alert->responded_by_rider_id)
                ->where('availability', 'on_job')
                ->update(['availability' => 'online']);
        }

        Notification::make()
            ->title('Emergency resolved')
            ->body("Alert #{$alertId} marked as resolved by branch staff.")
            ->success()
            ->send();
    }

    /**
     * Force-cancel a false alarm from the branch panel.
     */
    public function cancelAlert(int $alertId): void
    {
        $alert = EmergencyAlert::where('branch_id', $this->branchId())
            ->where('status', 'active')
            ->find($alertId);

        if (! $alert) {
            Notification::make()->title('Alert not found or not active.')->danger()->send();
            return;
        }

        $alert->update([
            'status'      => 'cancelled',
            'resolved_at' => now(),
        ]);

        if ($alert->emergency_job_id) {
            \App\Models\DeliveryJob::where('id', $alert->emergency_job_id)
                ->whereIn('status', ['broadcasting', 'pending'])
                ->update(['status' => 'cancelled', 'cancelled_at' => now()]);
        }

        Notification::make()
            ->title('Emergency cancelled')
            ->body("Alert #{$alertId} cancelled (false alarm).")
            ->warning()
            ->send();
    }
}

