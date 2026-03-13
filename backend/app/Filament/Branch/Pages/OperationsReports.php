<?php

namespace App\Filament\Branch\Pages;

use App\Models\DailyClosing;
use App\Models\Expense;
use App\Models\SalesTransaction;
use Filament\Pages\Page;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OperationsReports extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-presentation-chart-line';

    protected static ?string $navigationGroup = 'Reports & Analytics';

    protected static ?int $navigationSort = 5;

    protected static ?string $navigationLabel = 'Operations Reports';

    protected static ?string $title = 'Operations Reports';

    protected static string $view = 'filament.branch.pages.operations-reports';

    public static function canAccess(): bool
    {
        return Auth::user()?->canManageBranchReports() ?? false;
    }

    public static function shouldRegisterNavigation(): bool
    {
        return static::canAccess();
    }

    protected function getViewData(): array
    {
        $branchId = Auth::user()?->branch_id;
        $today = Carbon::today();

        // Sales trend (last 7 days)
        $days = collect(range(6, 0))->map(fn ($i) => $today->copy()->subDays($i));
        $salesTrend = $days->map(fn ($day) => [
            'date' => $day->format('M d'),
            'sales' => (float) SalesTransaction::where('branch_id', $branchId)
                ->whereDate('sales_transactions.created_at', $day)->sum('amount'),
            'expenses' => (float) Expense::where('branch_id', $branchId)
                ->whereDate('expenses.created_at', $day)->sum('amount'),
        ]);

        // Sales by category (this month)
        $salesByCategory = SalesTransaction::where('branch_id', $branchId)
            ->where('sales_transactions.created_at', '>=', $today->copy()->startOfMonth())
            ->join('services', 'sales_transactions.service_id', '=', 'services.id')
            ->join('service_categories', 'services.service_category_id', '=', 'service_categories.id')
            ->select('service_categories.name as category', DB::raw('SUM(sales_transactions.amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('service_categories.name')
            ->orderByDesc('total')
            ->get();

        // Sales by payment method (this month)
        $salesByPayment = SalesTransaction::where('branch_id', $branchId)
            ->where('sales_transactions.created_at', '>=', $today->copy()->startOfMonth())
            ->select('payment_method', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('payment_method')
            ->orderByDesc('total')
            ->get();

        // Expenses by category (this month)
        $expensesByCategory = Expense::where('branch_id', $branchId)
            ->where('expenses.created_at', '>=', $today->copy()->startOfMonth())
            ->select('category', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        // Top services (this month)
        $topServices = SalesTransaction::where('branch_id', $branchId)
            ->where('sales_transactions.created_at', '>=', $today->copy()->startOfMonth())
            ->join('services', 'sales_transactions.service_id', '=', 'services.id')
            ->select('services.name as service', DB::raw('SUM(sales_transactions.amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('services.name')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        // Monthly totals
        $monthSales = SalesTransaction::where('branch_id', $branchId)
            ->where('sales_transactions.created_at', '>=', $today->copy()->startOfMonth())->sum('amount');
        $monthExpenses = Expense::where('branch_id', $branchId)
            ->where('expenses.created_at', '>=', $today->copy()->startOfMonth())->sum('amount');

        // EOD closing history (last 7 days)
        $closingHistory = DailyClosing::where('branch_id', $branchId)
            ->where('status', 'closed')
            ->orderByDesc('business_date')
            ->limit(7)
            ->get();

        return compact(
            'salesTrend', 'salesByCategory', 'salesByPayment',
            'expensesByCategory', 'topServices',
            'monthSales', 'monthExpenses', 'closingHistory'
        );
    }
}

