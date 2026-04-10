# Stronghold Personal Accident Insurance (PAI) — Technical Summary
## Branch Portal Integration

---

## 1. Sales Transactions — Create Sale Workflow

### Service Selection Trigger

The service selection UI is rendered by a custom Blade component (`service-card-selector.blade.php`) embedded inside a Filament `ViewField`. It queries all active `ServiceCategory` records with their active `Service` children and renders them as collapsible accordion groups.

When a staff member expands the **Stronghold Insurance** category (slug: `stronghold-insurance`) and clicks **Personal Accident** (service slug: `stronghold-insurance-personal-accident`), the following Alpine.js/Livewire expression fires:

```javascript
if ('{{ $service->slug }}' === 'stronghold-insurance-personal-accident'
    && ! $wire.get('data.personal_accident_insurance_id')) {
    $wire.mountAction('personalAccidentInsuranceForm', {
        serviceId: {{ $service->id }},
        statePath: @js($getStatePath())
    });
}
```

The condition has two guards:
- The service slug must exactly match `stronghold-insurance-personal-accident`
- `data.personal_accident_insurance_id` must be null (prevents re-opening the modal if enrollment is already done in the same session)

`$wire.mountAction()` tells Filament's Livewire component to open the named action `personalAccidentInsuranceForm`, passing `serviceId` and `statePath` as arguments.

### The `HandlesPersonalAccidentInsurance` Trait

Both `CreateSalesTransaction` and `EditSalesTransaction` page classes use this trait:

```php
class CreateSalesTransaction extends CreateRecord
{
    use HandlesStPeterApplication;
    use HandlesPersonalAccidentInsurance;
}
```

The trait exposes one method — `personalAccidentInsuranceFormAction(): Action` — which Filament auto-discovers by naming convention (`{actionName}Action`). No manual registration in `getHeaderActions()` is needed.

**Action configuration:**
- `Action::make('personalAccidentInsuranceForm')` — must match the string passed to `mountAction()` exactly
- `->modalWidth('2xl')` — wide modal to accommodate the full enrollment form
- `->form([...])` — the enrollment fields (see Section 3)
- `->action(fn(array $data, array $arguments) => ...)` — the save handler

**Save handler flow:**
1. Runs the duplicate-enrollment check (see Section 4)
2. Creates a `PersonalAccidentInsurance` record
3. Writes back into the Livewire form state:
```php
$this->data['personal_accident_insurance_id'] = $insurance->id;
$this->data['service_id'] = $arguments['serviceId'];
```
4. Fires a success notification with the generated policy number

When staff clicks **Create**, `mutateFormDataBeforeCreate()` appends `branch_id` and `created_by`, and `personal_accident_insurance_id` is saved as a nullable foreign key on `sales_transactions`.

---

## 2. Customers Module — Insurance Card Action

### Table Row Action

An amber **"Insurance Card"** button appears on every customer row. On click, it opens a `modalWidth('lg')` modal whose content is resolved dynamically:

```php
->modalContent(function (Customer $record) {
    $insurance = $record->personalAccidentInsurance;
    if (!$insurance) {
        return view('filament.branch.components.no-customer-insurance', [
            'type' => 'PAI',
            'name' => $record->user?->name,
        ]);
    }
    return view('filament.branch.components.customer-insurance-card-preview',
        compact('insurance'));
})
```

| State | View Rendered |
|---|---|
| Policy exists | `customer-insurance-card-preview.blade.php` — full golden-amber card |
| No policy | `no-customer-insurance.blade.php` — neutral placeholder |

### ViewCustomer Header Action

The same modal is also available as a header button on the individual customer view page.

### Card Preview (`customer-insurance-card-preview.blade.php`)

- **Front:** Customer initials avatar, full name, nationality, Member ID (`ALN-XXXXXX`), Policy Number (`PAI-XXXXXX`), validity year range, issuing branch
- **Back:** Coverage benefits table + branch contact footer
- **QR Code:** Encodes `{APP_URL}/verify/pai/{policy_number}` for public verification

---

## 3. Enrollment Modal — Form Fields

| Field | Component | Constraints |
|---|---|---|
| `full_name` | `TextInput` | Required, max 255 |
| `nationality` | `TextInput` | Required, default `"Filipino"`, max 255 |
| `mobile` | `TextInput` | Required, `->tel()`, max 20 |
| `email` | `TextInput` | Required, `->email()`, max 255 |
| `date_of_birth` | `DatePicker` | Required, `->maxDate(now()->subYears(18))` |
| `customer_id` | `Select` | Nullable, searchable, options via direct query |
| `address` | `Textarea` | Required, full-width |
| `beneficiaries` | `Repeater` | 1 default item; sub-fields: `name` + `relationship` |

> **Note on `customer_id`:** Uses `->options()` with a direct `Customer::join('users',...)->pluck()` query instead of `->relationship()`. The latter requires a bound Eloquent model, which is unavailable inside an `Action` modal — using it causes Filament's `RelationshipJoiner` to receive `null` and throw a `TypeError`.

---

## 4. Backend Logic — `PersonalAccidentInsurance` Model

### Policy Number & Validity (model `booted()` hook)

```php
static::creating(function (self $record) {
    if (empty($record->policy_number)) {
        $record->policy_number = static::generatePolicyNumber(); // → PAI-XXXXXX
    }
    if (empty($record->valid_from)) {
        $record->valid_from = now()->toDateString();
    }
    if (empty($record->valid_until)) {
        $record->valid_until = now()->addYear()->toDateString();
    }
});
```

### Duplicate Enrollment Check

```php
$existing = PersonalAccidentInsurance::where('customer_id', $data['customer_id'])
    ->where('status', 'active')
    ->whereDate('valid_until', '>=', now())
    ->first();

if ($existing) {
    Notification::make()->title('Duplicate Enrollment')
        ->body('Active policy already exists: ' . $existing->policy_number)
        ->warning()->send();
    return;
}
```

All three conditions must be true to block enrollment: same `customer_id`, `status = active`, and `valid_until` is today or future. Expired or cancelled prior policies allow re-enrollment.

### Coverage Constants

```php
public const COVERAGE_DEATH   = 100_000;  // Accidental Death & Disablement
public const COVERAGE_MURDER  = 10_000;   // Murder & Assault
public const COVERAGE_MEDICAL = 5_000;    // Medical Reimbursement
public const COVERAGE_BURIAL  = 5_000;    // Burial Benefits
```

### Database Schema

```
personal_accident_insurances
  id, policy_number (unique), customer_id (FK nullable),
  full_name, nationality, mobile, email, date_of_birth,
  address, beneficiaries (JSON), valid_from, valid_until,
  status (active|expired|cancelled), branch_id (FK), created_by (FK),
  created_at, updated_at

sales_transactions
  ... existing fields ...
  personal_accident_insurance_id (FK → personal_accident_insurances, nullable)
```

---

## 5. Public Policy Verification

```
GET /verify/pai/{policyNumber}  →  VerifyInsuranceController@show
```

Unauthenticated public route. Looks up the policy by `policy_number`, computes live status, and returns a branded Blade view (`verify/pai.blade.php`) in the golden amber (`#F5A010`) color scheme showing all policy details and coverage amounts. The QR code on the card encodes this URL for instant scanner-based verification.

