<?php

namespace Tests\Feature;

use App\Filament\Branch\Pages\DailySummary;
use App\Models\Branch;
use App\Models\SalesTransaction;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use App\Filament\Branch\Resources\ExpenseResource;
use App\Filament\Branch\Resources\ExpenseResource\Pages\CreateExpense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_expense_category_meta_matches_category_options(): void
    {
        $options = ExpenseResource::getCategoryOptions();
        $meta = ExpenseResource::getCategoryMeta();

        $this->assertSame(array_keys($options), array_keys($meta));

        foreach ($meta as $value => $category) {
            $this->assertSame($options[$value], $category['label']);
            $this->assertArrayHasKey('icon', $category);
            $this->assertArrayHasKey('color', $category);
        }
    }

    public function test_create_expense_uses_in_form_actions_instead_of_default_page_actions(): void
    {
        $page = app(CreateExpense::class);
        $method = new \ReflectionMethod($page, 'getFormActions');

        $this->assertSame([], $method->invoke($page));
    }

    public function test_daily_summary_qualifies_sales_transaction_created_at_when_joining_categories(): void
    {
        $branch = Branch::query()->create([
            'name' => 'Test Branch',
            'code' => 'TB-001',
            'type' => 'branch',
            'address' => 'Test Address',
            'city' => 'Test City',
            'province' => 'Test Province',
            'is_active' => true,
        ]);

        $user = User::factory()->create();
        $user->branch()->associate($branch);
        $user->save();

        $category = ServiceCategory::query()->create([
            'name' => 'Bills Payment',
            'slug' => 'bills-payment',
            'color' => '#f5a524',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $service = Service::query()->create([
            'service_category_id' => $category->id,
            'name' => 'Utility Payment',
            'slug' => 'utility-payment',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        SalesTransaction::query()->create([
            'branch_id' => $branch->id,
            'service_id' => $service->id,
            'amount' => 150.00,
            'payment_method' => 'cash',
            'created_by' => $user->id,
        ]);

        $this->actingAs($user);

        $page = app(DailySummary::class);
        $method = new \ReflectionMethod($page, 'getViewData');
        $data = $method->invoke($page);

        $this->assertCount(1, $data['salesByCategory']);
        $this->assertSame('Bills Payment', $data['salesByCategory']->first()->category);
        $this->assertSame(150.0, (float) $data['salesByCategory']->first()->total);
    }
}