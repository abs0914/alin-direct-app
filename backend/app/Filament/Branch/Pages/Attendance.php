<?php

namespace App\Filament\Branch\Pages;

use App\Models\Attendance as AttendanceRecord;
use Filament\Forms;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Attendance extends Page implements HasForms
{
    use InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-camera';

    protected static ?string $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 0;

    protected static ?string $navigationLabel = 'Attendance';

    protected static ?string $title = 'Staff Attendance';

    protected static string $view = 'filament.branch.pages.attendance';

    public ?array $data = [];

    public function mount(): void
    {
        $this->form->fill();
    }

    public static function canAccess(): bool
    {
        return Auth::user()?->canHandleBranchOperations() ?? false;
    }

    public static function shouldRegisterNavigation(): bool
    {
        return static::canAccess();
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Selfie Capture')
                    ->description($this->activeAttendanceRecord()
                        ? 'Take a selfie to complete your check-out timestamp.'
                        : 'Take a selfie to start your shift and save the check-in timestamp.')
                    ->schema([
                        Forms\Components\Hidden::make('image_data'),
                        Forms\Components\FileUpload::make('image')
                            ->label('Upload Existing Photo')
                            ->helperText('Use this only if your camera is unavailable. The camera panel above is recommended for attendance.')
                            ->image()
                            ->disk('public')
                            ->directory('attendance')
                            ->visibility('public')
                            ->acceptedFileTypes(['image/*'])
                            ->extraInputAttributes([
                                'accept' => 'image/*',
                                'capture' => 'user',
                            ])
                            ->maxSize(5120)
                            ->required(fn (Forms\Get $get): bool => blank($get('image_data'))),
                        Forms\Components\Textarea::make('notes')
                            ->rows(3)
                            ->placeholder('Optional notes for this attendance record.')
                            ->columnSpanFull(),
                    ]),
            ])
            ->statePath('data');
    }

    public function submit(): void
    {
        $user = Auth::user();

        if (! $user?->branch_id) {
            Notification::make()
                ->danger()
                ->title('Branch assignment required')
                ->body('Your account must be assigned to a branch before you can log attendance.')
                ->send();

            return;
        }

        $data = $this->form->getState();
        $activeAttendance = $this->activeAttendanceRecord();
        $imagePath = $this->resolveImagePath($data);

        if (blank($imagePath)) {
            Notification::make()
                ->warning()
                ->title('Photo required')
                ->body('Take a selfie with the camera or upload an image before submitting attendance.')
                ->send();

            return;
        }

        if ($activeAttendance) {
            $notes = $activeAttendance->notes;

            if (filled($data['notes'] ?? null)) {
                $notes = trim(implode("\n\n", array_filter([
                    $notes,
                    'Check-out notes: ' . trim((string) $data['notes']),
                ])));
            }

            $activeAttendance->update([
                'check_out_at' => now(),
                'check_out_image_path' => $imagePath,
                'status' => 'checked_out',
                'notes' => $notes,
            ]);

            $message = 'You have been checked out successfully.';
        } else {
            if ($this->todayAttendanceRecord()) {
                Notification::make()
                    ->warning()
                    ->title('Attendance already completed')
                    ->body('You already have a completed attendance record for today.')
                    ->send();

                return;
            }

            AttendanceRecord::create([
                'user_id' => $user->id,
                'branch_id' => $user->branch_id,
                'attendance_date' => today(),
                'check_in_at' => now(),
                'check_in_image_path' => $imagePath,
                'status' => 'checked_in',
                'notes' => $data['notes'] ?? null,
            ]);

            $message = 'You have been checked in successfully.';
        }

        $this->form->fill();

        Notification::make()
            ->success()
            ->title('Attendance saved')
            ->body($message)
            ->send();
    }

    protected function getViewData(): array
    {
        return [
            'todayAttendance' => $this->todayAttendanceRecord(),
            'activeAttendance' => $this->activeAttendanceRecord(),
            'recentAttendances' => AttendanceRecord::query()
                ->where('user_id', Auth::id())
                ->latest('attendance_date')
                ->latest('check_in_at')
                ->limit(7)
                ->get(),
        ];
    }

    private function todayAttendanceRecord(): ?AttendanceRecord
    {
        return AttendanceRecord::query()
            ->where('user_id', Auth::id())
            ->whereDate('attendance_date', today())
            ->latest('check_in_at')
            ->first();
    }

    private function activeAttendanceRecord(): ?AttendanceRecord
    {
        return AttendanceRecord::query()
            ->where('user_id', Auth::id())
            ->whereNull('check_out_at')
            ->latest('check_in_at')
            ->first();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveImagePath(array $data): ?string
    {
        return $this->storeCapturedImage($data['image_data'] ?? null) ?? ($data['image'] ?? null);
    }

    private function storeCapturedImage(mixed $imageData): ?string
    {
        if (! is_string($imageData) || ! str_starts_with($imageData, 'data:image/')) {
            return null;
        }

        [$metadata, $encodedImage] = array_pad(explode(',', $imageData, 2), 2, null);

        if (blank($metadata) || blank($encodedImage)) {
            return null;
        }

        preg_match('/^data:image\/(?P<extension>[a-zA-Z0-9.+-]+);base64$/', $metadata, $matches);

        $binaryImage = base64_decode($encodedImage, true);

        if ($binaryImage === false) {
            return null;
        }

        $extension = match (strtolower($matches['extension'] ?? 'jpg')) {
            'jpeg' => 'jpg',
            'png' => 'png',
            'webp' => 'webp',
            default => 'jpg',
        };

        $path = 'attendance/' . Str::uuid() . '.' . $extension;

        Storage::disk('public')->put($path, $binaryImage);

        return $path;
    }
}