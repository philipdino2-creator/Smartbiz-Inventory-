# Smartcore Ledger — Small Business Sales & Expense Tracker

> **Learn. Create. Innovate.**  
> Official centralized sales, expense, debt tracking, and cash-flow management system for **Smartcore ICT Centre** (Asaba, Delta State, Nigeria), built for small businesses, computer schools, ICT training academies, retail shops, and service providers.

---

## 1. Project Overview

Smartcore Ledger is a production-ready, mobile-first financial management and cash flow system. It eliminates fragmented spreadsheets, paper receipts, scattered WhatsApp notes, and manual registers by unifying:

- **Daily Sales & Enrollments**: Fast 30-second transaction recording with line items, instant discount calculations, optional VAT, and printable receipts.
- **Operating Expenses Tracking**: Fuel for generators, BEDC/NEPA electricity tokens, Starlink internet subscriptions, maintenance, and facility costs.
- **Customer Debt Tracking (Receivables)**: Real-time balances of students/customers owing fees, with WhatsApp payment reminder generator and debt collection receipts.
- **Supplier Payables (Liabilities)**: Track credit supplies (fuel tab, hardware parts, printing supplies) and log settlements.
- **Profit & Loss Financial Engine**: Clear calculation of Revenue, Cost of Goods Sold (COGS), Gross Profit, Operating Expenses, and Estimated Net Profit.
- **Unified Transaction Ledger**: Chronological double-entry cash inflow and outflow audit journal with one-click CSV export.
- **Role-Based Access Control (RBAC)**: Support for Owner, Manager, and Staff roles with granular permissions.

---

## 2. Tech Stack

- **Frontend Framework**: React 19, TypeScript
- **Bundler & Build**: Vite 8
- **Styling**: Tailwind CSS v4, Plus Jakarta Sans & JetBrains Mono tabular typography
- **Icons**: Lucide React
- **Animations**: Motion
- **Persistence**: Multi-tenant state engine with reactive LocalStorage cache & full JSON backup/restore
- **Math & Financial Engine**: Deterministic calculation engine tested for zero-rounding error across partial payments, discounts, and VAT.

---

## 3. Nigerian Business Context & Defaults

- **Default Organization**: Smartcore ICT Centre
- **Address**: 12 RN Okonkwo Street, Off Okpanam, By Jarkata Hotel, Opp. Paxpen Table Water, Asaba, Delta State, Nigeria
- **Currency**: Nigerian Naira (`₦` NGN), formatted as `₦150,000.00`
- **Timezone**: `Africa/Lagos`
- **Payment Channels Supported**: Cash, Bank Transfer (Zenith, GTBank, Access, OPay, PalmPay), POS Terminal Card, Online Card.
- **Localized Expense Categories**: Fuel (Diesel for Lab Generator), Electricity (BEDC Tokens), Internet Data (Starlink), Staff Allowances, Equipment Maintenance, Printing & Stationery.

---

## 4. Getting Started & Development

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
git clone <repository_url>
cd <repository_folder>
npm install
```

### Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key variables:
- `GEMINI_API_KEY`: Injected automatically in AI Studio runtime.
- `APP_URL`: The Cloud URL for the application.

### Running the Development Server
```bash
npm run dev
```
The server will run on `http://localhost:3000`.

### Running Financial Calculation Tests
To run the automated calculation test suite:
```bash
npx tsx src/utils/runTests.ts
```

### Building for Production
```bash
npm run build
```
Generates optimized static assets in `/dist`.

---

## 5. Security & Multi-Tenancy Architecture

1. **Multi-Tenancy Foundation**: Every entity (`Sale`, `Expense`, `Customer`, `Payable`, `ProductService`, `AuditLog`) contains an authoritative `businessId`.
2. **Deterministic Calculations**: Subtotal, discount, VAT, amount paid, and balance due are calculated via `calculateSaleTotals()` with zero rounding drift.
3. **Role-Based Restrictions**:
   - `Owner`: Unrestricted access, business profile editing, full P&L reports, user management, record deletion.
   - `Manager`: Transaction recording, catalog management, customer accounts, operational reports.
   - `Staff`: Fast sales & expense recording, receipt generation (restricted from deleting records or viewing confidential P&L reports).
4. **Auditability**: All transactional actions automatically log user ID, role, action, and timestamp into the immutable `auditLogs` store.

---

## 6. License
© Smartcore ICT Centre. All rights reserved.
