<?php

namespace App\Filament\Branch\Pages;

use App\Models\Expense;
use App\Models\SalesTransaction;
use App\Models\DailyClosing;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DailySummary extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-chart-bar-square';

    protected static ?string $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 3;

    protected static ?string $navigationLabel = 'Daily Summary';

    protected static ?string $title = 'Daily Operations Summary';

    protected static string $view = 'filament.branch.pages.daily-summary';

    protected int | string | array $polling = '30s';

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
        $today = today();

        // Check if today is already closed
        $closing = DailyClosing::where('branch_id', $branchId)
            ->where('business_date', $today)
            ->first();

        // Sales queries
        $salesQuery = SalesTransaction::where('branch_id', $branchId)
            ->whereDate('sales_transactions.created_at', $today);

        $totalSales = (clone $salesQuery)->sum('amount');
        $salesCount = (clone $salesQuery)->count();

        $salesByCategory = (clone $salesQuery)
            ->join('services', 'sales_transactions.service_id', '=', 'services.id')
            ->join('service_categories', 'services.service_category_id', '=', 'service_categories.id')
            ->select('service_categories.name as category', DB::raw('SUM(sales_transactions.amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('service_categories.name')
            ->get();

        $salesByPayment = (clone $salesQuery)
            ->select('payment_method', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('payment_method')
            ->get();

        $cashSales = (clone $salesQuery)->where('payment_method', 'cash')->sum('amount');
        $digitalSales = $totalSales - $cashSales;

        // Expense queries
        $expenseQuery = Expense::where('branch_id', $branchId)
            ->whereDate('expenses.created_at', $today);

        $totalExpenses = (clone $expenseQuery)->sum('amount');
        $expenseCount = (clone $expenseQuery)->count();

        $expensesByCategory = (clone $expenseQuery)
            ->select('category', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('category')
            ->get();

        $cashExpenses = (clone $expenseQuery)->where('payment_method', 'cash')->sum('amount');
        $digitalExpenses = $totalExpenses - $cashExpenses;

        // Cash flow
        $netCashFlow = $totalSales - $totalExpenses;
        $openingBalance = $closing?->opening_balance ?? 0;
        $expectedCash = $openingBalance + $cashSales - $cashExpenses;

        return compact(
            'totalSales', 'salesCount', 'salesByCategory', 'salesByPayment',
            'cashSales', 'digitalSales',
            'totalExpenses', 'expenseCount', 'expensesByCategory',
            'cashExpenses', 'digitalExpenses',
            'netCashFlow', 'openingBalance', 'expectedCash',
            'closing', 'today'
        );
    }
}

