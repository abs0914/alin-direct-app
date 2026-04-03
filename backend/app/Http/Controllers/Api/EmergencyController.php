<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryJob;
use App\Models\EmergencyAlert;
use App\Models\JobOffer;
use App\Models\Rider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class EmergencyController extends Controller
{
    private function rider(Request $request): Rider
    {
        return $request->user()->rider;
    }

    // ── Trigger SOS ──────────────────────────────────────────────────────────

    /**
     * POST /api/rider/emergency
     * Rider in distress triggers an SOS signal.
     * Creates EmergencyAlert + emergency DeliveryJob, broadcasts to branch channel.
     */
    public function trigger(Request $request): JsonResponse
    {
        $rider = $this->rider($request);

        if (! $rider->isApproved()) {
            return response()->json(['message' => 'Rider not approved.'], 403);
        }

        // Prevent duplicate active alerts
        $existing = EmergencyAlert::where('rider_id', $rider->id)
            ->whereIn('status', ['active', 'responding'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'You already have an active emergency alert.',
                'alert' => $existing->load('rider.user', 'emergencyJob'),
            ], 409);
        }

        $validated = $request->validate([
            'lat'   => 'required|numeric|between:-90,90',
            'lng'   => 'required|numeric|between:-180,180',
            'notes' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            $alert = EmergencyAlert::create([
                'rider_id'  => $rider->id,
                'branch_id' => $rider->branch_id,
                'lat'       => $validated['lat'],
                'lng'       => $validated['lng'],
                'status'    => 'active',
                'notes'     => $validated['notes'] ?? null,
            ]);

            // Auto-create an emergency assistance job for the branch to broadcast
            $riderName = $rider->user?->name ?? 'Unknown Rider';
            $job = DeliveryJob::create([
                'tracking_uuid'         => Str::uuid()->toString(),
                'branch_id'             => $rider->branch_id,
                'created_by'            => $request->user()->id,
                'status'                => 'broadcasting',
                'is_emergency'          => true,
                'vehicle_type'          => $rider->vehicle_type,
                'pickup_contact_name'   => $riderName,
                'pickup_contact_phone'  => $rider->user?->phone ?? '',
                'pickup_address'        => "EMERGENCY — Rider in Distress (Rider #{$rider->id})",
                'pickup_lat'            => $validated['lat'],
                'pickup_lng'            => $validated['lng'],
                'pickup_notes'          => $validated['notes'] ?? 'Rider has triggered an SOS. Please respond immediately.',
                'dropoff_contact_name'  => $riderName,
                'dropoff_contact_phone' => $rider->user?->phone ?? '',
                'dropoff_address'       => "EMERGENCY — Rider in Distress (Rider #{$rider->id})",
                'dropoff_lat'           => $validated['lat'],
                'dropoff_lng'           => $validated['lng'],
                'package_description'   => 'Emergency Assistance — No package. Respond to distressed rider.',
                'package_size'          => 'small',
                'total_price'           => 0,
                'rider_earnings'        => 0,
                'platform_commission'   => 0,
                'payment_method'        => 'cod',
                'payment_status'        => 'pending',
            ]);

            $alert->update(['emergency_job_id' => $job->id]);

            DB::commit();

            Log::warning('Emergency SOS triggered', [
                'alert_id' => $alert->id,
                'rider_id' => $rider->id,
                'branch_id' => $rider->branch_id,
                'lat' => $validated['lat'],
                'lng' => $validated['lng'],
            ]);

            return response()->json([
                'success' => true,
                'alert'   => $alert->load('rider.user', 'emergencyJob'),
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Emergency SOS creation failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to trigger emergency.'], 500);
        }
    }

    // ── Get My Active Emergency ───────────────────────────────────────────────

    /**
     * GET /api/rider/emergency/active
     * Returns the current rider's active emergency alert (if any).
     */
    public function myActiveAlert(Request $request): JsonResponse
    {
        $rider = $this->rider($request);

        $alert = EmergencyAlert::where('rider_id', $rider->id)
            ->whereIn('status', ['active', 'responding'])
            ->with(['rider.user', 'emergencyJob', 'respondedByRider.user'])
            ->latest()
            ->first();

        return response()->json(['alert' => $alert]);
    }

    // ── Nearby Active Emergencies ─────────────────────────────────────────────

    /**
     * GET /api/rider/emergency/nearby
     * Returns active emergency alerts in the same branch, visible to online riders.
     */
    public function nearby(Request $request): JsonResponse
    {
        $rider = $this->rider($request);

        if (! $rider->isApproved() || ! $rider->isOnline()) {
            return response()->json(['alerts' => []]);
        }

        $alerts = EmergencyAlert::where('branch_id', $rider->branch_id)
            ->where('rider_id', '!=', $rider->id)   // Don't show rider their own alert
            ->whereIn('status', ['active', 'responding'])
            ->with(['rider.user', 'emergencyJob'])
            ->latest()
            ->get();

        return response()->json(['alerts' => $alerts]);
    }

    // ── Respond to Emergency ──────────────────────────────────────────────────

    /**
     * POST /api/rider/emergency/{alert}/respond
     * A nearby rider accepts the emergency assistance job.
     */
    public function respond(Request $request, EmergencyAlert $alert): JsonResponse
    {
        $rider = $this->rider($request);

        if ($alert->branch_id !== $rider->branch_id) {
            return response()->json(['message' => 'Emergency not in your branch.'], 403);
        }

        if (! $alert->isActive()) {
            return response()->json(['message' => 'Emergency is no longer active.'], 422);
        }

        if ($alert->rider_id === $rider->id) {
            return response()->json(['message' => 'Cannot respond to your own emergency.'], 422);
        }

        DB::beginTransaction();
        try {
            $job = $alert->emergencyJob;

            if ($job) {
                // Create an accepted job offer for this rider
                JobOffer::updateOrCreate(
                    ['job_id' => $job->id, 'rider_id' => $rider->id],
                    [
                        'status'       => 'accepted',
                        'expires_at'   => Carbon::now()->addHours(1),
                        'responded_at' => Carbon::now(),
                    ]
                );

                $job->update([
                    'rider_id'    => $rider->id,
                    'status'      => 'accepted',
                    'accepted_at' => Carbon::now(),
                ]);

                $rider->update(['availability' => 'on_job']);
            }

            $alert->update([
                'status'                => 'responding',
                'responded_by_rider_id' => $rider->id,
            ]);

            DB::commit();

            Log::info('Emergency response accepted', [
                'alert_id'   => $alert->id,
                'responder_rider_id' => $rider->id,
            ]);

            return response()->json([
                'success' => true,
                'alert'   => $alert->fresh()->load('rider.user', 'respondedByRider.user', 'emergencyJob'),
                'job'     => $job?->fresh(),
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to respond to emergency.'], 500);
        }
    }

    // ── Resolve Emergency ─────────────────────────────────────────────────────

    /**
     * POST /api/rider/emergency/{alert}/resolve
     * The distressed rider (or responder) marks the emergency as resolved.
     */
    public function resolve(Request $request, EmergencyAlert $alert): JsonResponse
    {
        $rider = $this->rider($request);

        $isOwner     = $alert->rider_id === $rider->id;
        $isResponder = $alert->responded_by_rider_id === $rider->id;

        if (! $isOwner && ! $isResponder) {
            return response()->json(['message' => 'Not authorized to resolve this emergency.'], 403);
        }

        if ($alert->isResolved()) {
            return response()->json(['message' => 'Emergency already resolved.'], 422);
        }

        $alert->update([
            'status'      => 'resolved',
            'resolved_at' => now(),
        ]);

        // Mark the emergency job as delivered/completed if it exists
        if ($alert->emergency_job_id) {
            DeliveryJob::where('id', $alert->emergency_job_id)
                ->whereNotIn('status', ['delivered', 'cancelled'])
                ->update(['status' => 'delivered', 'delivered_at' => now()]);
        }

        // Free up the responder rider
        if ($alert->responded_by_rider_id) {
            Rider::where('id', $alert->responded_by_rider_id)
                ->where('availability', 'on_job')
                ->update(['availability' => 'online']);
        }

        Log::info('Emergency resolved', ['alert_id' => $alert->id]);

        return response()->json([
            'success' => true,
            'alert'   => $alert->fresh()->load('rider.user', 'respondedByRider.user'),
        ]);
    }

    // ── Cancel Emergency (self-cancel) ───────────────────────────────────────

    /**
     * POST /api/rider/emergency/{alert}/cancel
     * The distressed rider cancels their own emergency (false alarm).
     */
    public function cancel(Request $request, EmergencyAlert $alert): JsonResponse
    {
        $rider = $this->rider($request);

        if ($alert->rider_id !== $rider->id) {
            return response()->json(['message' => 'Not your emergency.'], 403);
        }

        if ($alert->isResolved()) {
            return response()->json(['message' => 'Emergency already closed.'], 422);
        }

        $alert->update([
            'status'      => 'cancelled',
            'resolved_at' => now(),
        ]);

        if ($alert->emergency_job_id) {
            DeliveryJob::where('id', $alert->emergency_job_id)
                ->whereIn('status', ['broadcasting', 'pending'])
                ->update(['status' => 'cancelled', 'cancelled_at' => now()]);
        }

        return response()->json(['success' => true]);
    }
}

