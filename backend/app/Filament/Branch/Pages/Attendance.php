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
                        Forms\Components\FileUpload::make('image')
                            ->label($this->activeAttendanceRecord() ? 'Check-out Selfie' : 'Check-in Selfie')
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
                            ->required(),
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
                'check_out_image_path' => $data['image'],
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
                'check_in_image_path' => $data['image'],
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
}