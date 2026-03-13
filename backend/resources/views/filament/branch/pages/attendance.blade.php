<x-filament-panels::page>
    <div class="grid gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
            <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div class="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">Today's Attendance</h3>
                        <p class="text-sm text-gray-500">
                            {{ $activeAttendance ? 'You are currently checked in.' : 'No active attendance session.' }}
                        </p>
                    </div>
                    <span class="rounded-full px-3 py-1 text-xs font-semibold {{ $activeAttendance ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700' }}">
                        {{ $activeAttendance ? 'Checked In' : (($todayAttendance && $todayAttendance->check_out_at) ? 'Completed' : 'Ready to Check In') }}
                    </span>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="rounded-lg bg-gray-50 p-4">
                        <div class="text-xs uppercase tracking-wide text-gray-500">Check In</div>
                        <div class="mt-1 text-sm font-medium text-gray-900">{{ $todayAttendance?->check_in_at?->format('M d, Y h:i A') ?? '—' }}</div>
                    </div>
                    <div class="rounded-lg bg-gray-50 p-4">
                        <div class="text-xs uppercase tracking-wide text-gray-500">Check Out</div>
                        <div class="mt-1 text-sm font-medium text-gray-900">{{ $todayAttendance?->check_out_at?->format('M d, Y h:i A') ?? '—' }}</div>
                    </div>
                </div>
            </div>

            @if(! $todayAttendance || $activeAttendance)
                <form wire:submit="submit" class="space-y-6">
                    {{ $this->form }}

                    <div class="flex justify-end">
                        <x-filament::button type="submit">
                            {{ $activeAttendance ? 'Check Out' : 'Check In' }}
                        </x-filament::button>
                    </div>
                </form>
            @else
                <div class="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 shadow-sm">
                    Your attendance for today is complete.
                </div>
            @endif
        </div>

        <div class="space-y-6">
            <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-900">Recent History</h3>
                <div class="mt-4 space-y-3">
                    @forelse($recentAttendances as $attendance)
                        <div class="rounded-lg border border-gray-100 p-3">
                            <div class="text-sm font-semibold text-gray-900">{{ $attendance->attendance_date?->format('M d, Y') }}</div>
                            <div class="mt-1 text-xs text-gray-500">IN: {{ $attendance->check_in_at?->format('h:i A') ?? '—' }}</div>
                            <div class="text-xs text-gray-500">OUT: {{ $attendance->check_out_at?->format('h:i A') ?? '—' }}</div>
                        </div>
                    @empty
                        <div class="text-sm text-gray-500">No attendance records yet.</div>
                    @endforelse
                </div>
            </div>

            @if($todayAttendance?->check_in_image_path)
                <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h3 class="text-lg font-semibold text-gray-900">Today's Selfies</h3>
                    <div class="mt-4 space-y-4">
                        <img class="rounded-lg border border-gray-200" src="{{ \Illuminate\Support\Facades\Storage::disk('public')->url($todayAttendance->check_in_image_path) }}" alt="Check-in selfie">
                        @if($todayAttendance->check_out_image_path)
                            <img class="rounded-lg border border-gray-200" src="{{ \Illuminate\Support\Facades\Storage::disk('public')->url($todayAttendance->check_out_image_path) }}" alt="Check-out selfie">
                        @endif
                    </div>
                </div>
            @endif
        </div>
    </div>
</x-filament-panels::page>