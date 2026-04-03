<?php

namespace App\Filament\Branch\Pages;

use App\Models\DeliveryJob;
use App\Models\EmergencyAlert;
use App\Models\JobOffer;
use App\Models\Rider;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Livewire\Attributes\Computed;

class OperationsMap extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-map';
    protected static ?string $navigationGroup = 'Operations';
    protected static ?int $navigationSort = 1;
    protected static ?string $navigationLabel = 'Operations Map';
    protected static ?string $title = 'Live Operations Map';
    protected static string $view = 'filament.branch.pages.operations-map';

    public static function canAccess(): bool
    {
        return Auth::user()?->canHandleBranchOperations() ?? false;
    }

    public static function shouldRegisterNavigation(): bool
    {
        return static::canAccess();
    }

    // ── Active context ─────────────────────────────────────────
    public string $activePanel = 'none'; // 'job' | 'alert' | 'none'
    public ?int $selectedJobId = null;
    public ?int $selectedAlertId = null;

    // ── Dispatch state ─────────────────────────────────────────
    public string $vehicleTypeFilter = '';
    public string $onlineFilter = 'online';
    public array $selectedRiderIds = [];
    public int $timeoutSeconds = 60;
    public bool $isBroadcasting = false;
    public ?string $broadcastedAt = null;
    public int $broadcastRecipientCount = 0;

    private function branchId(): ?int
    {
        return Auth::user()?->branch_id;
    }

    // ── Map data ───────────────────────────────────────────────

    #[Computed]
    public function allRiders(): Collection
    {
        return Rider::where('branch_id', $this->branchId())
            ->where('status', 'approved')
            ->with('user:id,name,phone')
            ->get(['id', 'user_id', 'availability', 'vehicle_type', 'current_lat', 'current_lng', 'last_seen_at', 'rating', 'total_deliveries']);
    }

    public function ridersJson(): string
    {
        return $this->allRiders->map(fn ($r) => [
            'id'           => $r->id,
            'name'         => $r->user?->name ?? 'Rider #' . $r->id,
            'phone'        => $r->user?->phone ?? '',
            'availability' => $r->availability,
            'vehicle'      => $r->vehicle_type,
            'lat'          => $r->current_lat ? (float) $r->current_lat : null,
            'lng'          => $r->current_lng ? (float) $r->current_lng : null,
            'last_seen'    => $r->last_seen_at?->diffForHumans() ?? 'Unknown',
            'rating'       => $r->rating ? (float) $r->rating : null,
        ])->toJson();
    }

    public function alertsJson(): string
    {
        return $this->activeAlerts->map(fn ($a) => [
            'id'     => $a->id,
            'rider'  => $a->rider?->user?->name ?? 'Rider #' . $a->rider_id,
            'status' => $a->status,
            'lat'    => $a->lat ? (float) $a->lat : null,
            'lng'    => $a->lng ? (float) $a->lng : null,
            'notes'  => $a->notes,
            'ago'    => $a->created_at->diffForHumans(),
        ])->toJson();
    }

    // ── Emergency computed ─────────────────────────────────────

    #[Computed]
    public function activeAlerts(): Collection
    {
        return EmergencyAlert::where('branch_id', $this->branchId())
            ->whereIn('status', ['active', 'responding'])
            ->with(['rider.user', 'respondedByRider.user', 'emergencyJob'])
            ->orderByDesc('created_at')
            ->get();
    }

    #[Computed]
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
    public function selectedAlert(): ?EmergencyAlert
    {
        if (! $this->selectedAlertId) {
            return null;
        }

        return EmergencyAlert::where('branch_id', $this->branchId())
            ->whereIn('status', ['active', 'responding'])
            ->with(['rider.user', 'respondedByRider.user', 'emergencyJob'])
            ->find($this->selectedAlertId);
    }

    // ── Dispatch computed ──────────────────────────────────────

    #[Computed]
    public function pendingJobs(): Collection
    {
        return DeliveryJob::where('branch_id', $this->branchId())
            ->whereIn('status', ['pending', 'broadcasting'])
            ->orderByDesc('created_at')
            ->get(['id', 'tracking_uuid', 'status', 'pickup_address', 'dropoff_address', 'vehicle_type', 'total_price', 'created_at']);
    }

    #[Computed]
    public function selectedJob(): ?DeliveryJob
    {
        if (! $this->selectedJobId) {
            return null;
        }

        return DeliveryJob::where('branch_id', $this->branchId())
            ->whereIn('status', ['pending', 'broadcasting'])
            ->find($this->selectedJobId);
    }

    #[Computed]
    public function eligibleRiders(): Collection
    {
        $query = Rider::where('branch_id', $this->branchId())
            ->where('status', 'approved');

        if ($this->onlineFilter === 'online') {
            $query->where('availability', 'online');
        }

        if ($this->vehicleTypeFilter !== '') {
            $query->where('vehicle_type', $this->vehicleTypeFilter);
        }

        $query->where('availability', '!=', 'on_job');

        if ($this->selectedJobId) {
            $existing = JobOffer::where('job_id', $this->selectedJobId)
                ->whereIn('status', ['pending', 'accepted'])
                ->pluck('rider_id');
            $query->whereNotIn('id', $existing);
        }

        return $query->with('user:id,name,phone')
            ->orderByDesc('rating')
            ->orderByDesc('total_deliveries')
            ->get();
    }

    #[Computed]
    public function existingOffers(): Collection
    {
        if (! $this->selectedJobId) {
            return collect();
        }

        return JobOffer::where('job_id', $this->selectedJobId)
            ->with('rider.user:id,name,phone')
            ->orderByDesc('created_at')
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

    // ── Selection actions ──────────────────────────────────────

    public function selectJob(int $jobId): void
    {
        $this->selectedJobId    = $jobId;
        $this->selectedAlertId  = null;
        $this->activePanel      = 'job';
        $this->selectedRiderIds = [];
        $this->isBroadcasting   = false;
    }

    public function selectAlert(int $alertId): void
    {
        $this->selectedAlertId = $alertId;
        $this->selectedJobId   = null;
        $this->activePanel     = 'alert';
    }

    // ── Dispatch actions ───────────────────────────────────────

    public function toggleRider(int $riderId): void
    {
        if (in_array($riderId, $this->selectedRiderIds)) {
            $this->selectedRiderIds = array_values(array_diff($this->selectedRiderIds, [$riderId]));
        } else {
            $this->selectedRiderIds[] = $riderId;
        }
    }

    public function selectAllRiders(): void
    {
        $this->selectedRiderIds = $this->eligibleRiders->pluck('id')->toArray();
    }

    public function deselectAllRiders(): void
    {
        $this->selectedRiderIds = [];
    }

    public function broadcastToRiders(): void
    {
        if (! $this->selectedJobId) {
            Notification::make()->title('No job selected')->danger()->send();
            return;
        }

        if (empty($this->selectedRiderIds)) {
            Notification::make()->title('No riders selected')->danger()->send();
            return;
        }

        $job = DeliveryJob::where('branch_id', $this->branchId())
            ->where('id', $this->selectedJobId)
            ->whereIn('status', ['pending', 'broadcasting'])
            ->first();

        if (! $job) {
            Notification::make()->title('Job not found or already assigned')->danger()->send();
            return;
        }

        DB::beginTransaction();
        try {
            $job->update(['status' => 'broadcasting']);
            $expiresAt     = Carbon::now()->addSeconds($this->timeoutSeconds);
            $offersCreated = 0;

            foreach ($this->selectedRiderIds as $riderId) {
                JobOffer::updateOrCreate(
                    ['job_id' => $job->id, 'rider_id' => $riderId],
                    ['status' => 'pending', 'expires_at' => $expiresAt, 'responded_at' => null]
                );
                $offersCreated++;
            }

            DB::commit();

            $this->isBroadcasting          = true;
            $this->broadcastedAt           = Carbon::now()->toDateTimeString();
            $this->broadcastRecipientCount = $offersCreated;
            $this->selectedRiderIds        = [];

            Log::info('Broadcast dispatch', ['job_id' => $job->id, 'branch_id' => $this->branchId(), 'dispatched_by' => Auth::id(), 'rider_count' => $offersCreated]);

            Notification::make()
                ->title("Broadcast sent to {$offersCreated} rider(s)")
                ->body("Job #{$job->tracking_uuid} — offers expire at {$expiresAt->format('h:i:s A')}")
                ->success()->send();
        } catch (\Throwable $e) {
            DB::rollBack();
            Notification::make()->title('Broadcast failed')->body($e->getMessage())->danger()->send();
        }
    }

    public function manualAssign(int $riderId): void
    {
        if (! $this->selectedJobId) {
            Notification::make()->title('No job selected')->danger()->send();
            return;
        }

        $job = DeliveryJob::where('branch_id', $this->branchId())
            ->where('id', $this->selectedJobId)
            ->whereIn('status', ['pending', 'broadcasting'])
            ->first();

        $rider = Rider::where('branch_id', $this->branchId())
            ->where('id', $riderId)->where('status', 'approved')->first();

        if (! $job || ! $rider) {
            Notification::make()->title('Job or rider not found')->danger()->send();
            return;
        }

        DB::beginTransaction();
        try {
            JobOffer::where('job_id', $job->id)->where('status', 'pending')->update(['status' => 'cancelled']);
            JobOffer::updateOrCreate(
                ['job_id' => $job->id, 'rider_id' => $riderId],
                ['status' => 'accepted', 'expires_at' => Carbon::now(), 'responded_at' => Carbon::now()]
            );
            $job->update(['status' => 'accepted', 'rider_id' => $riderId, 'accepted_at' => Carbon::now()]);
            DB::commit();

            $this->isBroadcasting = false;
            $this->selectedJobId  = null;
            $this->activePanel    = 'none';

            Notification::make()
                ->title('Rider assigned successfully')
                ->body("Job #{$job->tracking_uuid} assigned to {$rider->user?->name}")
                ->success()->send();
        } catch (\Throwable $e) {
            DB::rollBack();
            Notification::make()->title('Assignment failed')->body($e->getMessage())->danger()->send();
        }
    }

    public function expireOffers(): void
    {
        if (! $this->selectedJobId) {
            return;
        }

        $expired = JobOffer::where('job_id', $this->selectedJobId)
            ->where('status', 'pending')
            ->update(['status' => 'expired', 'responded_at' => Carbon::now()]);

        DeliveryJob::where('id', $this->selectedJobId)
            ->where('branch_id', $this->branchId())
            ->where('status', 'broadcasting')
            ->update(['status' => 'pending']);

        $this->isBroadcasting = false;

        Notification::make()
            ->title("{$expired} offer(s) expired")
            ->body('Job is back to pending. Re-broadcast or manually assign.')
            ->warning()->send();
    }

    // ── Emergency actions ──────────────────────────────────────

    public function resolveAlert(int $alertId): void
    {
        $alert = EmergencyAlert::where('branch_id', $this->branchId())
            ->whereIn('status', ['active', 'responding'])
            ->find($alertId);

        if (! $alert) {
            Notification::make()->title('Alert not found or already closed.')->danger()->send();
            return;
        }

        $alert->update(['status' => 'resolved', 'resolved_at' => now()]);

        if ($alert->emergency_job_id) {
            DeliveryJob::where('id', $alert->emergency_job_id)
                ->whereNotIn('status', ['delivered', 'cancelled'])
                ->update(['status' => 'delivered', 'delivered_at' => now()]);
        }

        if ($alert->responded_by_rider_id) {
            Rider::where('id', $alert->responded_by_rider_id)
                ->where('availability', 'on_job')
                ->update(['availability' => 'online']);
        }

        if ($this->selectedAlertId === $alertId) {
            $this->selectedAlertId = null;
            $this->activePanel     = 'none';
        }

        Notification::make()
            ->title('Emergency resolved')
            ->body("Alert #{$alertId} marked as resolved.")
            ->success()->send();
    }

    public function cancelAlert(int $alertId): void
    {
        $alert = EmergencyAlert::where('branch_id', $this->branchId())
            ->where('status', 'active')
            ->find($alertId);

        if (! $alert) {
            Notification::make()->title('Alert not found or not active.')->danger()->send();
            return;
        }

        $alert->update(['status' => 'cancelled', 'resolved_at' => now()]);

        if ($alert->emergency_job_id) {
            DeliveryJob::where('id', $alert->emergency_job_id)
                ->whereIn('status', ['broadcasting', 'pending'])
                ->update(['status' => 'cancelled', 'cancelled_at' => now()]);
        }

        if ($this->selectedAlertId === $alertId) {
            $this->selectedAlertId = null;
            $this->activePanel     = 'none';
        }

        Notification::make()
            ->title('Emergency cancelled (false alarm)')
            ->warning()->send();
    }
}

