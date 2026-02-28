<x-filament-panels::page>
    {{-- Summary --}}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Active Branches</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">{{ $totalActiveBranches }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Total Riders</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">{{ $totalRiders }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Total Deliveries</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">{{ number_format($totalDeliveries) }}</div>
        </div>
        <div class="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div class="text-sm font-medium text-amber-700">Total Revenue</div>
            <div class="text-2xl font-bold text-amber-800 mt-1">₱{{ number_format($totalRevenue, 2) }}</div>
        </div>
    </div>

    {{-- Branch Comparison Table --}}
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Branch Performance Comparison</h3>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Branch</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Riders</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Online</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Total Jobs</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Delivered</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Failed</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Pending</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Success Rate</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Revenue</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Commission</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @forelse($branches as $branch)
                    <tr>
                        <td class="px-4 py-3 text-gray-900 font-medium">
                            {{ $branch->name }}
                            <span class="text-xs text-gray-400 block">{{ $branch->city }}</span>
                        </td>
                        <td class="px-4 py-3 text-right text-gray-900">{{ $branch->approved_riders_count }} / {{ $branch->riders_count }}</td>
                        <td class="px-4 py-3 text-right">
                            <span class="text-sm font-medium {{ $branch->online_riders_count > 0 ? 'text-green-600' : 'text-gray-400' }}">
                                {{ $branch->online_riders_count }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-right text-gray-900 font-medium">{{ number_format($branch->total_jobs_count) }}</td>
                        <td class="px-4 py-3 text-right text-green-600 font-medium">{{ number_format($branch->delivered_jobs_count) }}</td>
                        <td class="px-4 py-3 text-right text-red-600 font-medium">{{ number_format($branch->failed_jobs_count) }}</td>
                        <td class="px-4 py-3 text-right text-amber-600 font-medium">{{ number_format($branch->pending_jobs_count) }}</td>
                        <td class="px-4 py-3 text-right">
                            <span class="text-sm font-semibold {{ $branch->success_rate >= 80 ? 'text-green-600' : ($branch->success_rate >= 50 ? 'text-amber-600' : 'text-red-600') }}">
                                {{ $branch->success_rate }}%
                            </span>
                        </td>
                        <td class="px-4 py-3 text-right text-gray-900 font-medium">₱{{ number_format($branch->total_revenue ?? 0, 2) }}</td>
                        <td class="px-4 py-3 text-right text-gray-600">₱{{ number_format($branch->total_commission ?? 0, 2) }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="10" class="px-4 py-6 text-center text-gray-500">No branch data available</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</x-filament-panels::page>

