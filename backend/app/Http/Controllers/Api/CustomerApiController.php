<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\DeliveryJob;
use App\Models\JobOffer;
use App\Models\Branch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CustomerApiController extends Controller
{
    // ── Helpers ──────────────────────────────────────

    private function customer(Request $request): Customer
    {
        return $request->user()->customer;
    }

    // ── Registration ────────────────────────────────

    /**
     * POST /api/customer/register
     * Create customer profile for the authenticated user.
     */
    public function register(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->customer) {
            return response()->json(['message' => 'Customer profile already exists.'], 409);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'default_address' => 'nullable|string|max:500',
            'default_lat' => 'nullable|numeric|between:-90,90',
            'default_lng' => 'nullable|numeric|between:-180,180',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? $user->email,
            'user_type' => 'customer',
        ]);

        $customer = Customer::create([
            'user_id' => $user->id,
            'default_address' => $validated['default_address'] ?? null,
            'default_lat' => $validated['default_lat'] ?? null,
            'default_lng' => $validated['default_lng'] ?? null,
            'total_bookings' => 0,
        ]);

        return response()->json([
            'user' => $user->fresh(),
            'customer' => $customer,
        ], 201);
    }

    // ── Profile ─────────────────────────────────────

    /**
     * GET /api/customer/profile
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('customer');

        return response()->json([
            'user' => $user,
            'customer' => $user->customer,
        ]);
    }

    /**
     * PUT /api/customer/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'default_address' => 'sometimes|string|max:500',
            'default_lat' => 'sometimes|numeric|between:-90,90',
            'default_lng' => 'sometimes|numeric|between:-180,180',
        ]);

        $user = $request->user();

        $userFields = collect($validated)->only(['name', 'email'])->toArray();
        if (!empty($userFields)) {
            $user->update($userFields);
        }

        $customerFields = collect($validated)->only(['default_address', 'default_lat', 'default_lng'])->toArray();
        if (!empty($customerFields)) {
            $this->customer($request)->update($customerFields);
        }

        $user->load('customer');

        return response()->json([
            'user' => $user,
            'customer' => $user->customer,
        ]);
    }

    // ── Price Estimation ────────────────────────────

    /**
     * POST /api/customer/estimate
     */
    public function estimatePrice(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pickup_lat' => 'required|numeric|between:-90,90',
            'pickup_lng' => 'required|numeric|between:-180,180',
            'dropoff_lat' => 'required|numeric|between:-90,90',
            'dropoff_lng' => 'required|numeric|between:-180,180',
            'vehicle_type' => 'required|in:motorcycle,mpv,van,truck',
            'package_size' => 'nullable|string|max:50',
        ]);

        // Haversine distance calculation
        $R = 6371; // km
        $dLat = deg2rad($validated['dropoff_lat'] - $validated['pickup_lat']);
        $dLng = deg2rad($validated['dropoff_lng'] - $validated['pickup_lng']);
        $a = sin($dLat / 2) ** 2 +
            cos(deg2rad($validated['pickup_lat'])) * cos(deg2rad($validated['dropoff_lat'])) *
            sin($dLng / 2) ** 2;
        $distance = $R * 2 * atan2(sqrt($a), sqrt(1 - $a));

        // Pricing tables
        $pricing = [
            'motorcycle' => ['base_fare' => 60, 'per_km' => 15],
            'mpv' => ['base_fare' => 100, 'per_km' => 20],
            'van' => ['base_fare' => 200, 'per_km' => 25],
            'truck' => ['base_fare' => 500, 'per_km' => 30],
        ];

        $p = $pricing[$validated['vehicle_type']];
        $surge = 1.0; // TODO: dynamic surge pricing
        $distanceFare = $distance * $p['per_km'];
        $total = ($p['base_fare'] + $distanceFare) * $surge;

        return response()->json([
            'base_fare' => $p['base_fare'],
            'distance_fare' => round($distanceFare, 2),
            'surge_multiplier' => $surge,
            'total_price' => round($total, 2),
            'estimated_distance_km' => round($distance, 1),
        ]);
    }

    // ── Bookings ────────────────────────────────────

    /**
     * POST /api/customer/bookings
     */
    public function createBooking(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vehicle_type' => 'required|in:motorcycle,mpv,van,truck',
            'pickup_contact_name' => 'required|string|max:255',
            'pickup_contact_phone' => 'required|string|max:20',
            'pickup_address' => 'required|string|max:500',
            'pickup_lat' => 'required|numeric|between:-90,90',
            'pickup_lng' => 'required|numeric|between:-180,180',
            'pickup_notes' => 'nullable|string|max:500',
            'dropoff_contact_name' => 'required|string|max:255',
            'dropoff_contact_phone' => 'required|string|max:20',
            'dropoff_address' => 'required|string|max:500',
            'dropoff_lat' => 'required|numeric|between:-90,90',
            'dropoff_lng' => 'required|numeric|between:-180,180',
            'dropoff_notes' => 'nullable|string|max:500',
            'package_description' => 'nullable|string|max:255',
            'package_size' => 'required|string|max:50',
            'total_price' => 'required|numeric|min:0',
            'payment_method' => 'required|in:online,cod',
        ]);

        $user = $request->user();

        // Find nearest active branch (default to first active branch)
        $branch = Branch::where('is_active', true)->first();

        $job = DeliveryJob::create([
            'tracking_uuid' => Str::uuid()->toString(),
            'sender_id' => $user->id,
            'branch_id' => $branch?->id ?? 1,
            'created_by' => $user->id,
            'status' => 'pending',
            'vehicle_type' => $validated['vehicle_type'],
            'pickup_contact_name' => $validated['pickup_contact_name'],
            'pickup_contact_phone' => $validated['pickup_contact_phone'],
            'pickup_address' => $validated['pickup_address'],
            'pickup_lat' => $validated['pickup_lat'],
            'pickup_lng' => $validated['pickup_lng'],
            'pickup_notes' => $validated['pickup_notes'] ?? null,
            'dropoff_contact_name' => $validated['dropoff_contact_name'],
            'dropoff_contact_phone' => $validated['dropoff_contact_phone'],
            'dropoff_address' => $validated['dropoff_address'],
            'dropoff_lat' => $validated['dropoff_lat'],
            'dropoff_lng' => $validated['dropoff_lng'],
            'dropoff_notes' => $validated['dropoff_notes'] ?? null,
            'package_description' => $validated['package_description'] ?? null,
            'package_size' => $validated['package_size'],
            'total_price' => $validated['total_price'],
            'payment_method' => $validated['payment_method'],
            'payment_status' => 'pending',
        ]);

        // Increment customer booking count
        $this->customer($request)->increment('total_bookings');

        // TODO: Trigger job broadcasting to nearby riders via Supabase Realtime

        return response()->json($job, 201);
    }

    /**
     * GET /api/customer/bookings
     */
    public function bookingHistory(Request $request): JsonResponse
    {
        $user = $request->user();

        $jobs = DeliveryJob::where('sender_id', $user->id)
            ->with(['rider.user'])
            ->latest()
            ->paginate(15);

        return response()->json($jobs);
    }

    /**
     * GET /api/customer/bookings/{job}
     */
    public function bookingDetail(Request $request, DeliveryJob $job): JsonResponse
    {
        $user = $request->user();

        if ($job->sender_id !== $user->id) {
            return response()->json(['message' => 'Not your booking.'], 403);
        }

        $job->load(['rider.user', 'proofOfDelivery']);

        return response()->json($job);
    }

    /**
     * POST /api/customer/bookings/{job}/cancel
     */
    public function cancelBooking(Request $request, DeliveryJob $job): JsonResponse
    {
        $user = $request->user();

        if ($job->sender_id !== $user->id) {
            return response()->json(['message' => 'Not your booking.'], 403);
        }

        $cancellable = ['pending', 'broadcasting'];
        if (!in_array($job->status, $cancellable)) {
            return response()->json([
                'message' => 'Cannot cancel a booking that is already ' . $job->status . '.',
            ], 422);
        }

        $job->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'payment_status' => $job->payment_status === 'paid' ? 'refunded' : 'pending',
        ]);

        // Expire any pending offers for this job
        JobOffer::where('job_id', $job->id)
            ->where('status', 'pending')
            ->update(['status' => 'expired']);

        return response()->json(['success' => true, 'job' => $job->fresh()]);
    }

    // ── Active Booking ──────────────────────────────

    /**
     * GET /api/customer/bookings/active
     */
    public function activeBooking(Request $request): JsonResponse
    {
        $user = $request->user();

        $job = DeliveryJob::where('sender_id', $user->id)
            ->whereNotIn('status', ['delivered', 'failed', 'cancelled', 'returned'])
            ->with(['rider.user'])
            ->latest()
            ->first();

        return response()->json(['job' => $job]);
    }

    // ── Driver Location (for tracking) ──────────────

    /**
     * GET /api/customer/bookings/{job}/driver-location
     */
    public function driverLocation(Request $request, DeliveryJob $job): JsonResponse
    {
        $user = $request->user();

        if ($job->sender_id !== $user->id) {
            return response()->json(['message' => 'Not your booking.'], 403);
        }

        if (!$job->rider_id) {
            return response()->json(['lat' => null, 'lng' => null, 'last_seen_at' => null]);
        }

        $rider = $job->rider;

        return response()->json([
            'lat' => $rider->current_lat ? (float) $rider->current_lat : null,
            'lng' => $rider->current_lng ? (float) $rider->current_lng : null,
            'last_seen_at' => $rider->last_seen_at?->toIso8601String(),
        ]);
    }
}

