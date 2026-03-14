<x-filament-panels::page>
    <div class="max-w-3xl mx-auto space-y-6">

        {{-- ── Scanner Input ────────────────────────────────── --}}
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="bg-amber-50 border-b border-amber-100 p-4 flex items-center gap-3">
                <div class="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                    </svg>
                </div>
                <div>
                    <h2 class="text-base font-semibold text-gray-900">Scan Parcel Barcode</h2>
                    <p class="text-xs text-gray-500 mt-0.5">Point scanner at barcode or enter tracking ID manually</p>
                </div>
            </div>

            <div class="p-5 space-y-4">
                {{-- Barcode input --}}
                <div class="flex gap-3">
                    <div class="relative flex-1">
                        <input
                            wire:model="barcodeInput"
                            wire:keydown.enter="scanBarcode"
                            type="text"
                            placeholder="Scan or type barcode (e.g. ALN-2025-001)"
                            autofocus
                            class="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 uppercase tracking-wide"
                        />
                        <svg class="absolute right-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </div>
                    <button wire:click="scanBarcode"
                            class="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Lookup
                    </button>
                </div>

                {{-- Demo hint --}}
                <div class="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                    <p class="text-xs text-blue-700 font-medium">Demo barcodes: <span class="font-mono">ALN-2025-001</span>, <span class="font-mono">ALN-2025-002</span>, <span class="font-mono">ALN-2025-003</span></p>
                    <p class="text-xs text-blue-600 mt-1">In live mode the physical scanner auto-fills this field.</p>
                </div>

                {{-- Error --}}
                @if($scanError)
                <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
                    <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                    <p class="text-sm text-red-700">{{ $scanError }}</p>
                </div>
                @endif
            </div>
        </div>

        {{-- ── Scan Result ────────────────────────────────────── --}}
        @if($scannedParcel)
        <div class="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
            <div class="bg-green-50 border-b border-green-100 px-5 py-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-sm font-semibold text-green-800">Parcel Found — {{ $scannedParcel['tracking_id'] }}</span>
                </div>
                <button wire:click="clearScan" class="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
            </div>

            <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                @foreach([
                    ['Customer Name', 'customer_name'],
                    ['Phone', 'phone'],
                    ['Origin Branch', 'origin'],
                    ['Destination', 'destination'],
                    ['Service Type', 'service_type'],
                    ['Weight', 'weight'],
                    ['Declared Value', 'declared_value'],
                    ['Payment Method', 'payment_method'],
                    ['Status', 'status'],
                ] as [$label, $key])
                <div>
                    <dt class="text-xs font-semibold text-gray-500 uppercase tracking-wide">{{ $label }}</dt>
                    <dd class="mt-1 text-sm font-medium text-gray-900">{{ $scannedParcel[$key] }}</dd>
                </div>
                @endforeach

                @if(!empty($scannedParcel['notes']))
                <div class="sm:col-span-2">
                    <dt class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</dt>
                    <dd class="mt-1 text-sm text-amber-700 bg-amber-50 rounded px-3 py-2">{{ $scannedParcel['notes'] }}</dd>
                </div>
                @endif
            </div>

            {{-- Action buttons --}}
            <div class="px-5 pb-5 flex gap-3 flex-wrap">
                <button wire:click="clearScan"
                        class="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors">
                    Accept &amp; Print Label
                </button>
                <a href="{{ route('filament.branch.resources.delivery-jobs.create') }}"
                   class="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors">
                    Create Delivery Job
                </a>
                <button wire:click="clearScan"
                        class="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors">
                    Scan Next Parcel
                </button>
            </div>
        </div>
        @endif

    </div>
</x-filament-panels::page>

