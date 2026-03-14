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
                    <div
                        x-data="{
                            preview: $wire.entangle('data.image_data'),
                            stream: null,
                            cameraOpen: false,
                            error: null,
                            async startCamera() {
                                this.error = null

                                if (! navigator.mediaDevices?.getUserMedia) {
                                    this.error = 'Camera access is not supported in this browser. You can upload a photo below instead.'
                                    return
                                }

                                try {
                                    this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
                                    this.$refs.video.srcObject = this.stream
                                    this.cameraOpen = true
                                } catch (error) {
                                    this.error = 'Unable to access the camera. Please allow camera permission or upload a photo below.'
                                }
                            },
                            stopCamera() {
                                this.stream?.getTracks().forEach((track) => track.stop())
                                this.stream = null
                                this.cameraOpen = false
                            },
                            capture() {
                                if (! this.$refs.video?.videoWidth) {
                                    this.error = 'Camera is still loading. Please try again in a moment.'
                                    return
                                }

                                const canvas = this.$refs.canvas
                                canvas.width = this.$refs.video.videoWidth
                                canvas.height = this.$refs.video.videoHeight
                                canvas.getContext('2d').drawImage(this.$refs.video, 0, 0, canvas.width, canvas.height)
                                this.preview = canvas.toDataURL('image/jpeg', 0.92)
                                this.stopCamera()
                            },
                            clearPreview() {
                                this.preview = null
                            },
                        }"
                        x-on:beforeunload.window="stopCamera()"
                        class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                        <div class="mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">{{ $activeAttendance ? 'Check-out Selfie Camera' : 'Check-in Selfie Camera' }}</h3>
                            <p class="mt-1 text-sm text-gray-500">
                                Use your device camera to take the required attendance selfie. This works on supported mobile browsers and on desktops with webcam permission.
                            </p>
                        </div>

                        <div class="grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
                            <div class="space-y-3">
                                <div class="aspect-[3/4] overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50">
                                    <video x-ref="video" x-show="cameraOpen" autoplay playsinline muted class="h-full w-full object-cover"></video>
                                    <img x-show="! cameraOpen && preview" x-bind:src="preview" alt="Attendance selfie preview" class="h-full w-full object-cover" />
                                    <div x-show="! cameraOpen && ! preview" class="flex h-full items-center justify-center p-6 text-center text-sm text-gray-500">
                                        Open the camera, then take your selfie here.
                                    </div>
                                </div>

                                <canvas x-ref="canvas" class="hidden"></canvas>

                                <div class="flex flex-wrap gap-2">
                                    <x-filament::button type="button" color="gray" x-show="! cameraOpen" x-on:click="startCamera()">
                                        Open Camera
                                    </x-filament::button>
                                    <x-filament::button type="button" x-show="cameraOpen" x-on:click="capture()">
                                        Take Photo
                                    </x-filament::button>
                                    <x-filament::button type="button" color="gray" x-show="cameraOpen" x-on:click="stopCamera()">
                                        Close Camera
                                    </x-filament::button>
                                    <x-filament::button type="button" color="danger" x-show="preview && ! cameraOpen" x-on:click="clearPreview()">
                                        Retake
                                    </x-filament::button>
                                </div>
                            </div>

                            <div class="space-y-3 text-sm text-gray-600">
                                <div class="rounded-lg bg-blue-50 p-4 text-blue-700">
                                    Recommended: use the camera here for attendance. If camera access is blocked, you can still upload an existing photo below.
                                </div>

                                <div x-show="error" x-text="error" class="rounded-lg bg-red-50 p-4 text-red-700"></div>

                                <ul class="list-disc space-y-1 pl-5">
                                    <li>Allow camera permission when your browser asks.</li>
                                    <li>Use the front camera for selfie attendance when available.</li>
                                    <li>After taking the photo, submit the form to save your check-in or check-out.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

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