<?php

namespace App\Filament\Branch\Pages;

use Filament\Pages\Page;
use Filament\Notifications\Notification;
use Illuminate\Support\Facades\Auth;

class BarcodeScanning extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-qr-code';

    protected static ?string $navigationGroup = 'Operations';

    protected static ?int $navigationSort = 1;

    protected static ?string $navigationLabel = 'Barcode Scan';

    protected static ?string $title = 'Parcel Barcode Scan';

    protected static string $view = 'filament.branch.pages.barcode-scanning';

    public static function canAccess(): bool
    {
        return Auth::user()?->canHandleBranchOperations() ?? false;
    }

    public static function shouldRegisterNavigation(): bool
    {
        return static::canAccess();
    }

    // ── State ─────────────────────────────────────────────────────
    public string $barcodeInput = '';
    public bool $scanning = false;
    public ?array $scannedParcel = null;
    public string $scanError = '';

    /**
     * Pre-defined demo parcels keyed by barcode / tracking ID.
     */
    private function getDemoParcels(): array
    {
        return [
            'ALN-2025-001' => [
                'tracking_id'   => 'ALN-2025-001',
                'customer_name' => 'Juan dela Cruz',
                'phone'         => '+63917 123 4567',
                'origin'        => 'Makati Branch',
                'destination'   => 'Cebu City, Cebu',
                'service_type'  => 'Standard Delivery',
                'weight'        => '0.5 kg',
                'declared_value'=> '₱350.00',
                'payment_method'=> 'Prepaid (ALiN Pay)',
                'status'        => 'Received — awaiting dispatch',
                'notes'         => 'Handle with care — fragile',
            ],
            'ALN-2025-002' => [
                'tracking_id'   => 'ALN-2025-002',
                'customer_name' => 'Maria Santos',
                'phone'         => '+63918 234 5678',
                'origin'        => 'Cebu Branch',
                'destination'   => 'Quezon City, Metro Manila',
                'service_type'  => 'Express Delivery',
                'weight'        => '1.2 kg',
                'declared_value'=> '₱1,200.00',
                'payment_method'=> 'COD — collect ₱120.00',
                'status'        => 'In transit to Manila hub',
                'notes'         => '',
            ],
            'ALN-2025-003' => [
                'tracking_id'   => 'ALN-2025-003',
                'customer_name' => 'Pedro Reyes',
                'phone'         => '+63916 345 6789',
                'origin'        => 'Makati Branch',
                'destination'   => 'Davao City, Davao del Sur',
                'service_type'  => 'Standard Delivery',
                'weight'        => '3.0 kg',
                'declared_value'=> '₱800.00',
                'payment_method'=> 'Prepaid (GCash)',
                'status'        => 'Processing — pending dispatch',
                'notes'         => 'Call recipient before delivery',
            ],
        ];
    }

    /**
     * Simulate barcode scan / lookup.
     */
    public function scanBarcode(): void
    {
        $code = strtoupper(trim($this->barcodeInput));

        if (empty($code)) {
            $this->scanError = 'Please enter or scan a barcode.';
            return;
        }

        $this->scanning = true;
        $this->scannedParcel = null;
        $this->scanError = '';

        $parcels = $this->getDemoParcels();

        if (isset($parcels[$code])) {
            $this->scannedParcel = $parcels[$code];
            $this->scanning = false;

            Notification::make()
                ->title('Parcel found: ' . $code)
                ->body('Customer: ' . $parcels[$code]['customer_name'] . ' — ' . $parcels[$code]['destination'])
                ->success()
                ->send();
        } else {
            $this->scanning = false;
            $this->scanError = "No parcel found for barcode \"{$code}\". Try ALN-2025-001, ALN-2025-002, or ALN-2025-003.";

            Notification::make()
                ->title('Parcel not found')
                ->body($this->scanError)
                ->danger()
                ->send();
        }
    }

    /**
     * Clear the current scan result.
     */
    public function clearScan(): void
    {
        $this->barcodeInput = '';
        $this->scannedParcel = null;
        $this->scanError = '';
    }
}

