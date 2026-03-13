<?php

namespace Tests\Feature;

use App\Filament\Branch\Pages\Attendance;
use App\Filament\Branch\Pages\DailySummary;
use App\Models\Attendance as AttendanceRecord;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Livewire\Livewire;
use Tests\TestCase;

class AttendancePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_check_in_and_check_out_from_branch_attendance_page(): void
    {
        Storage::fake('public');

        $branch = Branch::query()->create([
            'name' => 'Attendance Branch',
            'code' => 'AT-001',
            'type' => 'branch',
            'address' => 'Test Address',
            'city' => 'Test City',
            'province' => 'Test Province',
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'branch_id' => $branch->id,
            'user_type' => 'staff',
            'is_active' => true,
        ]);

        $this->actingAs($user);

        Livewire::test(Attendance::class)
            ->set('data.image', UploadedFile::fake()->image('check-in.jpg'))
            ->set('data.notes', 'Opening shift')
            ->call('submit')
            ->assertHasNoFormErrors();

        $attendance = AttendanceRecord::query()->first();

        $this->assertNotNull($attendance);
        $this->assertSame('checked_in', $attendance->status);
        $this->assertNotNull($attendance->check_in_image_path);
        $this->assertStringStartsWith('attendance/', $attendance->check_in_image_path);
        Storage::disk('public')->assertExists($attendance->check_in_image_path);
        $this->assertNull($attendance->check_out_at);

        Livewire::test(Attendance::class)
            ->set('data.image', UploadedFile::fake()->image('check-out.jpg'))
            ->set('data.notes', 'Closing shift')
            ->call('submit')
            ->assertHasNoFormErrors();

        $attendance->refresh();

        $this->assertSame('checked_out', $attendance->status);
        $this->assertNotNull($attendance->check_out_image_path);
        $this->assertStringStartsWith('attendance/', $attendance->check_out_image_path);
        Storage::disk('public')->assertExists($attendance->check_out_image_path);
        $this->assertNotNull($attendance->check_out_at);
        $this->assertStringContainsString('Closing shift', (string) $attendance->notes);
    }

    public function test_staff_can_access_attendance_but_not_financial_reports(): void
    {
        $branch = Branch::query()->create([
            'name' => 'Role Branch',
            'code' => 'RL-001',
            'type' => 'branch',
            'address' => 'Test Address',
            'city' => 'Test City',
            'province' => 'Test Province',
            'is_active' => true,
        ]);

        $staff = User::factory()->create([
            'branch_id' => $branch->id,
            'user_type' => 'staff',
            'is_active' => true,
        ]);

        $this->actingAs($staff);

        $this->assertTrue(Attendance::canAccess());
        $this->assertFalse(DailySummary::canAccess());
        $this->assertTrue($staff->canAccessBranchPortal());
        $this->assertFalse($staff->canManageBranchFinancials());
    }
}