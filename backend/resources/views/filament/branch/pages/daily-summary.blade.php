<x-filament-panels::page>
    {{-- Status Banner --}}
    @if($closing && $closing->status === 'closed')
    <div class="rounded-xl bg-green-50 border border-green-200 p-4 mb-6">
        <div class="flex items-center gap-2">
            <x-heroicon-o-check-circle class="w-5 h-5 text-green-600" />
            <span class="font-semibold text-green-800">Day Closed</span>
            <span class="text-sm text-green-600">by {{ $closing->closedByUser?->name ?? 'N/A' }} at {{ $closing->closed_at?->format('h:i A') }}</span>
        </div>
    </div>
    @endif

    {{-- Top Stats --}}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Total Sales</div>
            <div class="text-2xl font-bold text-green-600 mt-1">₱{{ number_format($totalSales, 2) }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ $salesCount }} transactions</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Total Expenses</div>
            <div class="text-2xl font-bold text-red-600 mt-1">₱{{ number_format($totalExpenses, 2) }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ $expenseCount }} entries</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Net Cash Flow</div>
            <div class="text-2xl font-bold {{ $netCashFlow >= 0 ? 'text-green-600' : 'text-red-600' }} mt-1">₱{{ number_format($netCashFlow, 2) }}</div>
            <div class="text-xs text-gray-400 mt-1">Sales − Expenses</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Expected Cash</div>
            <div class="text-2xl font-bold text-amber-600 mt-1">₱{{ number_format($expectedCash, 2) }}</div>
            <div class="text-xs text-gray-400 mt-1">Opening + Cash Sales − Cash Expenses</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm font-medium text-gray-500">Opening Balance</div>
            <div class="text-2xl font-bold text-gray-700 mt-1">₱{{ number_format($openingBalance, 2) }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ $today->format('M d, Y') }}</div>
        </div>
    </div>

    {{-- Sales & Expenses Breakdown --}}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {{-- Sales by Category --}}
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Sales by Service Category</h3>
            </div>
            <div class="p-4 space-y-3">
                @forelse($salesByCategory as $cat)
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700">{{ $cat->category }}</span>
                    <div class="text-right">
                        <span class="text-sm font-semibold text-gray-900">₱{{ number_format($cat->total, 2) }}</span>
                        <span class="text-xs text-gray-400 block">{{ $cat->count }} txn</span>
                    </div>
                </div>
                @empty
                <p class="text-sm text-gray-400">No sales recorded today</p>
                @endforelse
            </div>
        </div>

        {{-- Sales by Payment Method --}}
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div class="p-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">Sales by Payment Method</h3>
            </div>
            <div class="p-4 space-y-3">
                @forelse($salesByPayment as $pm)
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-700 capitalize">{{ str_replace('_', ' ', $pm->payment_method) }}</span>
                    <div class="text-right">
                        <span class="text-sm font-semibold text-gray-900">₱{{ number_format($pm->total, 2) }}</span>
                        <span class="text-xs text-gray-400 block">{{ $pm->count }} txn</span>
                    </div>
                </div>
                @empty
                <p class="text-sm text-gray-400">No sales recorded today</p>
                @endforelse
            </div>
        </div>
    </div>

    {{-- Expenses Breakdown --}}
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Expenses by Category</h3>
        </div>
        <div class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                @forelse($expensesByCategory as $exp)
                <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <span class="text-sm text-gray-700 capitalize">{{ $exp->category }}</span>
                    <div class="text-right">
                        <span class="text-sm font-semibold text-red-600">₱{{ number_format($exp->total, 2) }}</span>
                        <span class="text-xs text-gray-400 block">{{ $exp->count }} entries</span>
                    </div>
                </div>
                @empty
                <p class="text-sm text-gray-400 col-span-3">No expenses recorded today</p>
                @endforelse
            </div>
        </div>
    </div>

    {{-- Cash vs Digital Summary --}}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-green-50 rounded-xl border border-green-200 p-4">
            <h4 class="text-sm font-medium text-green-700 mb-3">Cash Breakdown</h4>
            <div class="space-y-2">
                <div class="flex justify-between"><span class="text-sm text-green-600">Cash Sales</span><span class="font-semibold text-green-800">₱{{ number_format($cashSales, 2) }}</span></div>
                <div class="flex justify-between"><span class="text-sm text-red-600">Cash Expenses</span><span class="font-semibold text-red-800">−₱{{ number_format($cashExpenses, 2) }}</span></div>
                <hr class="border-green-200">
                <div class="flex justify-between"><span class="text-sm font-medium text-green-700">Net Cash</span><span class="font-bold text-green-900">₱{{ number_format($cashSales - $cashExpenses, 2) }}</span></div>
            </div>
        </div>
        <div class="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <h4 class="text-sm font-medium text-blue-700 mb-3">Digital Breakdown</h4>
            <div class="space-y-2">
                <div class="flex justify-between"><span class="text-sm text-blue-600">Digital Sales</span><span class="font-semibold text-blue-800">₱{{ number_format($digitalSales, 2) }}</span></div>
                <div class="flex justify-between"><span class="text-sm text-red-600">Digital Expenses</span><span class="font-semibold text-red-800">−₱{{ number_format($digitalExpenses, 2) }}</span></div>
                <hr class="border-blue-200">
                <div class="flex justify-between"><span class="text-sm font-medium text-blue-700">Net Digital</span><span class="font-bold text-blue-900">₱{{ number_format($digitalSales - $digitalExpenses, 2) }}</span></div>
            </div>
        </div>
    </div>
</x-filament-panels::page>

