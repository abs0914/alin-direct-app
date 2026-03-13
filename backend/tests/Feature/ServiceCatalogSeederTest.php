<?php

namespace Tests\Feature;

use Database\Seeders\ServiceCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceCatalogSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_service_catalog_seeder_stores_public_logo_paths(): void
    {
        $this->seed(ServiceCatalogSeeder::class);

        $expectedLogos = [
            'alin-cargo' => 'images/alin-cargo-logo.png',
            'alin-travel' => 'images/alin-travel-logo.png',
            'cebuana-lhullier' => 'images/cebuana-lhullier-logo.png',
            'ecpay' => 'images/ecpay-logo.png',
            'st-peter' => 'images/st-peter-logo.png',
            'lottomatik' => 'images/lottomatik-logo.png',
            'stronghold-insurance' => 'images/stronghold-insurance-logo.png',
        ];

        foreach ($expectedLogos as $slug => $logo) {
            $this->assertDatabaseHas('service_categories', [
                'slug' => $slug,
                'logo' => $logo,
                'icon' => null,
            ]);
        }
    }
}