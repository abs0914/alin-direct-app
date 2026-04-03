{{-- Alert right panel — shown when an active emergency is selected --}}
<style>
    .ops-alert-banner-active     { background:linear-gradient(135deg,#ef4444,#be123c); }
    .ops-alert-banner-responding { background:linear-gradient(135deg,#f59e0b,#ea580c); }
    .ops-resolve-btn { width:100%; display:inline-flex; align-items:center; justify-content:center;
        gap:.625rem; border-radius:1rem; padding:.875rem 1rem; font-size:.875rem; font-weight:700;
        color:#fff; transition:all .15s ease;
        background:linear-gradient(to right,#10b981,#0d9488); }
    .ops-resolve-btn:hover { background:linear-gradient(to right,#059669,#0f766e); }
    .ops-cancel-btn { width:100%; display:inline-flex; align-items:center; justify-content:center;
        gap:.625rem; border-radius:1rem; padding:.75rem 1rem; font-size:.875rem; font-weight:600;
        color:#4b5563; background:#fff; border:2px solid #e5e7eb; transition:all .15s ease; }
    .ops-cancel-btn:hover { background:#f9fafb; border-color:#d1d5db; }
    .ops-responder-card { background:linear-gradient(to right,#fffbeb,#fff7ed);
        border:1px solid #fde68a; border-radius:1rem; padding:.75rem 1rem; }
    .ops-gmaps-link { display:flex; align-items:center; gap:.5rem; border-radius:.75rem;
        background:#eff6ff; border:1px solid #bfdbfe; padding:.625rem .75rem;
        transition:background .15s ease; text-decoration:none; }
    .ops-gmaps-link:hover { background:#dbeafe; }
</style>

<div class="w-80 flex-shrink-0 flex flex-col gap-3 overflow-y-auto ops-scroll">

    {{-- Alert header --}}
    <div class="ops-r2 overflow-hidden shadow-sm"
        style="border:2px solid {{ $this->selectedAlert->status === 'active' ? '#fca5a5' : '#fcd34d' }};">

        {{-- Gradient banner --}}
        <div class="px-4 py-4 {{ $this->selectedAlert->status === 'active' ? 'ops-alert-banner-active' : 'ops-alert-banner-responding' }}">
            <div class="flex items-center gap-2 mb-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                    style="background:rgba(255,255,255,.2); text-transform:uppercase; letter-spacing:.08em;">
                    {{ $this->selectedAlert->status }}
                </span>
                <span class="text-xs text-white font-mono" style="opacity:.7;">Alert #{{ $this->selectedAlert->id }}</span>
                <span class="ml-auto text-xs text-white" style="opacity:.6;">{{ $this->selectedAlert->created_at->diffForHumans() }}</span>
            </div>
            <div class="flex items-center gap-3">
                <div style="width:2.5rem;height:2.5rem;border-radius:.75rem;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;">
                    🆘
                </div>
                <div class="min-w-0">
                    <p class="text-base font-bold text-white truncate">
                        {{ $this->selectedAlert->rider?->user?->name ?? 'Unknown Rider' }}
                    </p>
                    <p class="text-xs text-white" style="opacity:.7;">Rider #{{ $this->selectedAlert->rider_id }}</p>
                </div>
            </div>
        </div>

        {{-- Detail body --}}
        <div class="bg-white px-4 py-3 space-y-3">
            @if($this->selectedAlert->notes)
                <div class="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
                    <p class="text-xs font-semibold text-gray-400 uppercase mb-1" style="letter-spacing:.08em;">Notes</p>
                    <p class="text-xs text-gray-700 italic">"{{ $this->selectedAlert->notes }}"</p>
                </div>
            @endif

            @if($this->selectedAlert->lat && $this->selectedAlert->lng)
                <a href="https://maps.google.com/?q={{ $this->selectedAlert->lat }},{{ $this->selectedAlert->lng }}"
                   target="_blank"
                   class="ops-gmaps-link">
                    <x-heroicon-o-map-pin class="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span class="text-xs font-semibold text-blue-600 flex-1">Open in Google Maps</span>
                    <svg class="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
            @endif
        </div>
    </div>

    {{-- Responder info --}}
    @if($this->selectedAlert->status === 'responding' && $this->selectedAlert->respondedByRider)
        <div class="ops-responder-card flex items-center gap-3">
            <div style="width:2rem;height:2rem;border-radius:.75rem;background:#fef3c7;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <x-heroicon-s-user class="w-4 h-4 text-amber-600" />
            </div>
            <div>
                <p class="text-xs font-bold text-amber-800" style="text-transform:uppercase;letter-spacing:.06em;">Responder En Route</p>
                <p class="text-xs font-semibold text-amber-700 mt-0.5">{{ $this->selectedAlert->respondedByRider->user?->name ?? 'Unknown' }}</p>
            </div>
            <div class="ml-auto w-2 h-2 rounded-full bg-amber-500 sos-pulse"></div>
        </div>
    @endif

    {{-- Emergency job info --}}
    @if($this->selectedAlert->emergencyJob)
        <div class="bg-white ops-r2 border border-gray-100 shadow-sm px-4 py-3">
            <p class="text-xs font-bold text-gray-400 uppercase mb-2" style="letter-spacing:.1em;">Emergency Job</p>
            <div class="flex items-center justify-between">
                <span class="text-xs font-mono font-bold text-gray-700">Job #{{ $this->selectedAlert->emergencyJob->id }}</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 capitalize">
                    {{ $this->selectedAlert->emergencyJob->status }}
                </span>
            </div>
        </div>
    @endif

    {{-- Actions --}}
    <div class="flex flex-col gap-2">
        <button
            wire:click="resolveAlert({{ $this->selectedAlert->id }})"
            wire:confirm="Mark Alert #{{ $this->selectedAlert->id }} as RESOLVED?"
            class="ops-resolve-btn">
            <x-heroicon-o-check-circle class="h-5 w-5" />
            Mark as Resolved
        </button>

        @if($this->selectedAlert->status === 'active')
            <button
                wire:click="cancelAlert({{ $this->selectedAlert->id }})"
                wire:confirm="Cancel Alert #{{ $this->selectedAlert->id }} as a false alarm?"
                class="ops-cancel-btn">
                <x-heroicon-o-x-circle class="h-5 w-5 text-gray-400" />
                False Alarm — Cancel
            </button>
        @endif
    </div>

    {{-- Recently resolved (last 8h) --}}
    @if($this->recentlyResolved->isNotEmpty())
        <div class="bg-white ops-r2 border border-gray-100 shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-50" style="background:#f9fafb;">
                <h4 class="text-xs font-bold text-gray-400 uppercase" style="letter-spacing:.1em;">Resolved (last 8h)</h4>
            </div>
            <div class="divide-y divide-gray-50 ops-scroll" style="max-height:176px; overflow-y:auto;">
                @foreach($this->recentlyResolved as $r)
                    <div class="px-4 py-2 flex items-center justify-between">
                        <div>
                            <p class="text-xs font-semibold text-gray-800">{{ $r->rider?->user?->name ?? "Rider #{$r->rider_id}" }}</p>
                            <p class="text-xs text-gray-400 mt-0.5">{{ $r->resolved_at?->diffForHumans() ?? '—' }}</p>
                        </div>
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                            {{ $r->status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500' }}">
                            {{ ucfirst($r->status) }}
                        </span>
                    </div>
                @endforeach
            </div>
        </div>
    @endif

</div>
