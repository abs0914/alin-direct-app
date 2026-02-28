<x-filament-panels::page>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

        {{-- LEFT: Job Selection --}}
        <div class="md:col-span-1 space-y-4">
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div class="p-4 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900">Select Delivery Job</h3>
                    <p class="text-xs text-gray-500 mt-1">Pending &amp; broadcasting jobs in your branch</p>
                </div>
                <div class="divide-y divide-gray-100 max-h-[28rem] overflow-y-auto">
                    @forelse($this->pendingJobs as $job)
                    <button wire:click="$set('selectedJobId', {{ $job->id }})"
                        class="w-full text-left px-4 py-3 hover:bg-amber-50 transition
                            {{ $selectedJobId == $job->id ? 'bg-amber-50 border-l-4 border-amber-500' : '' }}">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-mono font-medium text-gray-900">
                                #{{ Str::limit($job->tracking_uuid, 8, '') }}
                            </span>
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                {{ $job->status === 'broadcasting' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700' }}">
                                {{ ucfirst($job->status) }}
                            </span>
                        </div>
                        <div class="text-xs text-gray-500 mt-1 truncate">{{ $job->pickup_address ?? 'No pickup' }}</div>
                        <div class="text-xs text-gray-400 truncate">→ {{ $job->dropoff_address ?? 'No dropoff' }}</div>
                        <div class="flex items-center gap-2 mt-1">
                            @if($job->vehicle_type)
                            <span class="text-xs text-gray-400 capitalize">{{ $job->vehicle_type }}</span>
                            @endif
                            @if($job->total_price)
                            <span class="text-xs font-medium text-amber-600">₱{{ number_format($job->total_price, 2) }}</span>
                            @endif
                        </div>
                    </button>
                    @empty
                    <div class="px-4 py-8 text-center text-sm text-gray-400">
                        No pending jobs in your branch
                    </div>
                    @endforelse
                </div>
            </div>
        </div>

        {{-- RIGHT: Filters + Rider List + Actions --}}
        <div class="md:col-span-2 space-y-4">

            {{-- Selected Job Summary --}}
            @if($this->selectedJob)
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div class="flex items-start justify-between">
                    <div>
                        <h3 class="text-base font-semibold text-gray-900">
                            Job #{{ Str::limit($this->selectedJob->tracking_uuid, 12, '…') }}
                        </h3>
                        <div class="text-sm text-gray-600 mt-1">
                            <span class="font-medium">Pickup:</span> {{ $this->selectedJob->pickup_address ?? '—' }}
                        </div>
                        <div class="text-sm text-gray-600">
                            <span class="font-medium">Dropoff:</span> {{ $this->selectedJob->dropoff_address ?? '—' }}
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                            {{ $this->selectedJob->status === 'broadcasting' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700' }}">
                            {{ ucfirst($this->selectedJob->status) }}
                        </span>
                        @if($this->selectedJob->total_price)
                        <div class="text-lg font-bold text-amber-600 mt-1">₱{{ number_format($this->selectedJob->total_price, 2) }}</div>
                        @endif
                    </div>
                </div>
            </div>
            @else
            <div class="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:48px;height:48px;" class="text-gray-300 mx-auto">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <p class="text-sm text-gray-500 mt-2">Select a delivery job from the left panel to begin broadcasting</p>
            </div>
            @endif

            {{-- Filters --}}
            @if($this->selectedJob)
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <h4 class="text-sm font-semibold text-gray-700 mb-3">Filter Riders</h4>
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">Vehicle Type</label>
                        <select wire:model.live="vehicleTypeFilter"
                            class="w-full rounded-lg border-gray-300 text-sm focus:border-amber-500 focus:ring-amber-500">
                            <option value="">All Types</option>
                            <option value="motorcycle">Motorcycle</option>
                            <option value="mpv">MPV</option>
                            <option value="van">Van</option>
                            <option value="truck">Truck</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">Status</label>
                        <select wire:model.live="onlineFilter"
                            class="w-full rounded-lg border-gray-300 text-sm focus:border-amber-500 focus:ring-amber-500">
                            <option value="online">Online Only</option>
                            <option value="all">All Approved</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">Timeout (sec)</label>
                        <input type="number" wire:model.live="timeoutSeconds" min="15" max="300" step="15"
                            class="w-full rounded-lg border-gray-300 text-sm focus:border-amber-500 focus:ring-amber-500" />
                    </div>
                    <div class="flex items-end gap-2">
                        <button wire:click="selectAllRiders"
                            class="flex-1 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition">
                            Select All
                        </button>
                        <button wire:click="deselectAllRiders"
                            class="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition">
                            Clear
                        </button>
                    </div>
                </div>
            </div>
            @endif

            {{-- Eligible Riders Table --}}
            @if($this->selectedJob)
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h4 class="text-sm font-semibold text-gray-900">
                            Eligible Riders
                            <span class="text-gray-400 font-normal">({{ $this->eligibleRiders->count() }})</span>
                        </h4>
                        @if(count($selectedRiderIds) > 0)
                        <p class="text-xs text-amber-600 mt-0.5">{{ count($selectedRiderIds) }} selected</p>
                        @endif
                    </div>
                    <button wire:click="broadcastToRiders"
                        @if(empty($selectedRiderIds)) disabled @endif
                        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition
                            {{ empty($selectedRiderIds) ? 'bg-gray-300 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 shadow-sm' }}">
                        <x-heroicon-s-signal class="w-4 h-4" />
                        Broadcast to Selected ({{ count($selectedRiderIds) }})
                    </button>
                </div>
                <div class="overflow-x-auto max-h-[22rem] overflow-y-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50 sticky top-0">
                            <tr>
                                <th class="px-4 py-2.5 text-left font-medium text-gray-600 w-10"></th>
                                <th class="px-4 py-2.5 text-left font-medium text-gray-600">Rider</th>
                                <th class="px-4 py-2.5 text-left font-medium text-gray-600">Phone</th>
                                <th class="px-4 py-2.5 text-left font-medium text-gray-600">Vehicle</th>
                                <th class="px-4 py-2.5 text-center font-medium text-gray-600">Status</th>
                                <th class="px-4 py-2.5 text-right font-medium text-gray-600">Rating</th>
                                <th class="px-4 py-2.5 text-right font-medium text-gray-600">Deliveries</th>
                                <th class="px-4 py-2.5 text-center font-medium text-gray-600">Assign</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            @forelse($this->eligibleRiders as $rider)
                            <tr class="hover:bg-gray-50 {{ in_array($rider->id, $selectedRiderIds) ? 'bg-amber-50' : '' }}">
                                <td class="px-4 py-2.5">
                                    <input type="checkbox" wire:click="toggleRider({{ $rider->id }})"
                                        {{ in_array($rider->id, $selectedRiderIds) ? 'checked' : '' }}
                                        class="rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
                                </td>
                                <td class="px-4 py-2.5 text-gray-900 font-medium">{{ $rider->user?->name ?? 'N/A' }}</td>
                                <td class="px-4 py-2.5 text-gray-600">{{ $rider->user?->phone ?? '—' }}</td>
                                <td class="px-4 py-2.5 text-gray-600 capitalize">{{ $rider->vehicle_type }}</td>
                                <td class="px-4 py-2.5 text-center">
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                                        {{ $rider->availability === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500' }}">
                                        <span class="w-1.5 h-1.5 rounded-full {{ $rider->availability === 'online' ? 'bg-green-500' : 'bg-gray-400' }}"></span>
                                        {{ ucfirst($rider->availability) }}
                                    </span>
                                </td>
                                <td class="px-4 py-2.5 text-right text-amber-600">
                                    {{ $rider->rating ? number_format($rider->rating, 1) . ' ★' : '—' }}
                                </td>
                                <td class="px-4 py-2.5 text-right text-gray-700 font-medium">{{ $rider->total_deliveries }}</td>
                                <td class="px-4 py-2.5 text-center">
                                    <button wire:click="manualAssign({{ $rider->id }})"
                                        wire:confirm="Manually assign this job to {{ $rider->user?->name }}? This will cancel all pending offers."
                                        class="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline">
                                        Assign
                                    </button>
                                </td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="8" class="px-4 py-8 text-center text-gray-400">
                                    No eligible riders match your filters
                                </td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
            @endif

            {{-- Broadcast Feedback / Existing Offers --}}
            @if($this->selectedJob && $this->existingOffers->count() > 0)
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h4 class="text-sm font-semibold text-gray-900">Broadcast Status</h4>
                        @if($broadcastedAt)
                        <p class="text-xs text-gray-500">Broadcasted at {{ $broadcastedAt }} · {{ $broadcastRecipientCount }} rider(s)</p>
                        @endif
                    </div>
                    <button wire:click="expireOffers"
                        wire:confirm="Expire all pending offers and reset job to pending?"
                        class="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition">
                        Expire All &amp; Reset
                    </button>
                </div>
                <div class="divide-y divide-gray-100">
                    @foreach($this->existingOffers as $offer)
                    <div class="px-4 py-3 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="w-2 h-2 rounded-full
                                {{ $offer->status === 'accepted' ? 'bg-green-500' : '' }}
                                {{ $offer->status === 'pending' ? 'bg-amber-400 animate-pulse' : '' }}
                                {{ $offer->status === 'rejected' ? 'bg-red-500' : '' }}
                                {{ $offer->status === 'expired' ? 'bg-gray-400' : '' }}
                                {{ $offer->status === 'cancelled' ? 'bg-gray-300' : '' }}
                            "></span>
                            <div>
                                <span class="text-sm font-medium text-gray-900">{{ $offer->rider?->user?->name ?? 'Unknown' }}</span>
                                <span class="text-xs text-gray-400 ml-2">{{ $offer->rider?->user?->phone }}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                {{ $offer->status === 'accepted' ? 'bg-green-100 text-green-700' : '' }}
                                {{ $offer->status === 'pending' ? 'bg-amber-100 text-amber-700' : '' }}
                                {{ $offer->status === 'rejected' ? 'bg-red-100 text-red-700' : '' }}
                                {{ $offer->status === 'expired' ? 'bg-gray-100 text-gray-600' : '' }}
                                {{ $offer->status === 'cancelled' ? 'bg-gray-100 text-gray-500' : '' }}
                            ">{{ ucfirst($offer->status) }}</span>
                            @if($offer->expires_at)
                            <span class="text-xs text-gray-400">
                                Exp: {{ $offer->expires_at->format('h:i:s A') }}
                            </span>
                            @endif
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>
            @endif

            {{-- Broadcast success banner --}}
            @if($isBroadcasting && $broadcastRecipientCount > 0)
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 mt-0.5">
                        <x-heroicon-s-signal class="w-5 h-5 text-blue-500 animate-pulse" />
                    </div>
                    <div>
                        <h4 class="text-sm font-semibold text-blue-800">Broadcasting Active</h4>
                        <p class="text-xs text-blue-600 mt-0.5">
                            {{ $broadcastRecipientCount }} rider(s) notified.
                            Offers expire after {{ $timeoutSeconds }} seconds.
                            If no rider accepts, use <strong>Expire All &amp; Reset</strong> above, then re-broadcast or manually assign.
                        </p>
                    </div>
                </div>
            </div>
            @endif

        </div>
    </div>
</x-filament-panels::page>

