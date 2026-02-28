# ALiN Direct Delivery Platform - Comprehensive Project Plan

**Version:** 2.0  
**Status:** Approved for Implementation  
**Last Updated:** February 16, 2026

---

## 1. Executive Summary

ALiN Cargo Express is launching a unified **Delivery Logistics Ecosystem** to expand last-mile delivery capacity. This platform enables independent drivers to register and accept jobs, provides customers with on-demand delivery booking, and gives ALiN HQ and Branches full operational control.

### The Ecosystem
The platform consists of four (4) distinct applications:
1.  **Driver App (Mobile)**: For independent riders to receive jobs, navigate, and track earnings.
2.  **Customer App (Mobile)**: For customers to book on-demand deliveries and track packages.
3.  **Branch Portal (Web)**: For branch staff to dispatch jobs, manage riders, and handle local operations.
4.  **HQ Portal (Web)**: For executives and regional managers to oversee the entire network, financials, and performance.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Mobile** | **Expo SDK 52 + TypeScript** | Cross-platform (iOS/Android) for Driver & Customer Apps |
| **Web Admin** | **Laravel Filament 4** | Branch & HQ Portals (Rapid UI development) |
| **Backend** | **Laravel 11 + PHP 8.3** | Core Business Logic, API, Financial Ledger |
| **Database** | **MySQL 8** | Relational Data & Financial Records |
| **Realtime** | **Firebase Realtime Database** | Live GPS Tracking & Driver Locations |
| **Notifications** | **Firebase Cloud Messaging (FCM)** | Push Notifications |
| **Queues** | **Redis + Laravel Horizon** | Background Jobs & Dispatch Engine |
| **Payments** | **Maya Payment Gateway** | Online Collections & Automated Payouts |

---

## 3. Functional Requirements & Modules

### 3.1 Driver App (Mobile)
*Target Users: Independent Riders (Motorcycle, MPV, Van, Truck)*

**Core Features:**
*   **Authentication**: Login via Mobile Number + OTP.
*   **Registration & KYC**: Profile setup, Vehicle selection, Doc upload (License, OR/CR, NBI), Agreements.
*   **Status Management**: Online/Offline toggle with "Last Seen" location tracking.
*   **Job Offer System**: Receive broadcast offers (Ringtone + Push), View details (Distance, Earnings), Accept/Reject timer.
*   **Active Job Workflow**:
    1.  *Accepted*: Navigation to Pickup.
    2.  *Arrived*: QR Scan or OTP entry at Branch.
    3.  *In-Transit*: Navigation to Drop-off (Waze/Google Maps).
    4.  *Delivered*: Proof of Delivery (POD) photo + Recipient Name + E-Signature.
    5.  *Failed*: Reason reporting (Customer unavailable, Wrong address).
*   **Earnings & Wallet**: Live earnings dashboard, Job history, Payout request to Maya.
*   **Settings**: Profile management, Vehicle info, Notification preferences.

### 3.2 Customer App (Mobile)
*Target Users: Individuals & Businesses booking deliveries*

**Core Features:**
*   **Booking Interface**: Pickup & Drop-off entry, Map pin selection, Contact details.
*   **Price Estimation**: Real-time calculation based on distance & vehicle type.
*   **Rider Matching**: "Searching for Rider" animation, Driver profile display upon acceptance.
*   **Live Tracking**: Real-time map view of rider location during delivery.
*   **Notification System**: Push updates for "Rider Assigned", "Picked Up", "Arrived", "Delivered".
*   **Payments**:
    *   **Online**: Maya Checkout integration.
    *   **COD**: Cash on Delivery handling.
*   **History**: Past deliveries, Digital receipts, Re-book option.
*   **Support**: Dispute reporting, Rate driver.

### 3.3 Branch Portal (Web)
*Target Users: Branch Managers & Dispatchers*

