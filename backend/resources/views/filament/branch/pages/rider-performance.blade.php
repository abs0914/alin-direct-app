<x-filament-panels::page>
    {{-- Rider Summary --}}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Total Riders</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">{{ $totalRiders }}</div>
        </div>
        <div class="bg-green-50 rounded-xl border border-green-200 p-4">
            <div class="text-sm font-medium text-green-700">Approved</div>
            <div class="text-2xl font-bold text-green-800 mt-1">{{ $approvedRiders }}</div>
        </div>
        <div class="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div class="text-sm font-medium text-amber-700">Pending</div>
            <div class="text-2xl font-bold text-amber-800 mt-1">{{ $pendingRiders }}</div>
        </div>
        <div class="bg-red-50 rounded-xl border border-red-200 p-4">
            <div class="text-sm font-medium text-red-700">Suspended</div>
            <div class="text-2xl font-bold text-red-800 mt-1">{{ $suspendedRiders }}</div>
        </div>
        <div class="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div class="text-sm font-medium text-blue-700">Online Now</div>
            <div class="text-2xl font-bold text-blue-800 mt-1">{{ $onlineRiders }}</div>
        </div>
    </div>

    {{-- Performance Metrics --}}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Avg Rating</div>
            <div class="text-2xl font-bold text-amber-600 mt-1">{{ number_format($avgRating, 1) }} ★</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Avg Deliveries/Rider</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">{{ $avgDeliveriesPerRider }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Avg Earnings/Rider</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">₱{{ number_format($avgEarningsPerRider, 2) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">7-Day Retention</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">{{ $retentionRate7d }}%</div>
            <div class="text-xs text-gray-400 mt-1">30-Day: {{ $retentionRate30d }}%</div>
        </div>
    </div>

    {{-- Vehicle Type & Retention --}}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Vehicle Type Breakdown</h3>
            </div>
            <div class="p-4 space-y-3">
                @forelse($vehicleTypes as $type => $count)
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700 capitalize">{{ $type ?? 'Not specified' }}</span>
                    <span class="text-sm font-semibold text-gray-900">{{ $count }}</span>
                </div>
                @empty
                <p class="text-sm text-gray-500">No rider data available</p>
                @endforelse
            </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Rider Retention</h3>
            </div>
            <div class="p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700">Active (Last 7 Days)</span>
                    <span class="text-sm font-semibold text-gray-900">{{ $activeLastWeek }} riders</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700">Active (Last 30 Days)</span>
                    <span class="text-sm font-semibold text-gray-900">{{ $activeLastMonth }} riders</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700">7-Day Retention Rate</span>
                    <span class="text-sm font-semibold {{ $retentionRate7d >= 50 ? 'text-green-600' : 'text-red-600' }}">{{ $retentionRate7d }}%</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700">30-Day Retention Rate</span>
                    <span class="text-sm font-semibold {{ $retentionRate30d >= 50 ? 'text-green-600' : 'text-red-600' }}">{{ $retentionRate30d }}%</span>
                </div>
            </div>
        </div>
    </div>

    {{-- Top Riders --}}
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Top 10 Riders by Completed Deliveries</h3>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">#</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Rider</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Phone</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Deliveries</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Rating</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @forelse($topRiders as $index => $rider)
                    <tr>
                        <td class="px-4 py-3 text-gray-500">{{ $index + 1 }}</td>
                        <td class="px-4 py-3 text-gray-900 font-medium">{{ $rider->user?->name ?? 'N/A' }}</td>
                        <td class="px-4 py-3 text-gray-600">{{ $rider->user?->phone ?? 'N/A' }}</td>
                        <td class="px-4 py-3 text-right text-gray-900 font-semibold">{{ $rider->completed_deliveries }}</td>
                        <td class="px-4 py-3 text-right text-amber-600">{{ $rider->rating ? number_format($rider->rating, 1) . ' ★' : '-' }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="5" class="px-4 py-6 text-center text-gray-500">No rider data available</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</x-filament-panels::page>

