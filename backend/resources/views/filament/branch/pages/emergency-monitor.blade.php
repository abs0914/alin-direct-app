<x-filament-panels::page>

    {{-- ══ Stats Bar ══════════════════════════════════════════════════════ --}}
    <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="rounded-xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-950">
            <p class="text-3xl font-bold text-red-600 dark:text-red-400">{{ $this->activeAlerts->count() }}</p>
            <p class="mt-1 text-sm font-medium text-red-700 dark:text-red-300">Active Emergencies</p>
        </div>
        <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800 dark:bg-amber-950">
            <p class="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {{ $this->activeAlerts->where('status', 'responding')->count() }}
            </p>
            <p class="mt-1 text-sm font-medium text-amber-700 dark:text-amber-300">Being Responded To</p>
        </div>
        <div class="rounded-xl border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950">
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">{{ $this->onlineRiderCount }}</p>
            <p class="mt-1 text-sm font-medium text-green-700 dark:text-green-300">Online Riders</p>
        </div>
    </div>

    {{-- ══ Active Alerts ═══════════════════════════════════════════════════ --}}
    <div class="mb-8">
        <h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <x-heroicon-o-exclamation-triangle class="h-5 w-5 text-red-500" />
            Active Emergency Alerts
            @if($this->activeAlerts->count() > 0)
                <span class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white animate-pulse">
                    {{ $this->activeAlerts->count() }}
                </span>
            @endif
        </h2>

        @forelse($this->activeAlerts as $alert)
            <div class="rounded-xl border-2 p-5
                {{ $alert->status === 'active'
                    ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950'
                    : 'border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950' }}">

                <div class="flex items-start justify-between gap-4">
                    {{-- Left: Rider info --}}
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold
                                {{ $alert->status === 'active'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' }}">
                                {{ strtoupper($alert->status) }}
                            </span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">
                                Alert #{{ $alert->id }} &bull; {{ $alert->created_at->diffForHumans() }}
                            </span>
                        </div>

                        <p class="text-base font-bold text-gray-900 dark:text-white">
                            🆘 {{ $alert->rider->user->name ?? 'Unknown Rider' }}
                            <span class="text-sm font-normal text-gray-500">(Rider #{{ $alert->rider_id }})</span>
                        </p>

                        @if($alert->notes)
                            <p class="mt-1 text-sm text-gray-600 dark:text-gray-300 italic">"{{ $alert->notes }}"</p>
                        @endif

                        @if($alert->lat && $alert->lng)
                            <a href="https://maps.google.com/?q={{ $alert->lat }},{{ $alert->lng }}"
                               target="_blank"
                               class="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 underline dark:text-blue-400">
                                <x-heroicon-o-map-pin class="h-3 w-3" />
                                View on Google Maps ({{ number_format($alert->lat, 5) }}, {{ number_format($alert->lng, 5) }})
                            </a>
                        @endif

                        @if($alert->status === 'responding' && $alert->respondedByRider)
                            <p class="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                                <x-heroicon-o-user class="inline h-4 w-4" />
                                Responder: {{ $alert->respondedByRider->user->name ?? 'Unknown' }}
                                (Rider #{{ $alert->responded_by_rider_id }})
                            </p>
                        @endif

                        @if($alert->emergencyJob)
                            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Emergency Job: #{{ $alert->emergencyJob->id }}
                                &bull; Status: {{ $alert->emergencyJob->status }}
                            </p>
                        @endif
                    </div>

                    {{-- Right: Actions --}}
                    <div class="flex flex-col gap-2 shrink-0">
                        <button
                            wire:click="resolveAlert({{ $alert->id }})"
                            wire:confirm="Mark Alert #{{ $alert->id }} as RESOLVED?"
                            class="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors">
                            <x-heroicon-o-check-circle class="h-4 w-4" />
                            Resolve
                        </button>
                        @if($alert->status === 'active')
                            <button
                                wire:click="cancelAlert({{ $alert->id }})"
                                wire:confirm="Cancel Alert #{{ $alert->id }} as false alarm?"
                                class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                                <x-heroicon-o-x-circle class="h-4 w-4" />
                                False Alarm
                            </button>
                        @endif
                    </div>
                </div>
            </div>
        @empty
            <div class="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center dark:border-gray-700 dark:bg-gray-900">
                <x-heroicon-o-shield-check class="mx-auto h-12 w-12 text-green-400 mb-3" />
                <p class="font-medium text-gray-500 dark:text-gray-400">No active emergencies — all clear.</p>
            </div>
        @endforelse
    </div>

    {{-- ══ Recently Resolved ═══════════════════════════════════════════════ --}}
    <div>
        <h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <x-heroicon-o-clock class="h-5 w-5 text-gray-400" />
            Recently Resolved (Last 8 Hours)
        </h2>

        @if($this->recentlyResolved->isEmpty())
            <p class="text-sm text-gray-400 dark:text-gray-500">No resolved emergencies in the last 8 hours.</p>
        @else
            <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">#</th>
                            <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Rider</th>
                            <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Responder</th>
                            <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                            <th class="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Resolved</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                        @foreach($this->recentlyResolved as $alert)
                            <tr class="bg-white dark:bg-gray-900">
                                <td class="px-4 py-3 text-gray-500">{{ $alert->id }}</td>
                                <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                    {{ $alert->rider->user->name ?? "Rider #{$alert->rider_id}" }}
                                </td>
                                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                                    {{ $alert->respondedByRider?->user?->name ?? '—' }}
                                </td>
                                <td class="px-4 py-3">
                                    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold
                                        {{ $alert->status === 'resolved'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' }}">
                                        {{ ucfirst($alert->status) }}
                                    </span>
                                </td>
                                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                                    {{ $alert->resolved_at?->diffForHumans() ?? '—' }}
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </div>

</x-filament-panels::page>