**Core Features:**
*   **Dashboard**: Local branch metrics (Active Riders, Pendings Jobs, Today's Earnings).
*   **Dispatch Console**:
    *   Create Delivery Job (Manual or from API).
    *   **Broadcast Engine**: Filter by Vehicle Type -> Broadcast to Eligible/Online Riders.
    *   Assign specific rider (Manual override).
*   **Rider Management**:
    *   Review Applications (Docs, Vehicle).
    *   Approve / Reject / Suspend riders.
    *   Monitor Online/Offline status.
*   **Tracking Hub**: Map view of all active branch deliveries.
*   **Exceptions Center**: Handle failed deliveries, Returns, Disputes.
*   **COD Settlement**: Verify cash remittance from drivers, Mark jobs as "Settled".

### 3.4 HQ Portal (Web)
*Target Users: Executives, Finance, Regional Ops*

**Core Features:**
*   **Executive Dashboard**: Nationwide heatmap, Total Volume, Network Health.
*   **Network Management**:
    *   **Branch Management**: Create/Edit Branches, Set Service Radii.
    *   **User Management**: create Branch Admins, Assign Roles.
*   **Global Rider Directory**: Search any rider, View cross-branch history, Blacklist controls.
*   **Financial Control Tower**:
    *   **Ledger View**: System-wide earnings & commissions.
    *   **Payout Approvals**: Review & Approve bulk driver payouts.
    *   **Reconciliation**: Compare Maya transactions vs Internal DB.
*   **Analytics Reports**: Heatmaps, Demand Prediction, Rider Performance/Retention.
*   **System Configuration**: Set Base Rates, Commission %, Service Area Polygons.

---

## 4. Architecture & Data Flow

### 4.1 Hybrid Database Strategy
To ensure **financial integrity** combined with **real-time performance**, we use a hybrid approach:

1.  **MySQL (The "Bank")**: Stores Users, Jobs, Financial Ledger, Transactions. *Source of Truth.*
2.  **Firebase RDB (The "Nervous System")**: Stores Live Driver Locations, Active Job States. *Ephemeral Real-time Data.*

### 4.2 Payment Architecture (Maya Integration)
**A. Incoming (Customer Pays)**
*   Customer Checkout -> Maya API -> Webhook -> **Verify Signature** -> Update DB `payment_status` -> Trigger Dispatch.

**B. Outgoing (Driver Payout)**
*   Driver Request -> Backend Validation (Ledger) -> Admin Approval -> Maya Disbursement API -> Webhook -> **Update Ledger**.

**C. Cash on Delivery (COD)**
*   Driver Collects Cash -> Mark `cod_collected` -> Job Complete -> **Earnings Held** -> Branch Verifies Cash -> **Earnings Released**.

---

## 5. Security & Compliance

1.  **RBAC (Role-Based Access Control)**: Strict separation between `Admin`, `Branch_Manager`, `Rider`, and `Customer`.
2.  **Data Privacy**: PII (Personally Identifiable Information) masked in logs.
3.  **Firebase Rules**:
    *   Riders can *only* write their own location.
    *   Customers can *only* read location of *their assigned* rider.
    *   Public access disabled.
4.  **API Security**:
    *   Laravel Sanctum (Tokens) for API access.
    *   HMAC Signature validation for all Maya Webhooks.
    *   Idempotency keys for all financial transactions.

---

## 6. Implementation Roadmap (12 Sprints)

**Total Duration: ~24 Weeks (6 Months)**

### Phase 1: Foundation (Weeks 1-4)
*   **Sprint 1**: Project Setup, CI/CD, Laravel Auth, Firebase Project Config.
*   **Sprint 2**: Database Schema Implementation, Basic Filament Admin Panel Setup.

### Phase 2: Rider & Dispatch Core (Weeks 5-8)
*   **Sprint 3**: Driver App - Registration, KYC Upload, Profile Mgmt.
*   **Sprint 4**: Branch Portal - Rider Approval Workflow, Vehicle Mgmt.

### Phase 3: Deliveries & Operations (Weeks 9-12)
*   **Sprint 5**: Branch Portal - Job Creation & Broadcast Engine (Redis).
*   **Sprint 6**: Driver App - Job Acceptance, Pickup/Dropoff Flow, POD Capture.

### Phase 4: Customer Experience (Weeks 13-16)
*   **Sprint 7**: Customer App - Booking Interface, Pricing Engine.
*   **Sprint 8**: Real-time Tracking - Firebase GPS Sync, Live Map (Driver & Customer).

### Phase 5: Finance & Payments (Weeks 17-20)
*   **Sprint 9**: Online Payments - Maya Checkout Integration.
*   **Sprint 10**: Financial Ledger - Earnings Calculation, COD Settlement Workflow.

### Phase 6: Scale & Polish (Weeks 21-24)
*   **Sprint 11**: Driver Payouts - Maya Disbursement, Wallet System.
*   **Sprint 12**: HQ Portal Analytics, Load Testing, Security Audit, Launch.

---

## 7. Database Core Schema (Key Tables)

```sql
-- Users & Auth
riders (id, name, phone, vehicle_type, branch_id, status, current_lat, current_lng)
customers (id, name, phone, email)
branches (id, name, type, lat, lng, service_radius)

-- Operations
delivery_jobs (id, tracking_uuid, sender_id, rider_id, branch_id, status, pickup_address, dropoff_address, price)
job_offers (id, job_id, rider_id, status, expires_at)
proof_of_deliveries (id, job_id, photo_url, signature_url, recipient_name, location)

-- Finance (Double Entry Style)
ledger_entries (id, user_id, type, amount, balance_after, reference_id, status)
payments (id, job_id, provider, reference_no, amount, status, payload_json)
payout_requests (id, rider_id, amount, status, approved_by)
```

---

## 8. Requirements Traceability Matrix (RTM)

| ID | Requirement | Status | Module |
| :--- | :--- | :--- | :--- |
| **FR-01** | Rider Auto-Registration via OTP | Planned | Driver App |
| **FR-02** | Branch Approval Workflow for Riders | Planned | Branch Portal |
| **FR-03** | Broadcast Dispatch Logic (Radius/Vehicle) | Planned | Backend |
| **FR-04** | Real-time GPS Tracking | Planned | Firebase |
| **FR-05** | Proof of Delivery (Photo/Sign) | Planned | Driver App |
| **FR-06** | Customer Pricing Engine | Planned | Backend |
| **FR-07** | Online Payment (Maya) | Planned | API |
| **FR-08** | COD Remittance & Verification | Planned | Branch Portal |
| **FR-09** | Financial Ledger & Payouts | Planned | HQ Portal |
| **FR-10** | Global Network Analytics | Planned | HQ Portal |