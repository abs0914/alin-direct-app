<x-filament-panels::page>
    {{-- Revenue Summary --}}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Today's Revenue</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">₱{{ number_format($todayRevenue, 2) }}</div>
            <div class="text-xs text-gray-400 mt-1">Commission: ₱{{ number_format($todayCommission, 2) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">This Week</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">₱{{ number_format($weekRevenue, 2) }}</div>
            <div class="text-xs text-gray-400 mt-1">Commission: ₱{{ number_format($weekCommission, 2) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">This Month</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">₱{{ number_format($monthRevenue, 2) }}</div>
            <div class="text-xs text-gray-400 mt-1">Commission: ₱{{ number_format($monthCommission, 2) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Avg Order Value</div>
            <div class="text-2xl font-bold text-amber-600 mt-1">₱{{ number_format($avgOrderValue, 2) }}</div>
            <div class="text-xs text-gray-400 mt-1">Per delivered order</div>
        </div>
    </div>

    {{-- All-time Earnings Breakdown --}}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div class="text-sm font-medium text-amber-700">Total Revenue (All-Time)</div>
            <div class="text-xl font-bold text-amber-800">₱{{ number_format($allTimeRevenue, 2) }}</div>
        </div>
        <div class="bg-green-50 rounded-xl border border-green-200 p-4">
            <div class="text-sm font-medium text-green-700">Platform Commission</div>
            <div class="text-xl font-bold text-green-800">₱{{ number_format($allTimeCommission, 2) }}</div>
        </div>
        <div class="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div class="text-sm font-medium text-blue-700">Rider Earnings</div>
            <div class="text-xl font-bold text-blue-800">₱{{ number_format($allTimeRiderEarnings, 2) }}</div>
        </div>
    </div>

    {{-- Revenue Trend --}}
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Revenue Trend (Last 7 Days)</h3>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Revenue</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Commission</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @foreach($revenueTrend as $day)
                    <tr>
                        <td class="px-4 py-3 text-gray-900">{{ $day['date'] }}</td>
                        <td class="px-4 py-3 text-right text-gray-900 font-medium">₱{{ number_format($day['revenue'], 2) }}</td>
                        <td class="px-4 py-3 text-right text-green-600 font-medium">₱{{ number_format($day['commission'], 2) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>

    {{-- Payment Methods & COD --}}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Payment Methods</h3>
            </div>
            <div class="p-4 space-y-3">
                @forelse($paymentMethods as $method => $data)
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700 capitalize">{{ $method ?? 'Unknown' }}</span>
                    <div class="text-right">
                        <span class="text-sm font-semibold text-gray-900">{{ $data['count'] ?? 0 }} orders</span>
                        <span class="text-xs text-gray-500 block">₱{{ number_format($data['total'] ?? 0, 2) }}</span>
                    </div>
                </div>
                @empty
                <p class="text-sm text-gray-500">No payment data available</p>
                @endforelse
            </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">COD Settlement Status</h3>
            </div>
            <div class="p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700">Total COD Orders</span>
                    <span class="text-sm font-semibold text-gray-900">{{ $codTotal }}</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-green-700">Settled</span>
                    <span class="text-sm font-semibold text-green-700">{{ $codSettled }}</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-red-700">Unsettled</span>
                    <span class="text-sm font-semibold text-red-700">{{ $codUnsettled }}</span>
                </div>
            </div>
        </div>
    </div>
</x-filament-panels::page>

