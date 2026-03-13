<x-filament-panels::page>
    {{-- Monthly Summary --}}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-green-50 rounded-xl border border-green-200 p-4">
            <div class="text-sm font-medium text-green-700">Month Sales</div>
            <div class="text-2xl font-bold text-green-800">₱{{ number_format($monthSales, 2) }}</div>
        </div>
        <div class="bg-red-50 rounded-xl border border-red-200 p-4">
            <div class="text-sm font-medium text-red-700">Month Expenses</div>
            <div class="text-2xl font-bold text-red-800">₱{{ number_format($monthExpenses, 2) }}</div>
        </div>
        <div class="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div class="text-sm font-medium text-amber-700">Net Profit</div>
            <div class="text-2xl font-bold text-amber-800">₱{{ number_format($monthSales - $monthExpenses, 2) }}</div>
        </div>
    </div>

    {{-- Sales Trend Table (Last 7 Days) --}}
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Daily Cash Flow (Last 7 Days)</h3>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Sales</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Expenses</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Net</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @foreach($salesTrend as $day)
                    <tr>
                        <td class="px-4 py-3 text-gray-900">{{ $day['date'] }}</td>
                        <td class="px-4 py-3 text-right text-green-600 font-medium">₱{{ number_format($day['sales'], 2) }}</td>
                        <td class="px-4 py-3 text-right text-red-600 font-medium">₱{{ number_format($day['expenses'], 2) }}</td>
                        <td class="px-4 py-3 text-right font-bold {{ ($day['sales'] - $day['expenses']) >= 0 ? 'text-green-700' : 'text-red-700' }}">
                            ₱{{ number_format($day['sales'] - $day['expenses'], 2) }}
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>

    {{-- Sales by Category & Payment Method --}}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Sales by Category (This Month)</h3>
            </div>
            <div class="p-4 space-y-3">
                @forelse($salesByCategory as $cat)
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700">{{ $cat->category }}</span>
                    <div class="text-right">
                        <span class="text-sm font-semibold text-gray-900">₱{{ number_format($cat->total, 2) }}</span>
                        <span class="text-xs text-gray-400 block">{{ $cat->count }} txns</span>
                    </div>
                </div>
                @empty
                <p class="text-sm text-gray-400">No data this month</p>
                @endforelse
            </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Sales by Payment Method (This Month)</h3>
            </div>
            <div class="p-4 space-y-3">
                @forelse($salesByPayment as $pm)
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700 capitalize">{{ str_replace('_', ' ', $pm->payment_method) }}</span>
                    <div class="text-right">
                        <span class="text-sm font-semibold text-gray-900">₱{{ number_format($pm->total, 2) }}</span>
                        <span class="text-xs text-gray-400 block">{{ $pm->count }} txns</span>
                    </div>
                </div>
                @empty
                <p class="text-sm text-gray-400">No data this month</p>
                @endforelse
            </div>
        </div>
    </div>

    {{-- Expenses by Category & Top Services --}}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Expenses by Category (This Month)</h3>
            </div>
            <div class="p-4 space-y-3">
                @forelse($expensesByCategory as $exp)
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700 capitalize">{{ $exp->category }}</span>
                    <div class="text-right">
                        <span class="text-sm font-semibold text-red-600">₱{{ number_format($exp->total, 2) }}</span>
                        <span class="text-xs text-gray-400 block">{{ $exp->count }} entries</span>
                    </div>
                </div>
                @empty
                <p class="text-sm text-gray-400">No expenses this month</p>
                @endforelse
            </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Top Services (This Month)</h3>
            </div>
            <div class="p-4 space-y-3">
                @forelse($topServices as $svc)
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700">{{ $svc->service }}</span>
                    <div class="text-right">
                        <span class="text-sm font-semibold text-gray-900">₱{{ number_format($svc->total, 2) }}</span>
                        <span class="text-xs text-gray-400 block">{{ $svc->count }} txns</span>
                    </div>
                </div>
                @empty
                <p class="text-sm text-gray-400">No data this month</p>
                @endforelse
            </div>
        </div>
    </div>

    {{-- EOD Closing History --}}
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Recent EOD Closings</h3>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Sales</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Expenses</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Expected Cash</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Actual Cash</th>
                        <th class="px-4 py-3 text-right font-medium text-gray-600">Variance</th>
                        <th class="px-4 py-3 text-left font-medium text-gray-600">Closed By</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @forelse($closingHistory as $c)
                    <tr>
                        <td class="px-4 py-3 text-gray-900">{{ $c->business_date->format('M d, Y') }}</td>
                        <td class="px-4 py-3 text-right text-green-600">₱{{ number_format($c->total_cash_sales + $c->total_digital_sales, 2) }}</td>
                        <td class="px-4 py-3 text-right text-red-600">₱{{ number_format($c->total_cash_expenses + $c->total_digital_expenses, 2) }}</td>
                        <td class="px-4 py-3 text-right">₱{{ number_format($c->expected_cash, 2) }}</td>
                        <td class="px-4 py-3 text-right">₱{{ number_format($c->actual_cash, 2) }}</td>
                        <td class="px-4 py-3 text-right font-semibold {{ abs($c->variance) > 100 ? 'text-red-600' : 'text-green-600' }}">₱{{ number_format($c->variance, 2) }}</td>
                        <td class="px-4 py-3 text-gray-600">{{ $c->closedByUser?->name ?? 'N/A' }}</td>
                    </tr>
                    @empty
                    <tr><td colspan="7" class="px-4 py-6 text-center text-gray-400">No closings recorded yet</td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</x-filament-panels::page>

