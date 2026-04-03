<x-filament-panels::page>

{{-- ══ Styles ════════════════════════════════════════════════════════════════ --}}
@push('styles')
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
    /* ── Stat cards ─────────────────────────────────────────── */
    .ops-stat { position:relative; overflow:hidden; border-radius:1rem; padding:1rem;
        box-shadow:0 4px 12px -2px rgba(0,0,0,.14); color:#fff;
        transition:transform .2s ease, box-shadow .2s ease; }
    .ops-stat:hover { transform:translateY(-2px); box-shadow:0 8px 24px -4px rgba(0,0,0,.18); }
    .ops-stat-bg { position:absolute; bottom:-1.25rem; right:-1.25rem; width:5rem; height:5rem;
        border-radius:50%; background:rgba(255,255,255,.12); pointer-events:none; }
    .ops-stat-icon { border-radius:.75rem; background:rgba(255,255,255,.22); padding:.625rem;
        display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .ops-stat-num { font-size:2rem; font-weight:900; line-height:1; font-variant-numeric:tabular-nums; }
    .ops-stat-lbl { font-size:.65rem; font-weight:700; color:rgba(255,255,255,.7);
        margin-top:.4rem; text-transform:uppercase; letter-spacing:.12em; }
    .ops-sos-on   { background:linear-gradient(135deg,#ef4444,#be123c); }
    .ops-sos-off  { background:linear-gradient(135deg,#374151,#1f2937); }
    .ops-riders   { background:linear-gradient(135deg,#10b981,#0f766e); }
    .ops-pending  { background:linear-gradient(135deg,#f59e0b,#ea580c); }
    .ops-bcast-on { background:linear-gradient(135deg,#3b82f6,#4338ca); }
    .ops-bcast-off{ background:linear-gradient(135deg,#475569,#1e293b); }

    /* ── Panel section headers ──────────────────────────────── */
    .ops-hdr-red   { background:linear-gradient(to right,#fef2f2,#fff1f2); border-bottom:1px solid #fecaca; }
    .ops-hdr-amber { background:linear-gradient(to right,#fffbeb,#fff7ed); border-bottom:1px solid #fde68a; }
    .ops-ico-wrap-red   { border-radius:.5rem; padding:.375rem; background:#fee2e2; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .ops-ico-wrap-amber { border-radius:.5rem; padding:.375rem; background:#fef3c7; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

    /* ── List rows ──────────────────────────────────────────── */
    .ops-row { transition:background .12s ease; }
    .ops-sel-red   { background:#fef2f2 !important; border-left:3px solid #ef4444; }
    .ops-sel-amber { background:#fffbeb !important; border-left:3px solid #f59e0b; }
    .ops-unsel     { border-left:3px solid transparent; }

    /* ── Map panel ──────────────────────────────────────────── */
    #ops-map { height:100%; width:100%; z-index:0; }
    .ops-map-bar { background:#fff; border-bottom:1px solid #f3f4f6; padding:.625rem 1rem;
        display:flex; align-items:center; gap:.625rem; flex-shrink:0; }
    .ops-live-dot { width:.5rem; height:.5rem; border-radius:50%; background:#10b981;
        animation:ops-pulse 2s cubic-bezier(.4,0,.6,1) infinite; }
    @keyframes ops-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

    /* ── Scrollbar ──────────────────────────────────────────── */
    .ops-scroll::-webkit-scrollbar { width:4px; }
    .ops-scroll::-webkit-scrollbar-track { background:transparent; }
    .ops-scroll::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:2px; }

    /* ── Rounded 2xl ────────────────────────────────────────── */
    .ops-r2 { border-radius:1rem; }

    /* ── SOS badge pulse ────────────────────────────────────── */
    .sos-pulse { animation:sos-blink 1s infinite; }
    @keyframes sos-blink { 0%,100%{opacity:1} 50%{opacity:.25} }

    /* ── Rider marker ───────────────────────────────────────── */
    .rider-marker { font-size:1.4rem; line-height:1; }
</style>
@endpush

{{-- ══ Stats Bar ════════════════════════════════════════════════════════════ --}}
@php $broadcastCount = $this->pendingJobs->where('status','broadcasting')->count(); @endphp
<div style="display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.25rem;">

    <div class="ops-stat {{ $this->activeAlerts->count() > 0 ? 'ops-sos-on' : 'ops-sos-off' }}">
        <div class="flex items-start justify-between">
            <div>
                <p class="ops-stat-num">{{ $this->activeAlerts->count() }}</p>
                <p class="ops-stat-lbl">Active SOS</p>
            </div>
            <div class="ops-stat-icon">
                <x-heroicon-s-exclamation-triangle class="w-5 h-5 text-white {{ $this->activeAlerts->count() > 0 ? 'sos-pulse' : '' }}" />
            </div>
        </div>
        <div class="ops-stat-bg"></div>
    </div>

    <div class="ops-stat ops-riders">
        <div class="flex items-start justify-between">
            <div>
                <p class="ops-stat-num">{{ $this->onlineRiderCount }}</p>
                <p class="ops-stat-lbl">Online Riders</p>
            </div>
            <div class="ops-stat-icon">
                <x-heroicon-s-user class="w-5 h-5 text-white" />
            </div>
        </div>
        <div class="ops-stat-bg"></div>
    </div>

    <div class="ops-stat ops-pending">
        <div class="flex items-start justify-between">
            <div>
                <p class="ops-stat-num">{{ $this->pendingJobs->count() }}</p>
                <p class="ops-stat-lbl">Pending Jobs</p>
            </div>
            <div class="ops-stat-icon">
                <x-heroicon-o-clock class="w-5 h-5 text-white" />
            </div>
        </div>
        <div class="ops-stat-bg"></div>
    </div>

    <div class="ops-stat {{ $broadcastCount > 0 ? 'ops-bcast-on' : 'ops-bcast-off' }}">
        <div class="flex items-start justify-between">
            <div>
                <p class="ops-stat-num">{{ $broadcastCount }}</p>
                <p class="ops-stat-lbl">Broadcasting</p>
            </div>
            <div class="ops-stat-icon">
                <x-heroicon-s-signal class="w-5 h-5 text-white {{ $broadcastCount > 0 ? 'sos-pulse' : '' }}" />
            </div>
        </div>
        <div class="ops-stat-bg"></div>
    </div>

</div>

{{-- ══ Main 3-panel layout ══════════════════════════════════════════════════ --}}
<div class="flex gap-4" style="height: calc(100vh - 20rem); min-height: 500px;">

    {{-- ── LEFT SIDEBAR ────────────────────────────────────────────────── --}}
    <div class="w-72 flex-shrink-0 flex flex-col gap-3">

        {{-- Emergency Alerts --}}
        <div class="bg-white ops-r2 border border-gray-100 shadow-sm flex flex-col overflow-hidden" style="max-height:45%;">
            <div class="px-4 py-3 flex items-center gap-2 flex-shrink-0 ops-hdr-red">
                <div class="ops-ico-wrap-red">
                    <x-heroicon-s-exclamation-triangle class="w-3.5 h-3.5 text-red-600" />
                </div>
                <h3 class="text-sm font-bold text-gray-900">Emergencies</h3>
                @if($this->activeAlerts->count() > 0)
                    <span class="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white sos-pulse">
                        {{ $this->activeAlerts->count() }}
                    </span>
                @endif
            </div>
            <div class="overflow-y-auto ops-scroll flex-1">
                @forelse($this->activeAlerts as $alert)
                    <button wire:click="selectAlert({{ $alert->id }})"
                        class="ops-row w-full text-left px-4 py-3
                            {{ $selectedAlertId == $alert->id ? 'ops-sel-red' : 'ops-unsel hover:bg-red-50' }}">
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full flex-shrink-0 {{ $alert->status === 'active' ? 'bg-red-500 sos-pulse' : 'bg-amber-400' }}"></span>
                            <span class="text-xs font-bold uppercase {{ $alert->status === 'active' ? 'text-red-600' : 'text-amber-600' }}">{{ $alert->status }}</span>
                            <span class="text-xs text-gray-400 ml-auto font-mono">#{{ $alert->id }}</span>
                        </div>
                        <p class="text-sm font-semibold text-gray-900 mt-1 truncate">{{ $alert->rider?->user?->name ?? 'Unknown Rider' }}</p>
                        <p class="text-xs text-gray-400 mt-0.5">{{ $alert->created_at->diffForHumans() }}</p>
                    </button>
                @empty
                    <div class="px-4 py-6 text-center">
                        <x-heroicon-o-shield-check class="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <p class="text-xs font-semibold text-gray-500">All clear</p>
                        <p class="text-xs text-gray-400 mt-0.5">No active SOS alerts</p>
                    </div>
                @endforelse
            </div>
        </div>

        {{-- Pending Jobs --}}
        <div class="bg-white ops-r2 border border-gray-100 shadow-sm flex flex-col overflow-hidden flex-1">
            <div class="px-4 py-3 flex items-center gap-2 flex-shrink-0 ops-hdr-amber">
                <div class="ops-ico-wrap-amber">
                    <x-heroicon-o-clock class="w-3.5 h-3.5 text-amber-600" />
                </div>
                <h3 class="text-sm font-bold text-gray-900">Pending Jobs</h3>
                <span class="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 px-1.5 text-xs font-bold">
                    {{ $this->pendingJobs->count() }}
                </span>
            </div>
            <div class="overflow-y-auto ops-scroll flex-1">
                @forelse($this->pendingJobs as $job)
                    <button wire:click="selectJob({{ $job->id }})"
                        class="ops-row w-full text-left px-4 py-3
                            {{ $selectedJobId == $job->id ? 'ops-sel-amber' : 'ops-unsel hover:bg-amber-50' }}">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs font-mono font-semibold text-gray-600">#{{ Str::limit($job->tracking_uuid, 8, '') }}</span>
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                                {{ $job->status === 'broadcasting' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700' }}">
                                {{ ucfirst($job->status) }}
                            </span>
                        </div>
                        <p class="text-xs text-gray-700 font-medium truncate">{{ $job->pickup_address ?? 'No pickup' }}</p>
                        <p class="text-xs text-gray-400 truncate mt-0.5">→ {{ $job->dropoff_address ?? 'No dropoff' }}</p>
                        @if($job->total_price)
                            <p class="text-sm font-bold text-amber-600 mt-1">₱{{ number_format($job->total_price, 2) }}</p>
                        @endif
                    </button>
                @empty
                    <div class="px-4 py-10 text-center">
                        <x-heroicon-o-inbox class="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p class="text-xs text-gray-400">No pending jobs</p>
                    </div>
                @endforelse
            </div>
        </div>

    </div>{{-- /LEFT SIDEBAR --}}

    {{-- ── CENTER MAP ───────────────────────────────────────────────────── --}}
    <div class="flex-1 flex flex-col ops-r2 overflow-hidden border border-gray-100 shadow-sm">
        <div class="ops-map-bar">
            <div class="ops-live-dot"></div>
            <span class="text-xs font-bold text-gray-700">Live Map</span>
            <div style="width:1px;height:14px;background:#e5e7eb;margin:0 4px;"></div>
            <span class="text-xs text-gray-400">Manila, Philippines</span>
            <span class="text-xs text-gray-400 ml-auto flex items-center gap-1">
                <x-heroicon-o-arrow-path class="w-3 h-3" />
                Auto-refreshes every 15s
            </span>
        </div>
        {{-- Data bridge — OUTSIDE wire:ignore so Livewire keeps it fresh on every poll --}}
        <div id="map-data"
            data-riders="{{ $this->ridersJson() }}"
            data-alerts="{{ $this->alertsJson() }}"
            wire:poll.15000ms
            class="hidden">
        </div>
        {{-- Map container — wire:ignore prevents Livewire from destroying the Leaflet instance --}}
        <div class="flex-1" wire:ignore>
            <div id="ops-map"></div>
        </div>
    </div>

    {{-- ── RIGHT PANEL (context) ────────────────────────────────────────── --}}
    @if($activePanel === 'job' && $this->selectedJob)
        @include('filament.branch.pages.partials.ops-map-dispatch-panel')
    @elseif($activePanel === 'alert' && $this->selectedAlert)
        @include('filament.branch.pages.partials.ops-map-alert-panel')
    @else
        <div class="w-80 flex-shrink-0 flex items-center justify-center ops-r2 border border-dashed border-gray-200"
            style="background:linear-gradient(135deg,#f9fafb,#f1f5f9);">
            <div class="text-center px-8">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 mb-4">
                    <x-heroicon-o-cursor-arrow-rays class="w-8 h-8 text-gray-300" />
                </div>
                <p class="text-sm font-semibold text-gray-500">Select a job or emergency</p>
                <p class="text-xs text-gray-400 mt-1">Click an item on the left<br>or a marker on the map</p>
            </div>
        </div>
    @endif

</div>{{-- /3-panel --}}

{{-- ══ Leaflet JS ═══════════════════════════════════════════════════════════ --}}
@push('scripts')
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
    let map = null;
    let riderMarkers = {};
    let alertMarkers = {};

    const BRANCH_LAT = 14.5995, BRANCH_LNG = 120.9842;

    function makeIcon(emoji, extraClass = '') {
        return L.divIcon({
            html: `<div class="rider-marker ${extraClass}">${emoji}</div>`,
            iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14],
            className: ''
        });
    }

    function riderIcon(availability) {
        if (availability === 'online')  return makeIcon('🟢');
        if (availability === 'on_job')  return makeIcon('🟠');
        return makeIcon('⚫');
    }

    function initMap() {
        if (map) return;
        map = L.map('ops-map', { zoomControl: true, attributionControl: true })
               .setView([BRANCH_LAT, BRANCH_LNG], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);
        L.marker([BRANCH_LAT, BRANCH_LNG], { icon: makeIcon('🏢') })
          .addTo(map).bindPopup('<b>Branch HQ</b>');
        updateMarkersFromDOM();
    }

    function updateMarkersFromDOM() {
        const el = document.getElementById('map-data');
        if (!el || !map) return;
        const riders = JSON.parse(el.dataset.riders || '[]');
        const alerts = JSON.parse(el.dataset.alerts || '[]');
        updateRiderMarkers(riders);
        updateAlertMarkers(alerts);
    }

    function updateRiderMarkers(riders) {
        const seen = new Set();
        riders.forEach(r => {
            if (r.lat == null || r.lng == null) return;
            seen.add(r.id);
            const popup = `<b>${r.name}</b><br>${r.vehicle ?? ''}<br>
                <span style="color:${r.availability==='online'?'#10b981':r.availability==='on_job'?'#f59e0b':'#9ca3af'}">
                    ${r.availability}</span><br>
                ${r.last_seen ? 'Seen: ' + r.last_seen : ''}<br>
                ${r.rating ? '★ ' + r.rating.toFixed(1) : ''}`;
            if (riderMarkers[r.id]) {
                riderMarkers[r.id].setLatLng([r.lat, r.lng])
                    .setIcon(riderIcon(r.availability))
                    .setPopupContent(popup);
            } else {
                riderMarkers[r.id] = L.marker([r.lat, r.lng], { icon: riderIcon(r.availability) })
                    .addTo(map).bindPopup(popup);
            }
        });
        Object.keys(riderMarkers).forEach(id => {
            if (!seen.has(Number(id))) { map.removeLayer(riderMarkers[id]); delete riderMarkers[id]; }
        });
    }

    function updateAlertMarkers(alerts) {
        const seen = new Set();
        alerts.forEach(a => {
            if (a.lat == null || a.lng == null) return;
            seen.add(a.id);
            const popup = `<b>🆘 SOS — ${a.rider}</b><br>Status: ${a.status}<br>${a.ago}${a.notes ? '<br><i>' + a.notes + '</i>' : ''}`;
            if (alertMarkers[a.id]) {
                alertMarkers[a.id].setLatLng([a.lat, a.lng]).setPopupContent(popup);
            } else {
                alertMarkers[a.id] = L.marker([a.lat, a.lng], { icon: makeIcon('🆘', 'sos-pulse') })
                    .addTo(map).bindPopup(popup);
            }
        });
        Object.keys(alertMarkers).forEach(id => {
            if (!seen.has(Number(id))) { map.removeLayer(alertMarkers[id]); delete alertMarkers[id]; }
        });
    }

    document.addEventListener('DOMContentLoaded', initMap);
    document.addEventListener('livewire:updated', updateMarkersFromDOM);
})();
</script>
@endpush

</x-filament-panels::page>
