<?php

namespace App\Filament\Branch\Pages;

use App\Models\DailyClosing;
use App\Models\Expense;
use App\Models\SalesTransaction;
use Filament\Forms;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EndOfDayClosing extends Page implements HasForms
{
    use InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-lock-closed';

    protected static ?string $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 4;

    protected static ?string $navigationLabel = 'EOD Closing';

    protected static ?string $title = 'End-of-Day Closing';

    protected static string $view = 'filament.branch.pages.eod-closing';

    public ?float $opening_balance = 0;
    public ?float $actual_cash = null;
    public ?string $manager_notes = '';

    // Computed data for display
    public float $totalCashSales = 0;
    public float $totalDigitalSales = 0;
    public float $totalCashExpenses = 0;
    public float $totalDigitalExpenses = 0;
    public float $expectedCash = 0;
    public float $variance = 0;
    public bool $isClosed = false;
    public ?DailyClosing $closing = null;

    public static function canAccess(): bool
    {
        return Auth::user()?->canManageBranchFinancials() ?? false;
    }

    public static function shouldRegisterNavigation(): bool
    {
        return static::canAccess();
    }

    public function mount(): void
    {
        $this->loadTodayData();
    }

    protected function loadTodayData(): void
    {
        $branchId = Auth::user()?->branch_id;
        $today = today();

        $this->closing = DailyClosing::where('branch_id', $branchId)
            ->where('business_date', $today)
            ->first();

        $this->isClosed = $this->closing?->status === 'closed';

        $salesQuery = SalesTransaction::where('branch_id', $branchId)->whereDate('created_at', $today);
        $expenseQuery = Expense::where('branch_id', $branchId)->whereDate('created_at', $today);

        $this->totalCashSales = (float) (clone $salesQuery)->where('payment_method', 'cash')->sum('amount');
        $this->totalDigitalSales = (float) (clone $salesQuery)->where('payment_method', '!=', 'cash')->sum('amount');
        $this->totalCashExpenses = (float) (clone $expenseQuery)->where('payment_method', 'cash')->sum('amount');
        $this->totalDigitalExpenses = (float) (clone $expenseQuery)->where('payment_method', '!=', 'cash')->sum('amount');

        $this->opening_balance = (float) ($this->closing?->opening_balance ?? 0);
        $this->expectedCash = $this->opening_balance + $this->totalCashSales - $this->totalCashExpenses;

        if ($this->isClosed) {
            $this->actual_cash = (float) $this->closing->actual_cash;
            $this->variance = (float) $this->closing->variance;
            $this->manager_notes = $this->closing->manager_notes ?? '';
        }
    }

    public function closeDay(): void
    {
        $user = Auth::user();

        // Check permission
        if (! $user?->canManageBranchFinancials()) {
            Notification::make()->danger()->title('Access Denied')->body('Only branch managers, branch owners, HQ admins, and admins can close the day.')->send();
            return;
        }

        if ($this->isClosed) {
            Notification::make()->warning()->title('Already Closed')->body('Today has already been closed.')->send();
            return;
        }

        if ($this->actual_cash === null) {
            Notification::make()->danger()->title('Missing Info')->body('Please enter the actual cash on hand.')->send();
            return;
        }

        $this->variance = $this->actual_cash - $this->expectedCash;

        // Require notes if variance exceeds ±₱100
        if (abs($this->variance) > 100 && empty($this->manager_notes)) {
            Notification::make()->danger()->title('Notes Required')->body('Variance exceeds ₱100. Please add manager notes explaining the difference.')->send();
            return;
        }

        $branchId = $user->branch_id;
        $today = today();

        DB::transaction(function () use ($branchId, $today, $user) {
            $closing = DailyClosing::updateOrCreate(
                ['branch_id' => $branchId, 'business_date' => $today],
                [
                    'opening_balance' => $this->opening_balance,
                    'total_cash_sales' => $this->totalCashSales,
                    'total_digital_sales' => $this->totalDigitalSales,
                    'total_cash_expenses' => $this->totalCashExpenses,
                    'total_digital_expenses' => $this->totalDigitalExpenses,
                    'expected_cash' => $this->expectedCash,
                    'actual_cash' => $this->actual_cash,
                    'variance' => $this->variance,
                    'manager_notes' => $this->manager_notes,
                    'closed_by' => $user->id,
                    'closed_at' => now(),
                    'status' => 'closed',
                ]
            );

            // Link all today's sales & expenses to this closing
            SalesTransaction::where('branch_id', $branchId)
                ->whereDate('created_at', $today)
                ->whereNull('daily_closing_id')
                ->update(['daily_closing_id' => $closing->id]);

            Expense::where('branch_id', $branchId)
                ->whereDate('created_at', $today)
                ->whereNull('daily_closing_id')
                ->update(['daily_closing_id' => $closing->id]);
        });

        $this->loadTodayData();

        Notification::make()->success()->title('Day Closed')->body('End-of-day closing completed successfully.')->send();
    }
}

