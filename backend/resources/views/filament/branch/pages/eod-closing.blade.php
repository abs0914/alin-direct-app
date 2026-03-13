<x-filament-panels::page>
    @if($isClosed)
    <div class="rounded-xl bg-green-50 border border-green-200 p-4 mb-6">
        <div class="flex items-center gap-2">
            <x-heroicon-o-check-circle class="w-5 h-5 text-green-600" />
            <span class="font-semibold text-green-800">Day Closed Successfully</span>
            <span class="text-sm text-green-600">by {{ $closing?->closedByUser?->name ?? 'N/A' }} at {{ $closing?->closed_at?->format('h:i A') }}</span>
        </div>
    </div>
    @endif

    {{-- Summary Cards --}}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm text-gray-500">Total Cash Sales</div>
            <div class="text-xl font-bold text-green-600">₱{{ number_format($totalCashSales, 2) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm text-gray-500">Total Digital Sales</div>
            <div class="text-xl font-bold text-blue-600">₱{{ number_format($totalDigitalSales, 2) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm text-gray-500">Total Cash Expenses</div>
            <div class="text-xl font-bold text-red-600">₱{{ number_format($totalCashExpenses, 2) }}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div class="text-sm text-gray-500">Total Digital Expenses</div>
            <div class="text-xl font-bold text-orange-600">₱{{ number_format($totalDigitalExpenses, 2) }}</div>
        </div>
    </div>

    {{-- Cash Reconciliation --}}
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Cash Reconciliation</h3>
        </div>
        <div class="p-6">
            <div class="max-w-md space-y-4">
                <div class="flex justify-between items-center py-2 border-b border-gray-100">
                    <span class="text-sm text-gray-600">Opening Balance</span>
                    <span class="font-semibold text-gray-900">₱{{ number_format($opening_balance, 2) }}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-gray-100">
                    <span class="text-sm text-green-600">+ Cash Sales</span>
                    <span class="font-semibold text-green-700">₱{{ number_format($totalCashSales, 2) }}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-gray-100">
                    <span class="text-sm text-red-600">− Cash Expenses</span>
                    <span class="font-semibold text-red-700">₱{{ number_format($totalCashExpenses, 2) }}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b-2 border-gray-300">
                    <span class="text-sm font-bold text-amber-700">Expected Cash on Hand</span>
                    <span class="text-lg font-bold text-amber-700">₱{{ number_format($expectedCash, 2) }}</span>
                </div>

                @if(!$isClosed)
                <div class="pt-4 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Opening Balance (₱)</label>
                        <input type="number" step="0.01" wire:model.live="opening_balance"
                            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            placeholder="0.00">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Actual Cash on Hand (₱)</label>
                        <input type="number" step="0.01" wire:model.live="actual_cash"
                            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            placeholder="Enter counted cash amount">
                    </div>

                    @if($actual_cash !== null)
                    <div class="flex justify-between items-center py-2 rounded-lg px-3 {{ abs($actual_cash - $expectedCash) > 100 ? 'bg-red-50' : 'bg-green-50' }}">
                        <span class="text-sm font-medium {{ abs($actual_cash - $expectedCash) > 100 ? 'text-red-700' : 'text-green-700' }}">Variance</span>
                        <span class="text-lg font-bold {{ abs($actual_cash - $expectedCash) > 100 ? 'text-red-700' : 'text-green-700' }}">
                            ₱{{ number_format($actual_cash - $expectedCash, 2) }}
                        </span>
                    </div>
                    @endif

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Manager Notes</label>
                        <textarea wire:model="manager_notes" rows="3"
                            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                            placeholder="Required if variance exceeds ±₱100"></textarea>
                    </div>

                    <button wire:click="closeDay" wire:confirm="Are you sure you want to close today? This will lock all transactions and cannot be undone."
                        class="w-full py-3 px-4 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors">
                        🔒 Close Day
                    </button>
                </div>
                @else
                <div class="pt-4 space-y-2">
                    <div class="flex justify-between items-center py-2">
                        <span class="text-sm text-gray-600">Actual Cash</span>
                        <span class="font-semibold text-gray-900">₱{{ number_format($actual_cash, 2) }}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 rounded-lg px-3 {{ abs($variance) > 100 ? 'bg-red-50' : 'bg-green-50' }}">
                        <span class="text-sm font-medium">Variance</span>
                        <span class="text-lg font-bold {{ abs($variance) > 100 ? 'text-red-700' : 'text-green-700' }}">₱{{ number_format($variance, 2) }}</span>
                    </div>
                    @if($manager_notes)
                    <div class="bg-gray-50 rounded-lg p-3 mt-2">
                        <span class="text-xs text-gray-500 block mb-1">Manager Notes:</span>
                        <span class="text-sm text-gray-700">{{ $manager_notes }}</span>
                    </div>
                    @endif
                </div>
                @endif
            </div>
        </div>
    </div>
</x-filament-panels::page>

