<?php

namespace App\Filament\Branch\Pages;

use App\Models\DeliveryJob;
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

class BroadcastDispatch extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-signal';

    protected static ?string $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 2;

    protected static ?string $navigationLabel = 'Broadcast Dispatch';

    protected static ?string $title = 'Broadcast Dispatch';

    protected static string $view = 'filament.branch.pages.broadcast-dispatch';

    public static function canAccess(): bool
    {
        return Auth::user()?->canHandleBranchOperations() ?? false;
    }

    public static function shouldRegisterNavigation(): bool
    {
        return false; // Consolidated into OperationsMap
    }

    // ── Form state ─────────────────────────────────────────────
    public ?int $selectedJobId = null;
    public string $vehicleTypeFilter = '';
    public string $onlineFilter = 'online'; // online | all
    public float $radiusKm = 10.0;
    public array $selectedRiderIds = [];
    public int $timeoutSeconds = 60;

    // ── Broadcast tracking ─────────────────────────────────────
    public bool $isBroadcasting = false;
    public ?string $broadcastedAt = null;
    public int $broadcastRecipientCount = 0;
    public array $broadcastLog = [];

    private function branchId(): ?int
    {
        return Auth::user()?->branch_id;
    }

    /**
     * Pending / broadcasting jobs belonging to this branch.
     */
    #[Computed]
    public function pendingJobs(): Collection
    {
        return DeliveryJob::where('branch_id', $this->branchId())
            ->whereIn('status', ['pending', 'broadcasting'])
            ->orderByDesc('created_at')
            ->get(['id', 'tracking_uuid', 'status', 'pickup_address', 'dropoff_address',
                    'vehicle_type', 'total_price', 'created_at']);
    }

    /**
     * The currently selected delivery job (if any).
     */
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

    /**
     * Eligible riders matching current filter criteria.
     */
    #[Computed]
    public function eligibleRiders(): Collection
    {
        $query = Rider::where('branch_id', $this->branchId())
            ->where('status', 'approved');

        // Online filter
        if ($this->onlineFilter === 'online') {
            $query->where('availability', 'online');
        }

        // Vehicle type filter
        if ($this->vehicleTypeFilter !== '') {
            $query->where('vehicle_type', $this->vehicleTypeFilter);
        }

        // Exclude riders already on a job
        $query->where('availability', '!=', 'on_job');

        // If a job is selected, exclude riders who already have a pending/accepted offer for it
        if ($this->selectedJobId) {
            $existingOfferRiderIds = JobOffer::where('job_id', $this->selectedJobId)
                ->whereIn('status', ['pending', 'accepted'])
                ->pluck('rider_id');

            $query->whereNotIn('id', $existingOfferRiderIds);
        }

        return $query->with('user:id,name,phone')
            ->orderByDesc('rating')
            ->orderByDesc('total_deliveries')
            ->get();
    }

    /**
     * Existing offers for the selected job (broadcast feedback).
     */
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

    /**
     * Toggle a rider in the selection.
     */
    public function toggleRider(int $riderId): void
    {
        if (in_array($riderId, $this->selectedRiderIds)) {
            $this->selectedRiderIds = array_values(
                array_diff($this->selectedRiderIds, [$riderId])
            );
        } else {
            $this->selectedRiderIds[] = $riderId;
        }
    }

    /**
     * Select all eligible riders.
     */
    public function selectAllRiders(): void
    {
        $this->selectedRiderIds = $this->eligibleRiders->pluck('id')->toArray();
    }

    /**
     * Deselect all riders.
     */
    public function deselectAllRiders(): void
    {
        $this->selectedRiderIds = [];
    }

    /**
     * Broadcast the selected job to chosen riders.
     */
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
            // Update job status to broadcasting
            $job->update(['status' => 'broadcasting']);

            $expiresAt = Carbon::now()->addSeconds($this->timeoutSeconds);
            $offersCreated = 0;
            $fcmResults = [];

            foreach ($this->selectedRiderIds as $riderId) {
                // Create or update the job offer
                $offer = JobOffer::updateOrCreate(
                    ['job_id' => $job->id, 'rider_id' => $riderId],
                    [
                        'status' => 'pending',
                        'expires_at' => $expiresAt,
                        'responded_at' => null,
                    ]
                );

                $offersCreated++;

                // --- FCM Push Notification (stub) ---
                // TODO: Implement actual FCM sending once firebase-admin SDK is integrated.
                // The driver app already listens on Supabase realtime channel
                // `job-offers-{riderId}` for `new_offer` events.
                $fcmResults[] = [
                    'rider_id' => $riderId,
                    'status' => 'offer_created',
                    'offer_id' => $offer->id,
                ];
            }

            DB::commit();

            // Update broadcast tracking state
            $this->isBroadcasting = true;
            $this->broadcastedAt = Carbon::now()->toDateTimeString();
            $this->broadcastRecipientCount = $offersCreated;
            $this->broadcastLog = $fcmResults;
            $this->selectedRiderIds = [];

            // Log the broadcast event
            Log::info('Broadcast dispatch', [
                'job_id' => $job->id,
                'tracking_uuid' => $job->tracking_uuid,
                'branch_id' => $this->branchId(),
                'dispatched_by' => Auth::id(),
                'rider_count' => $offersCreated,
                'timeout_seconds' => $this->timeoutSeconds,
                'expires_at' => $expiresAt->toDateTimeString(),
            ]);

            Notification::make()
                ->title("Broadcast sent to {$offersCreated} rider(s)")
                ->body("Job #{$job->tracking_uuid} — offers expire at {$expiresAt->format('h:i:s A')}")
                ->success()
                ->send();

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Broadcast dispatch failed', [
                'job_id' => $this->selectedJobId,
                'error' => $e->getMessage(),
            ]);
            Notification::make()
                ->title('Broadcast failed')
                ->body($e->getMessage())
                ->danger()
                ->send();
        }
    }

    /**
     * Manually assign the job to a specific rider (override).
     */
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

        if (! $job) {
            Notification::make()->title('Job not found or already assigned')->danger()->send();
            return;
        }

        $rider = Rider::where('branch_id', $this->branchId())
            ->where('id', $riderId)
            ->where('status', 'approved')
            ->first();

        if (! $rider) {
            Notification::make()->title('Rider not found or not approved')->danger()->send();
            return;
        }

        DB::beginTransaction();
        try {
            // Cancel any existing pending offers for this job
            JobOffer::where('job_id', $job->id)
                ->where('status', 'pending')
                ->update(['status' => 'cancelled']);

            // Create accepted offer
            JobOffer::updateOrCreate(
                ['job_id' => $job->id, 'rider_id' => $riderId],
                [
                    'status' => 'accepted',
                    'expires_at' => Carbon::now(),
                    'responded_at' => Carbon::now(),
                ]
            );

            // Assign rider to job
            $job->update([
                'status' => 'accepted',
                'rider_id' => $riderId,
                'accepted_at' => Carbon::now(),
            ]);

            DB::commit();

            $this->isBroadcasting = false;

            Log::info('Manual rider assignment', [
                'job_id' => $job->id,
                'rider_id' => $riderId,
                'assigned_by' => Auth::id(),
            ]);

            Notification::make()
                ->title('Rider assigned successfully')
                ->body("Job #{$job->tracking_uuid} assigned to {$rider->user?->name}")
                ->success()
                ->send();

        } catch (\Throwable $e) {
            DB::rollBack();
            Notification::make()
                ->title('Assignment failed')
                ->body($e->getMessage())
                ->danger()
                ->send();
        }
    }

    /**
     * Expire all pending offers for the selected job (manual timeout).
     */
    public function expireOffers(): void
    {
        if (! $this->selectedJobId) {
            return;
        }

        $expired = JobOffer::where('job_id', $this->selectedJobId)
            ->where('status', 'pending')
            ->update([
                'status' => 'expired',
                'responded_at' => Carbon::now(),
            ]);

        // Reset job back to pending for re-broadcast
        DeliveryJob::where('id', $this->selectedJobId)
            ->where('branch_id', $this->branchId())
            ->where('status', 'broadcasting')
            ->update(['status' => 'pending']);

        $this->isBroadcasting = false;
        $this->broadcastLog = [];

        Notification::make()
            ->title("{$expired} offer(s) expired")
            ->body('Job is back to pending. You can re-broadcast or manually assign.')
            ->warning()
            ->send();
    }
}

