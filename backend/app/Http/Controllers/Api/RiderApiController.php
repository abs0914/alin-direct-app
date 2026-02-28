<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryJob;
use App\Models\JobOffer;
use App\Models\LedgerEntry;
use App\Models\PayoutRequest;
use App\Models\ProofOfDelivery;
use App\Models\Rider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RiderApiController extends Controller
{
    // ── Helpers ──────────────────────────────────────

    private function rider(Request $request): Rider
    {
        return $request->user()->rider;
    }

    // ── Registration ────────────────────────────────

    /**
     * POST /api/rider/register
     * Create rider profile for the authenticated user.
     */
    public function register(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->rider) {
            return response()->json(['message' => 'Rider profile already exists.'], 409);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'vehicle_type' => 'required|in:motorcycle,mpv,van,truck',
            'branch_id' => 'nullable|exists:branches,id',
            'plate_number' => 'nullable|string|max:20',
            'vehicle_brand' => 'nullable|string|max:100',
            'vehicle_model' => 'nullable|string|max:100',
            'vehicle_color' => 'nullable|string|max:50',
            'maya_phone' => 'nullable|string|max:20',
        ]);

        $user->update([
            'name' => $validated['name'],
            'user_type' => 'rider',
        ]);

        $rider = Rider::create([
            'user_id' => $user->id,
            'branch_id' => $validated['branch_id'] ?? null,
            'vehicle_type' => $validated['vehicle_type'],
            'plate_number' => $validated['plate_number'] ?? null,
            'vehicle_brand' => $validated['vehicle_brand'] ?? null,
            'vehicle_model' => $validated['vehicle_model'] ?? null,
            'vehicle_color' => $validated['vehicle_color'] ?? null,
            'maya_phone' => $validated['maya_phone'] ?? null,
            'status' => 'pending',
            'availability' => 'offline',
            'rating' => 5.00,
            'total_deliveries' => 0,
        ]);

        $user->load('rider');

        return response()->json([
            'user' => $user,
            'rider' => $rider,
        ], 201);
    }

    // ── Profile ─────────────────────────────────────

    /**
     * GET /api/rider/profile
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('rider');

        return response()->json([
            'user' => $user,
            'rider' => $user->rider,
        ]);
    }

    /**
     * PUT /api/rider/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'plate_number' => 'sometimes|string|max:20',
            'vehicle_brand' => 'sometimes|string|max:100',
            'vehicle_model' => 'sometimes|string|max:100',
            'vehicle_color' => 'sometimes|string|max:50',
            'maya_phone' => 'sometimes|string|max:20',
        ]);

        $user = $request->user();

        if (isset($validated['name'])) {
            $user->update(['name' => $validated['name']]);
        }

        $riderFields = collect($validated)->except('name')->toArray();
        if (!empty($riderFields)) {
            $this->rider($request)->update($riderFields);
        }

        $user->load('rider');

        return response()->json([
            'user' => $user,
            'rider' => $user->rider,
        ]);
    }

    // ── Availability ────────────────────────────────

    /**
     * PUT /api/rider/availability
     */
    public function updateAvailability(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'availability' => 'required|in:online,offline',
        ]);

        $rider = $this->rider($request);

        if (!$rider->isApproved()) {
            return response()->json(['message' => 'Rider not approved.'], 403);
        }

        $rider->update([
            'availability' => $validated['availability'],
            'last_seen_at' => now(),
        ]);

        return response()->json(['availability' => $rider->availability]);
    }

    // ── Location ────────────────────────────────────

    /**
     * PUT /api/rider/location
     */
    public function updateLocation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
            'heading' => 'nullable|numeric',
            'speed' => 'nullable|numeric',
        ]);

        $this->rider($request)->update([
            'current_lat' => $validated['lat'],
            'current_lng' => $validated['lng'],
            'last_seen_at' => now(),
        ]);

        return response()->json(['success' => true]);
    }

    // ── Jobs ────────────────────────────────────────

    /**
     * GET /api/rider/jobs/active
     */
    public function activeJob(Request $request): JsonResponse
    {
        $rider = $this->rider($request);

        $job = DeliveryJob::where('rider_id', $rider->id)
            ->whereNotIn('status', ['delivered', 'failed', 'cancelled', 'returned'])
            ->latest()
            ->first();

        return response()->json(['job' => $job]);
    }

    /**
     * GET /api/rider/jobs/history
     */
    public function jobHistory(Request $request): JsonResponse
    {
        $rider = $this->rider($request);

        $jobs = DeliveryJob::where('rider_id', $rider->id)
            ->whereIn('status', ['delivered', 'failed', 'cancelled', 'returned'])
            ->latest()
            ->paginate(15);

        return response()->json($jobs);
    }

    /**
     * POST /api/rider/offers/{offer}/respond
     */
    public function respondToOffer(Request $request, JobOffer $offer): JsonResponse
    {
        $rider = $this->rider($request);

        if ($offer->rider_id !== $rider->id) {
            return response()->json(['message' => 'Not your offer.'], 403);
        }

        if ($offer->status !== 'pending') {
            return response()->json(['message' => 'Offer already responded to.'], 422);
        }

        if ($offer->isExpired()) {
            $offer->update(['status' => 'expired']);
            return response()->json(['message' => 'Offer expired.'], 422);
        }

        $validated = $request->validate([
            'action' => 'required|in:accept,reject',
        ]);

        $offer->update([
            'status' => $validated['action'] === 'accept' ? 'accepted' : 'rejected',
            'responded_at' => now(),
        ]);

        $job = null;
        if ($validated['action'] === 'accept') {
            $job = $offer->deliveryJob;
            $job->update([
                'rider_id' => $rider->id,
                'status' => 'accepted',
                'accepted_at' => now(),
            ]);

            $rider->update(['availability' => 'on_job']);

            // Expire other pending offers for this job
            JobOffer::where('job_id', $job->id)
                ->where('id', '!=', $offer->id)
                ->where('status', 'pending')
                ->update(['status' => 'expired']);
        }

        return response()->json([
            'success' => true,
            'offer_id' => $offer->id,
            'job' => $job,
        ]);
    }

    /**
     * PUT /api/rider/jobs/{job}/status
     */
    public function updateJobStatus(Request $request, DeliveryJob $job): JsonResponse
    {
        $rider = $this->rider($request);

        if ($job->rider_id !== $rider->id) {
            return response()->json(['message' => 'Not your job.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:en_route_pickup,at_pickup,picked_up,in_transit,at_dropoff,delivered,failed',
            'failure_reason' => 'required_if:status,failed|nullable|string|max:255',
            'failure_notes' => 'nullable|string|max:500',
        ]);

        $statusFlow = [
            'accepted' => ['en_route_pickup'],
            'en_route_pickup' => ['at_pickup'],
            'at_pickup' => ['picked_up'],
            'picked_up' => ['in_transit'],
            'in_transit' => ['at_dropoff'],
            'at_dropoff' => ['delivered', 'failed'],
        ];

        $allowed = $statusFlow[$job->status] ?? [];
        if (!in_array($validated['status'], $allowed)) {
            return response()->json([
                'message' => "Cannot transition from '{$job->status}' to '{$validated['status']}'.",
            ], 422);
        }

        $updates = ['status' => $validated['status']];

        if ($validated['status'] === 'picked_up') {
            $updates['picked_up_at'] = now();
        } elseif ($validated['status'] === 'delivered') {
            $updates['delivered_at'] = now();
            if ($job->payment_method === 'cod') {
                $updates['cod_collected'] = true;
            }
            $rider->update(['availability' => 'online']);
        } elseif ($validated['status'] === 'failed') {
            $updates['failed_at'] = now();
            $updates['failure_reason'] = $validated['failure_reason'];
            $updates['failure_notes'] = $validated['failure_notes'] ?? null;
            $rider->update(['availability' => 'online']);
        }

        $job->update($updates);

        return response()->json([
            'success' => true,
            'job' => $job->fresh(),
        ]);
    }

    // ── Proof of Delivery ───────────────────────────

    /**
     * POST /api/rider/jobs/{job}/pod
     */
    public function submitPod(Request $request, DeliveryJob $job): JsonResponse
    {
        $rider = $this->rider($request);

        if ($job->rider_id !== $rider->id) {
            return response()->json(['message' => 'Not your job.'], 403);
        }

        $validated = $request->validate([
            'recipient_name' => 'required|string|max:255',
            'photo' => 'required|image|max:5120', // 5MB
            'signature' => 'nullable|image|max:2048',
            'relationship' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'delivery_lat' => 'nullable|numeric|between:-90,90',
            'delivery_lng' => 'nullable|numeric|between:-180,180',
        ]);

        $photoPath = $request->file('photo')->store('pod/photos', 'public');
        $signaturePath = $request->hasFile('signature')
            ? $request->file('signature')->store('pod/signatures', 'public')
            : null;

        $pod = ProofOfDelivery::create([
            'job_id' => $job->id,
            'recipient_name' => $validated['recipient_name'],
            'photo_url' => $photoPath,
            'signature_url' => $signaturePath,
            'relationship' => $validated['relationship'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'delivery_lat' => $validated['delivery_lat'] ?? null,
            'delivery_lng' => $validated['delivery_lng'] ?? null,
        ]);

        return response()->json(['success' => true, 'pod' => $pod], 201);
    }

    // ── Earnings ────────────────────────────────────

    /**
     * GET /api/rider/earnings
     */
    public function earnings(Request $request): JsonResponse
    {
        $rider = $this->rider($request);
        $userId = $request->user()->id;

        $today = DeliveryJob::where('rider_id', $rider->id)
            ->where('status', 'delivered')
            ->whereDate('delivered_at', today())
            ->sum('rider_earnings');

        $thisWeek = DeliveryJob::where('rider_id', $rider->id)
            ->where('status', 'delivered')
            ->whereBetween('delivered_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->sum('rider_earnings');

        $thisMonth = DeliveryJob::where('rider_id', $rider->id)
            ->where('status', 'delivered')
            ->whereMonth('delivered_at', now()->month)
            ->whereYear('delivered_at', now()->year)
            ->sum('rider_earnings');

        $total = DeliveryJob::where('rider_id', $rider->id)
            ->where('status', 'delivered')
            ->sum('rider_earnings');

        // Pending payout = total earnings - already paid out
        $paidOut = PayoutRequest::where('rider_id', $rider->id)
            ->whereIn('status', ['approved', 'processing', 'completed'])
            ->sum('amount');

        $pendingPayout = max(0, $total - $paidOut);

        return response()->json([
            'today' => (float) $today,
            'this_week' => (float) $thisWeek,
            'this_month' => (float) $thisMonth,
            'total' => (float) $total,
            'pending_payout' => (float) $pendingPayout,
        ]);
    }

    // ── Payouts ─────────────────────────────────────

    /**
     * POST /api/rider/payouts
     */
    public function requestPayout(Request $request): JsonResponse
    {
        $rider = $this->rider($request);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:100', // Minimum ₱100 payout
        ]);

        // Check for pending payout requests
        $hasPending = PayoutRequest::where('rider_id', $rider->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            return response()->json(['message' => 'You already have a pending payout request.'], 422);
        }

        $payout = PayoutRequest::create([
            'rider_id' => $rider->id,
            'amount' => $validated['amount'],
            'status' => 'pending',
            'idempotency_key' => Str::uuid()->toString(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payout request submitted.',
            'payout' => $payout,
        ], 201);
    }

    // ── Documents (KYC) ─────────────────────────────

    /**
     * POST /api/rider/documents
     */
    public function uploadDocument(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:license,or_cr,nbi_clearance,selfie',
            'file' => 'required|image|max:5120', // 5MB
        ]);

        $rider = $this->rider($request);
        $path = $request->file('file')->store("kyc/{$rider->id}", 'public');

        $fieldMap = [
            'license' => 'license_url',
            'or_cr' => 'or_cr_url',
            'nbi_clearance' => 'nbi_clearance_url',
            'selfie' => 'selfie_url',
        ];

        $field = $fieldMap[$validated['type']];
        $rider->update([$field => $path]);

        return response()->json([
            'success' => true,
            'type' => $validated['type'],
            'url' => $path,
        ]);
    }
}

