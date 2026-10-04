# Product Roadmap & Technical Debt Log

## 1. Completed MVP Features (Day 1 - Day 7 Scope)

- [x] **Multi-Tenant Foundation & Schema**: Business entity structure with multi-user RBAC (`owner`, `manager`, `staff`).
- [x] **Executive & Mobile Dashboard**:
  - Today's Sales, Today's Expenses, Today's Net Profit.
  - Month's Sales, Month's Expenses, Month's Profit.
  - Customer Receivables (Debts owed to business) with 1-click collection.
  - Supplier Payables (Liabilities owed to vendors) with 1-click settlement.
  - Interactive SVG 7-Day Performance trend chart with daily tooltips.
  - Expense Category Share breakdown chart.
  - Low stock inventory alert widget.
- [x] **Fast Sales & Course Invoicing Module**:
  - Line items with product/service picker, unit price, quantity, and item discounts.
  - Overall sale discount and optional 7.5% VAT toggle.
  - Payment method (Cash, Bank Transfer, POS, Mobile Payment).
  - Amount paid & automatic balance due calculation.
  - Official printable/downloadable A4 / POS receipt with Smartcore branding.
- [x] **Operating Expenses Module**:
  - Categorized expenses (Fuel, Generator, Electricity/NEPA, Internet, Salaries, Maintenance, Rent).
  - Custom category builder.
  - Payee/vendor tracking and receipt reference numbers.
- [x] **Customer Debt Tracking & Receivables**:
  - Debtors list filtered by outstanding balance.
  - Direct debt settlement modal.
  - Polite Nigerian business WhatsApp reminder message generator.
  - Customer purchase history drawer.
- [x] **Supplier Payables (Liabilities)**:
  - Tracking generator diesel on tab, hardware supplies, and credit commitments.
  - Automatic cash outflow expense entry upon debt payment.
- [x] **Course & Product Inventory**:
  - Distinction between Training Courses (Services) and Physical Hardware (Products).
  - Stock levels with minimum threshold alert.
  - Gross profit margin percentage per item.
- [x] **Unified Transaction Ledger**:
  - Chronological double-entry cash flow journal.
  - CSV export for accountants and external audits.
- [x] **Financial Statements & Reports**:
  - Audited Profit & Loss (P&L) statement (Revenue - COGS = Gross Profit - OPEX = Net Profit).
  - Sales by payment channel report.
  - Debtors and Payables aging report.
- [x] **Settings & Security**:
  - Company profile configuration.
  - Role switcher and permissions guard.
  - Immutable audit logs.
  - Full JSON backup export and demo restore.
- [x] **Comprehensive Calculation Unit Tests**:
  - Automated test runner verifying zero calculation errors.

---

## 2. Phase 2 Features (Post-MVP)

- [ ] **Direct Online Payment Gateways**: Integration with Paystack, Flutterwave, and OPay Webhook verification.
- [ ] **Automated WhatsApp & SMS Gateway**: Automated receipts and payment reminder dispatch via Termii / Twilio / WhatsApp Cloud API.
- [ ] **Student Academy LMS Integration**: Linking course enrollments directly to class attendance, exams, and certificates.
- [ ] **Multi-Branch Management**: Allowing multiple academy centres (e.g. Asaba main branch, Warri branch, Benin branch).
- [ ] **Staff Payroll & Commission Engine**: Automatic calculation of instructor stipends per course cohort.
- [ ] **Barcode / QR Code Scanner**: Mobile camera barcode scanning for retail computer accessories.

---

## 3. Technical Debt & Architecture Notes

- **Persistence Layer**: Currently running on client-side state with reactive LocalStorage persistence and JSON backups. Ready for migration to PostgreSQL or Cloud SQL backend without UI schema refactoring.
- **Offline First**: The application functions without internet connection, ideal for Nigerian power/connectivity fluctuations.
