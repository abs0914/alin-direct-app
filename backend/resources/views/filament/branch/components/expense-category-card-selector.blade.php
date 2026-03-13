@php
    $categories = \App\Filament\Branch\Resources\ExpenseResource::getCategoryMeta();
    $selectedCategory = (string) ($getState() ?? '');
@endphp

<div class="space-y-3">
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        @foreach($categories as $value => $category)
            <button
                type="button"
                x-on:click="$wire.set(@js($getStatePath()), @js($value))"
                @class([
                    'flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all duration-150',
                    'border-primary-500 bg-primary-100 text-primary-900 shadow-sm' => $selectedCategory === $value,
                    'border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-600' => $selectedCategory !== $value,
                ])
            >
                <span
                    class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                    style="background-color: {{ $category['color'] }}20;"
                >
                    <x-dynamic-component
                        :component="$category['icon']"
                        class="h-5 w-5"
                        style="color: {{ $category['color'] }};"
                    />
                </span>

                <span class="text-sm font-medium leading-tight">
                    {{ $category['label'] }}
                </span>
            </button>
        @endforeach
    </div>

    @error($getStatePath())
        <p class="text-sm text-danger-600 dark:text-danger-400">{{ $message }}</p>
    @enderror
</div>