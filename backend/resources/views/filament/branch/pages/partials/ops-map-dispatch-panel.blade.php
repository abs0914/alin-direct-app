{{-- Dispatch right panel — shown when a pending job is selected --}}
<style>
    .ops-job-hdr { padding:.75rem 1rem; display:flex; align-items:center; gap:.5rem;
        background:linear-gradient(to right,#f59e0b,#f97316); }
    .ops-origin-dot { width:.75rem; height:.75rem; border-radius:50%; background:#10b981;
        flex-shrink:0; margin-top:.125rem; }
    .ops-dest-dot { width:.75rem; height:.75rem; border-radius:50%; background:#ef4444;
        flex-shrink:0; margin-top:.125rem; }
    .ops-rider-avatar { width:1.75rem; height:1.75rem; border-radius:50%; flex-shrink:0;
        display:inline-flex; align-items:center; justify-content:center;
        font-size:.625rem; font-weight:900; color:#fff; }
    .ops-avatar-online { background:#10b981; }
    .ops-avatar-offline { background:#9ca3af; }
    .ops-bcast-btn { display:inline-flex; align-items:center; gap:.375rem; padding:.4rem .75rem;
        font-size:.7rem; font-weight:900; color:#fff; border-radius:.75rem; transition:all .15s ease;
        background:linear-gradient(to right,#f59e0b,#f97316); }
    .ops-bcast-btn:hover:not(:disabled) { background:linear-gradient(to right,#d97706,#ea580c); }
    .ops-bcast-btn:disabled { background:#d1d5db; color:#9ca3af; cursor:not-allowed; }
    .ops-bcast-banner { border-radius:1rem; background:linear-gradient(to right,#3b82f6,#4338ca);
        padding:1rem; box-shadow:0 4px 12px -2px rgba(59,130,246,.3); }
    .ops-gmaps-link { display:flex; align-items:center; gap:.5rem; border-radius:.75rem;
        background:#eff6ff; border:1px solid #bfdbfe; padding:.625rem .75rem; transition:background .15s ease; }
    .ops-gmaps-link:hover { background:#dbeafe; }
</style>

<div class="w-80 flex-shrink-0 flex flex-col gap-3 overflow-y-auto ops-scroll">

    {{-- Job summary --}}
    <div class="ops-r2 border border-amber-200 shadow-sm overflow-hidden">
        <div class="ops-job-hdr">
            <x-heroicon-s-signal class="w-4 h-4 text-white flex-shrink-0" style="opacity:.8;" />
            <p class="text-xs font-mono font-bold text-white truncate flex-1"
                style="opacity:.9;">#{{ Str::limit($this->selectedJob->tracking_uuid, 14, '…') }}</p>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                style="{{ $this->selectedJob->status === 'broadcasting' ? 'background:rgba(96,165,250,.3);color:#bfdbfe;' : 'background:rgba(255,255,255,.2);color:#fff;' }}">
                {{ ucfirst($this->selectedJob->status) }}
            </span>
        </div>
        <div class="bg-white px-4 py-3 space-y-2">
            <div class="flex items-start gap-2">
                <div class="ops-origin-dot"></div>
                <p class="text-xs font-semibold text-gray-800 leading-snug flex-1">{{ $this->selectedJob->pickup_address ?? '—' }}</p>
            </div>
            <div class="flex items-start gap-2">
                <div class="ops-dest-dot"></div>
                <p class="text-xs text-gray-500 leading-snug flex-1">{{ $this->selectedJob->dropoff_address ?? '—' }}</p>
            </div>
            @if($this->selectedJob->total_price)
                <div class="pt-1" style="border-top:1px solid #fde68a;">
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-400">Delivery fee</span>
                        <span class="text-base font-bold text-amber-600">₱{{ number_format($this->selectedJob->total_price, 2) }}</span>
                    </div>
                </div>
            @endif
        </div>
    </div>

    {{-- Filters --}}
    <div class="bg-white ops-r2 border border-gray-100 shadow-sm p-4">
        <h4 class="text-xs font-bold text-gray-400 uppercase mb-3" style="letter-spacing:.1em;">Filter Riders</h4>
        <div class="grid grid-cols-2 gap-3">
            <div>
                <label class="block text-xs text-gray-400 mb-1 font-semibold">Vehicle</label>
                <select wire:model.live="vehicleTypeFilter"
                    class="w-full rounded-xl border-gray-200 text-xs text-gray-700 focus:border-amber-500 focus:ring-amber-500"
                    style="background:#f9fafb;">
                    <option value="">All</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="mpv">MPV</option>
                    <option value="van">Van</option>
                    <option value="truck">Truck</option>
                </select>
            </div>
            <div>
                <label class="block text-xs text-gray-400 mb-1 font-semibold">Status</label>
                <select wire:model.live="onlineFilter"
                    class="w-full rounded-xl border-gray-200 text-xs text-gray-700 focus:border-amber-500 focus:ring-amber-500"
                    style="background:#f9fafb;">
                    <option value="online">Online only</option>
                    <option value="all">All approved</option>
                </select>
            </div>
            <div>
                <label class="block text-xs text-gray-400 mb-1 font-semibold">Timeout (s)</label>
                <input type="number" wire:model.live="timeoutSeconds" min="15" max="300" step="15"
                    class="w-full rounded-xl border-gray-200 text-xs text-gray-700 focus:border-amber-500 focus:ring-amber-500"
                    style="background:#f9fafb;" />
            </div>
            <div class="flex items-end gap-2">
                <button wire:click="selectAllRiders"
                    class="flex-1 py-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition">
                    All
                </button>
                <button wire:click="deselectAllRiders"
                    class="flex-1 py-2 text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition">
                    None
                </button>
            </div>
        </div>
    </div>

    {{-- Eligible riders --}}
    <div class="bg-white ops-r2 border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div>
                <p class="text-xs font-bold text-gray-900">
                    Eligible Riders
                    <span class="font-normal text-gray-400">({{ $this->eligibleRiders->count() }})</span>
                </p>
                @if(count($selectedRiderIds) > 0)
                    <p class="text-xs text-amber-600 font-semibold mt-0.5">{{ count($selectedRiderIds) }} selected</p>
                @endif
            </div>
            <button wire:click="broadcastToRiders"
                @if(empty($selectedRiderIds)) disabled @endif
                class="ops-bcast-btn">
                <x-heroicon-s-signal class="w-3 h-3" />
                Broadcast ({{ count($selectedRiderIds) }})
            </button>
        </div>
        <div class="overflow-y-auto ops-scroll" style="max-height:220px;">
            @forelse($this->eligibleRiders as $rider)
                @php
                    $words   = array_filter(explode(' ', $rider->user?->name ?? 'R'));
                    $initials = implode('', array_map(fn($w) => strtoupper(substr($w,0,1)), array_slice($words,0,2)));
                    $isSel   = in_array($rider->id, $selectedRiderIds);
                @endphp
                <div class="flex items-center gap-2 px-4 py-2 border-b border-gray-50 ops-row
                    {{ $isSel ? 'bg-amber-50' : '' }}">
                    <input type="checkbox" wire:click="toggleRider({{ $rider->id }})"
                        {{ $isSel ? 'checked' : '' }}
                        class="rounded border-gray-300 text-amber-500 focus:ring-amber-500 flex-shrink-0" />
                    <span class="ops-rider-avatar {{ $rider->availability === 'online' ? 'ops-avatar-online' : 'ops-avatar-offline' }}">
                        {{ $initials }}
                    </span>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-semibold text-gray-900 truncate">{{ $rider->user?->name ?? 'N/A' }}</p>
                        <p class="text-xs text-gray-400 capitalize">{{ $rider->vehicle_type }}</p>
                    </div>
                    <div class="text-right flex-shrink-0">
                        @if($rider->rating)
                            <p class="text-xs font-bold text-amber-500">{{ number_format($rider->rating, 1) }}★</p>
                        @endif
                        <button wire:click="manualAssign({{ $rider->id }})"
                            wire:confirm="Assign to {{ $rider->user?->name }}? This cancels all pending offers."
                            class="text-xs font-semibold text-blue-600 hover:underline">
                            Assign
                        </button>
                    </div>
                </div>
            @empty
                <div class="px-4 py-8 text-center text-xs text-gray-400">No eligible riders</div>
            @endforelse
        </div>
    </div>

    {{-- Offer status --}}
    @if($this->existingOffers->count() > 0)
    <div class="bg-white ops-r2 border border-gray-100 shadow-sm overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h4 class="text-xs font-bold text-gray-900">Broadcast Status</h4>
            <button wire:click="expireOffers"
                wire:confirm="Expire all pending offers and reset to pending?"
                class="text-xs font-bold text-red-500 hover:text-red-700 transition">
                Expire All
            </button>
        </div>
        <div class="divide-y divide-gray-50 ops-scroll" style="max-height:144px; overflow-y:auto;">
            @foreach($this->existingOffers as $offer)
                <div class="px-4 py-2 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full flex-shrink-0
                            {{ $offer->status === 'accepted'                        ? 'bg-green-500' : '' }}
                            {{ $offer->status === 'pending'                         ? 'bg-amber-400 animate-pulse' : '' }}
                            {{ $offer->status === 'rejected'                        ? 'bg-red-400' : '' }}
                            {{ in_array($offer->status, ['expired','cancelled'])    ? 'bg-gray-300' : '' }}
                        "></span>
                        <span class="text-xs font-medium text-gray-800">{{ $offer->rider?->user?->name ?? '?' }}</span>
                    </div>
                    <span class="text-xs capitalize
                        {{ $offer->status === 'accepted'                     ? 'text-green-600 font-semibold' : '' }}
                        {{ $offer->status === 'pending'                      ? 'text-amber-600 font-semibold' : '' }}
                        {{ $offer->status === 'rejected'                     ? 'text-red-500' : '' }}
                        {{ in_array($offer->status, ['expired','cancelled']) ? 'text-gray-400' : '' }}
                    ">{{ $offer->status }}</span>
                </div>
            @endforeach
        </div>
    </div>
    @endif

    {{-- Broadcasting banner --}}
    @if($isBroadcasting && $broadcastRecipientCount > 0)
    <div class="ops-bcast-banner">
        <div class="flex items-start gap-3">
            <div style="border-radius:.75rem;background:rgba(255,255,255,.2);padding:.5rem;flex-shrink:0;">
                <x-heroicon-s-signal class="w-4 h-4 text-white sos-pulse" />
            </div>
            <div>
                <p class="text-xs font-bold text-white">Broadcasting</p>
                <p class="text-xs mt-0.5" style="color:rgba(219,234,254,.85);">
                    Sent to <strong>{{ $broadcastRecipientCount }}</strong> rider(s) · expires in {{ $timeoutSeconds }}s
                </p>
            </div>
        </div>
    </div>
    @endif

</div>
