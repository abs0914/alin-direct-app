@php
    $categories = \App\Models\ServiceCategory::where('is_active', true)
        ->with(['services' => fn($q) => $q->where('is_active', true)->orderBy('sort_order')])
        ->orderBy('sort_order')
        ->get();

    $selectedServiceId = (int) ($getState() ?? 0);
@endphp

<div class="space-y-3">
    @foreach($categories as $category)
        @if($category->services->count() > 0)
            <div x-data="{ open: false }" class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {{-- Category Header (clickable toggle) --}}
                <button
                    type="button"
                    x-on:click="open = ! open"
                    class="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <span
                        class="inline-flex items-center justify-center w-7 h-7 rounded-md shrink-0"
                        style="background-color: {{ $category->color }}20;"
                    >
                        @if($category->logo)
                            <img
                                src="{{ asset($category->logo) }}"
                                alt="{{ $category->name }} logo"
                                class="w-5 h-5 object-contain"
                            >
                        @elseif($category->icon)
                            <x-dynamic-component
                                :component="$category->icon"
                                class="w-4 h-4"
                                style="color: {{ $category->color }};"
                            />
                        @endif
                    </span>
                    <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex-1">
                        {{ $category->name }}
                    </h3>
                    {{-- Chevron --}}
                    <svg
                        class="w-4 h-4 text-gray-400 transition-transform duration-200"
                        :class="{ 'rotate-180': open }"
                        fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                    >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>

                {{-- Service Cards Grid (collapsible) --}}
                <div
                    x-show="open"
                    x-transition:enter="transition ease-out duration-200"
                    x-transition:enter-start="opacity-0 -translate-y-1"
                    x-transition:enter-end="opacity-100 translate-y-0"
                    x-transition:leave="transition ease-in duration-150"
                    x-transition:leave-start="opacity-100 translate-y-0"
                    x-transition:leave-end="opacity-0 -translate-y-1"
                >
                    <div class="grid grid-cols-2 gap-2 px-3 pb-3">
                        @foreach($category->services as $service)
                            <button
                                type="button"
                                x-on:click="$wire.set(@js($getStatePath()), {{ $service->id }})"
                                @class([
                                    'relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-150 cursor-pointer text-center min-h-[60px]',
                                    'border-primary-500 bg-primary-100 text-primary-900 shadow-sm' => $selectedServiceId === $service->id,
                                    'border-gray-200 hover:border-gray-300 hover:shadow-sm text-gray-700' => $selectedServiceId !== $service->id,
                                ])
                            >
                                {{-- Category color dot --}}
                                <span
                                    class="w-2.5 h-2.5 rounded-full mb-1.5 shrink-0"
                                    style="background-color: {{ $category->color }};"
                                ></span>

                                {{-- Service name --}}
                                <span class="text-xs font-medium leading-tight">
                                    {{ $service->name }}
                                </span>
                            </button>
                        @endforeach
                    </div>
                </div>
            </div>
        @endif
    @endforeach

    {{-- Validation message --}}
    @error($getStatePath())
        <p class="text-sm text-danger-600 dark:text-danger-400">{{ $message }}</p>
    @enderror
</div>

