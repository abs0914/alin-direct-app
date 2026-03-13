<?php

namespace Database\Seeders;

use App\Models\ServiceCategory;
use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            [
                'name' => 'ALiN Cargo', 'slug' => 'alin-cargo', 'icon' => null, 'logo' => 'images/alin-cargo-logo.png',
                'color' => '#f59e0b', 'sort_order' => 1,
                'services' => ['Inbound Parcel', 'Parcel Delivery'],
            ],
            [
                'name' => 'ALiN Travel', 'slug' => 'alin-travel', 'icon' => null, 'logo' => 'images/alin-travel-logo.png',
                'color' => '#3b82f6', 'sort_order' => 2,
                'services' => ['Transportation Booking', 'Hotel Booking', 'Tours Booking'],
            ],
            [
                'name' => 'Cebuana Lhullier', 'slug' => 'cebuana-lhullier', 'icon' => null, 'logo' => 'images/cebuana-lhullier-logo.png',
                'color' => '#10b981', 'sort_order' => 3,
                'services' => [
                    'Cebuana Bills Payment', 'Cebuana Cash In', 'Cebuana Cash Out',
                    'Cebuana Domestic Remittance', 'Cebuana International Remittance',
                ],
            ],
            [
                'name' => 'Ecpay', 'slug' => 'ecpay', 'icon' => null, 'logo' => 'images/ecpay-logo.png',
                'color' => '#8b5cf6', 'sort_order' => 4,
                'services' => ['Ecpay Cash In', 'Ecpay Cash Out', 'Ecpay Load'],
            ],
            [
                'name' => 'St. Peter', 'slug' => 'st-peter', 'icon' => null, 'logo' => 'images/st-peter-logo.png',
                'color' => '#ec4899', 'sort_order' => 5,
                'services' => ['Memorial Life Plan', 'Cremation Plan'],
            ],
            [
                'name' => 'Lottomatik', 'slug' => 'lottomatik', 'icon' => null, 'logo' => 'images/lottomatik-logo.png',
                'color' => '#ef4444', 'sort_order' => 6,
                'services' => ['Lottomatik'],
            ],
            [
                'name' => 'Stronghold Insurance', 'slug' => 'stronghold-insurance', 'icon' => null, 'logo' => 'images/stronghold-insurance-logo.png',
                'color' => '#06b6d4', 'sort_order' => 7,
                'services' => ['Personal Accident', 'CTPL Motor Vehicle', 'CTPL Insurance'],
            ],
        ];

        foreach ($catalog as $catData) {
            $services = $catData['services'];
            unset($catData['services']);

            $category = ServiceCategory::updateOrCreate(
                ['slug' => $catData['slug']],
                $catData
            );

            foreach ($services as $i => $serviceName) {
                Service::firstOrCreate(
                    ['slug' => $category->slug . '-' . \Illuminate\Support\Str::slug($serviceName)],
                    [
                        'service_category_id' => $category->id,
                        'name' => $serviceName,
                        'sort_order' => $i + 1,
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}

