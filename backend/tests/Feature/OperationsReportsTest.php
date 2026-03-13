<?php

namespace Tests\Feature;

use App\Filament\Branch\Pages\OperationsReports;
use App\Models\Branch;
use App\Models\SalesTransaction;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OperationsReportsTest extends TestCase
{
    use RefreshDatabase;

    public function test_operations_reports_qualifies_sales_transaction_created_at_for_joined_queries(): void
    {
        $branch = Branch::query()->create([
            'name' => 'Test Branch',
            'code' => 'TB-OPS',
            'type' => 'branch',
            'address' => 'Test Address',
            'city' => 'Test City',
            'province' => 'Test Province',
            'is_active' => true,
        ]);

        $user = User::factory()->create(['branch_id' => $branch->id]);

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
            'amount' => 275.00,
            'payment_method' => 'cash',
            'created_by' => $user->id,
        ]);

        $this->actingAs($user);

        $page = app(OperationsReports::class);
        $method = new \ReflectionMethod($page, 'getViewData');
        $data = $method->invoke($page);

        $this->assertCount(1, $data['salesByCategory']);
        $this->assertSame('Bills Payment', $data['salesByCategory']->first()->category);
        $this->assertSame(275.0, (float) $data['salesByCategory']->first()->total);

        $this->assertCount(1, $data['topServices']);
        $this->assertSame('Utility Payment', $data['topServices']->first()->service);
        $this->assertSame(275.0, (float) $data['topServices']->first()->total);
    }
}