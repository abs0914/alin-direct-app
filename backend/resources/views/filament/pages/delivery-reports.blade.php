<x-filament-panels::page>
    {{-- Summary Stats --}}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Today's Deliveries</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">{{ $todayTotal }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ $todayDelivered }} delivered · {{ $todayFailed }} failed</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">This Week</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">{{ $weekTotal }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ $weekDelivered }} delivered</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">This Month</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">{{ $monthTotal }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ $monthDelivered }} delivered</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Success Rate</div>
            <div class="text-2xl font-bold text-amber-600 mt-1">{{ $successRate }}%</div>
            <div class="text-xs text-gray-400 mt-1">{{ $allTimeDelivered }} of {{ $allTimeTotal }} total</div>
        </div>
    </div>

    {{-- Today's Active Status --}}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div class="text-sm font-medium text-amber-700">Pending</div>
            <div class="text-xl font-bold text-amber-800">{{ $todayPending }}</div>
        </div>
        <div class="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div class="text-sm font-medium text-blue-700">In Transit</div>
            <div class="text-xl font-bold text-blue-800">{{ $todayInTransit }}</div>
        </div>
        <div class="bg-green-50 rounded-xl border border-green-200 p-4">
            <div class="text-sm font-medium text-green-700">Delivered Today</div>
            <div class="text-xl font-bold text-green-800">{{ $todayDelivered }}</div>
        </div>
        <div class="bg-red-50 rounded-xl border border-red-200 p-4">
            <div class="text-sm font-medium text-red-700">Failed Today</div>
            <div class="text-xl font-bold text-red-800">{{ $todayFailed }}</div>
        </div>
    </div>

    {{-- 7-Day Trend Table --}}
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Last 7 Days Trend</h3>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Delivered</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Failed</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @foreach($dailyTrend as $day)
                    <tr>
                        <td class="px-4 py-3 text-gray-900">{{ $day['date'] }}</td>
                        <td class="px-4 py-3 text-right text-gray-900 font-medium">{{ $day['total'] }}</td>
                        <td class="px-4 py-3 text-right text-green-600 font-medium">{{ $day['delivered'] }}</td>
                        <td class="px-4 py-3 text-right text-red-600 font-medium">{{ $day['failed'] }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>

    {{-- Status & Vehicle Breakdown --}}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Status Breakdown</h3>
            </div>
            <div class="p-4 space-y-3">
                @foreach($statusBreakdown as $status => $count)
                <div class="flex items-center justify-between">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        {{ $status === 'delivered' ? 'bg-green-100 text-green-800' : '' }}
                        {{ $status === 'pending' ? 'bg-yellow-100 text-yellow-800' : '' }}
                        {{ $status === 'broadcasting' ? 'bg-blue-100 text-blue-800' : '' }}
                        {{ in_array($status, ['accepted', 'picked_up', 'in_transit']) ? 'bg-indigo-100 text-indigo-800' : '' }}
                        {{ in_array($status, ['failed', 'cancelled']) ? 'bg-red-100 text-red-800' : '' }}
                    ">{{ ucfirst(str_replace('_', ' ', $status)) }}</span>
                    <span class="text-sm font-semibold text-gray-900">{{ $count }}</span>
                </div>
                @endforeach
            </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">By Vehicle Type</h3>
            </div>
            <div class="p-4 space-y-3">
                @forelse($vehicleBreakdown as $type => $count)
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700 capitalize">{{ $type ?? 'Not specified' }}</span>
                    <span class="text-sm font-semibold text-gray-900">{{ $count }}</span>
                </div>
                @empty
                <p class="text-sm text-gray-500">No delivery data available</p>
                @endforelse
            </div>
        </div>
    </div>
</x-filament-panels::page>

