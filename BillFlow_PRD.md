**BILLFLOW**

**Invoicing · Billing · Accounting SaaS**

*Product Requirements Document (PRD) \| v1.0*

Built for Small & Mid-Size Businesses \| Next.js + Node.js + PostgreSQL

  -----------------------------------------------------------------------
  **Status**        **Version**       **Date**          **Target Market**
  ----------------- ----------------- ----------------- -----------------
  **DRAFT**         1.0               2025              SMB Global

  -----------------------------------------------------------------------

# **1. Product Overview**

BillFlow is a cloud-native, AI-powered invoicing, billing, and
accounting SaaS platform purpose-built for small and mid-size
businesses. It replaces fragmented, manual, and outdated financial
toolchains with a single, elegant, intelligent workspace that handles
the full lifecycle of business finance --- from quote to cash, purchase
order to payment, stock management to statutory compliance.

Unlike legacy desktop tools, BillFlow is built mobile-first, operates
across web and mobile, delivers real-time financial intelligence powered
by AI, and requires zero accounting background to operate effectively.

## **1.1 Mission Statement**

+-----------------------------------------------------------------------+
| **Mission**                                                           |
|                                                                       |
| Empower every SMB owner to run their finances with the confidence of  |
| a CFO --- without needing one. BillFlow makes invoicing instant,      |
| accounting invisible, and growth insights actionable.                 |
+=======================================================================+
+-----------------------------------------------------------------------+

## **1.2 Target Users**

  -----------------------------------------------------------------------
  **User Type**         **Profile**
  --------------------- -------------------------------------------------
  **Micro Business      Shopkeepers, freelancers, home businesses --- 1-5
  Owner**               employees. Need speed, simplicity, mobile access.

  **Growing SMB**       Trading businesses, distributors, service firms
                        --- 5--100 employees. Need inventory, multi-user,
                        and reporting.

  **Accountant /        Manages accounts for multiple clients. Needs bulk
  Bookkeeper**          operations, multi-business switching, GST/tax
                        filings.

  **Sales Executive**   Field sales staff who create quotations and
                        invoices on the go from a mobile device.

  **Business Owner +    Oversees operations, monitors dashboards,
  Manager**             approves transactions, views reports remotely.
  -----------------------------------------------------------------------

## **1.3 Tech Stack**

  -----------------------------------------------------------------------
  **Layer**             **Technology**
  --------------------- -------------------------------------------------
  **Frontend**          Next.js 14+ (App Router), TypeScript,
                        TailwindCSS, Shadcn/UI, React Query

  **Backend API**       Node.js + Express, TypeScript, RESTful API +
                        WebSockets for real-time features

  **Database**          PostgreSQL (primary), Redis (caching & sessions),
                        S3-compatible storage for files

  **Auth**              NextAuth.js / JWT with refresh tokens, OAuth 2.0
                        (Google, Microsoft)

  **AI Layer**          OpenAI GPT-4o / Claude API for AI features,
                        LangChain for agents, pgvector for embeddings

  **Infra**             Docker, CI/CD via GitHub Actions, AWS / GCP
                        deployment, CDN for assets

  **Payments**          Razorpay / Stripe gateway integration, UPI QR
                        code generation

  **Communications**    WhatsApp Business API, Twilio (SMS), Nodemailer /
                        SendGrid (email)
  -----------------------------------------------------------------------

# **2. Core Feature Modules**

BillFlow is organized into 12 core modules, each representing a distinct
domain of business finance management. All modules are deeply
interconnected --- an action in one automatically cascades to relevant
others.

## **Module 1: Invoicing & Billing**

### **1.1 Sales Invoice Creation**

  -----------------------------------------------------------------------
  **Feature**           **Description**
  --------------------- -------------------------------------------------
  **Smart Invoice       Drag-and-drop line item editor with real-time
  Builder**             calculations. Auto-complete product names,
                        HSN/SAC codes, tax rates as user types.

  **Multiple Invoice    Supports Tax Invoice, Proforma Invoice,
  Types**               Commercial Invoice, E-Invoice, Credit Note, Debit
                        Note, Delivery Challan in a unified flow.

  **Tax Engine**        Configurable multi-tier tax: GST
                        (CGST/SGST/IGST), VAT, service tax, TDS/TCS,
                        composite tax groups. Per-line and per-invoice
                        tax application.

  **Invoice Templates** 20+ premium, fully customizable invoice themes.
                        Upload brand logo, choose color scheme, fonts,
                        layout. Per-business branding.

  **Custom Fields**     Add any custom fields (PO number, vehicle number,
                        terms, etc.) per invoice or as a default template
                        setting.

  **Serial & Batch      Attach serial/batch numbers to line items for
  Numbers**             traceability.

  **Discounts**         Item-level and invoice-level discounts (flat or
                        percentage). Cascades into tax calculations
                        correctly.

  **Multi-Currency**    Create invoices in any currency with live
                        exchange rate fetching. Report in base currency.

  **Recurring           Set invoices to auto-generate on
  Invoices**            daily/weekly/monthly/custom schedules. Auto-send
                        upon generation.

  **Invoice Cloning**   Duplicate any past invoice as a starting point
                        for a new one. One-click repeat billing.
  -----------------------------------------------------------------------

### **1.2 Invoice Sharing & Delivery**

  -----------------------------------------------------------------------
  **Feature**           **Description**
  --------------------- -------------------------------------------------
  **WhatsApp Sharing**  One-click share invoice as PDF or shareable link
                        directly via WhatsApp Business API.

  **Email Delivery**    Send invoice via email with customizable
                        subject/body. Tracks open status.

  **SMS Sharing**       Send invoice link via SMS with payment button
                        embedded.

  **Customer Portal     Each invoice has a unique shareable URL where the
  Link**                customer can view, download, and pay directly.

  **E-Invoice / IRN     Generate IRN (Invoice Reference Number) for
  Generation**          e-invoicing compliance directly in-app.

  **E-Way Bill**        Generate E-Way Bill for goods movement with
                        auto-prefilled transporter details.

  **Bulk Invoice        Send multiple invoices to multiple customers in a
  Sending**             single batch operation.

  **Print Support**     Laser, inkjet, and thermal (58mm/80mm) printer
                        support. POS-style fast print mode.
  -----------------------------------------------------------------------

### **1.3 Quotation & Estimates**

-   Create professional quotations with item details, validity period,
    > and terms

-   Convert quotation to invoice, purchase order, or delivery challan
    > with one click

-   Quotation revision history with version tracking

-   Acceptance tracking: customer can accept/reject quote via portal
    > link

-   Quotation approval workflow for multi-user teams

### **1.4 Payment Collection**

  -----------------------------------------------------------------------
  **Feature**           **Description**
  --------------------- -------------------------------------------------
  **Online Payment      Embed a Pay Now button in invoice
  Link**                emails/WhatsApp. Customer pays via UPI, card,
                        netbanking.

  **QR Code Payments**  Generate UPI QR code per invoice for instant
                        in-store scan-to-pay.

  **Partial Payments**  Record multiple partial payments against a single
                        invoice. Outstanding balance auto-tracked.

  **Payment Modes**     Cash, cheque, UPI, NEFT/RTGS, card, credit,
                        advance --- all tracked with reference numbers.

  **Advance Receipts**  Record customer advance payments. Adjust against
                        future invoices automatically.

  **Payment Reminders** Automated WhatsApp/SMS/email reminders at
                        configurable intervals (e.g., 7 days before due,
                        on due date, 3/7/14 days overdue).
  -----------------------------------------------------------------------

## **Module 2: Purchase Management**

  -----------------------------------------------------------------------
  **Feature**           **Description**
  --------------------- -------------------------------------------------
  **Purchase Orders     Create, send, and track purchase orders to
  (PO)**                suppliers. Status: Draft → Sent → Confirmed →
                        Received.

  **Purchase Invoices** Record supplier bills. One-click conversion from
                        received PO. Auto-updates stock.

  **Purchase Returns**  Create debit notes for returned goods.
                        Auto-adjusts supplier outstanding.

  **Supplier Advance    Record advance payments to suppliers; adjust
  Payment**             against future invoices.

  **GRN (Goods Receipt  Record partial or full goods received against a
  Note)**               PO before generating purchase invoice.

  **Multi-Supplier      Create one RFQ and send to multiple suppliers.
  Comparison**          Compare responses side-by-side.

  **Recurring           Set auto-reminders or auto-generate recurring
  Purchases**           purchase orders for regular supplies.

  **Bill Approval       Multi-level purchase bill approval before payment
  Workflow**            --- essential for teams.
  -----------------------------------------------------------------------

## **Module 3: Inventory & Stock Management**

  -----------------------------------------------------------------------
  **Feature**           **Description**
  --------------------- -------------------------------------------------
  **Product Catalog**   Rich product master: name, description, category,
                        HSN/SAC code, unit, purchase price, sale price,
                        tax group, images.

  **Multi-Unit of       Define primary and secondary units (e.g., box vs.
  Measure**             pieces) with conversion ratios.

  **Real-Time Stock     Stock auto-updates on every
  Tracking**            sale/purchase/transfer. Live stock dashboard.

  **Low Stock Alerts**  Set reorder level per product. Receive in-app,
                        email, or WhatsApp alerts when stock hits
                        threshold.

  **Stock Adjustment**  Manual stock in/out entries with reason codes
                        (damage, loss, opening stock, etc.).

  **Barcode / QR Code** Generate, print, and scan barcodes per product.
                        Scan to add items during invoicing (camera or
                        scanner).

  **Batch & Expiry      Assign batch numbers and expiry dates. Alerts for
  Tracking**            near-expiry stock. FIFO/LIFO/FEFO costing.

  **Serial Number       Assign and track unique serial numbers per item
  Tracking**            sold or purchased.

  **Multi-Warehouse**   Manage stock across multiple
                        locations/warehouses. Inter-warehouse transfer
                        with stock movement records.

  **Stock Valuation**   View stock value at purchase cost, average cost,
                        or MRP. Valuation report by category/location.

  **Manufacturing /     Create Bills of Materials. Deduct raw material
  BOM**                 stock on production; add finished goods to
                        inventory.

  **Stock Audit Trail** Complete history of every stock movement --- who
                        changed what, when, and why.
  -----------------------------------------------------------------------

## **Module 4: Parties --- Customers & Suppliers**

  -----------------------------------------------------------------------
  **Feature**           **Description**
  --------------------- -------------------------------------------------
  **Unified Party       Single ledger for customers and suppliers. Toggle
  Master**              party type. Supports individual and organization.

  **Contact Details**   Name, GSTIN, PAN, email, phone, billing/shipping
                        address. Multiple contacts per party.

  **Transaction         Complete timeline of all invoices, payments,
  History**             returns, and communications with a party.

  **Outstanding         Real-time receivable/payable balance per party.
  Balances**            Aging analysis (0-30, 30-60, 60-90, 90+ days).

  **Credit Limits**     Set credit limits per customer. Warning or block
                        on invoice creation when exceeded.

  **Payment Terms**     Set default payment terms (Net 15, Net 30, etc.)
                        per party. Auto-populates on invoices.

  **Statement of        Generate and share party-wise account statement
  Account**             for any date range. Send via WhatsApp/email.

  **Bulk Import**       Import customers/suppliers from Excel/CSV.
                        Duplicate detection and merge on import.

  **Party Groups /      Tag parties by type (retail, wholesale, VIP) for
  Tags**                segmented reporting and bulk communication.
  -----------------------------------------------------------------------

## **Module 5: Accounting & Bookkeeping**

### **5.1 Chart of Accounts**

-   Pre-configured chart of accounts following standard double-entry
    > bookkeeping

-   Create, edit, and organize accounts under Assets, Liabilities,
    > Income, Expense, Equity

-   Sub-ledger support --- unlimited depth of account hierarchy

-   Account-wise ledger with transaction history

### **5.2 Journal Entries**

-   Manual journal entries with debit/credit pairs and narration

-   Journal entry templates for recurring entries

-   Bulk journal import via CSV

-   Approval workflow for journal entries above threshold

### **5.3 Cash & Bank Management**

  -----------------------------------------------------------------------
  **Feature**           **Description**
  --------------------- -------------------------------------------------
  **Multiple Bank       Add unlimited bank accounts. Record all bank
  Accounts**            transactions manually or via import.

  **Bank                Import bank statement (CSV/OFX). Auto-match
  Reconciliation**      transactions. Flag unmatched entries for review.

  **Cash Book**         Track all cash inflows/outflows. Petty cash
                        management with daily closing balance.

  **Cheque Management** Track issued and received cheques by status:
                        issued, cleared, bounced, cancelled.

  **Inter-Account       Record funds transfer between bank/cash accounts.
  Transfer**            Auto-creates contra entries.
  -----------------------------------------------------------------------

### **5.4 Expense Tracking**

-   Create expense categories (rent, salaries, utilities, travel,
    > marketing, etc.)

-   Record expenses with date, category, amount, payment mode, notes,
    > and receipt photo

-   Recurring expenses (rent, subscriptions) auto-created on schedule

-   Expense approval workflow for team-based spending control

-   Attach digital receipts and supporting documents to expense entries

### **5.5 Financial Statements**

  -----------------------------------------------------------------------
  **Statement**         **Description**
  --------------------- -------------------------------------------------
  **Profit & Loss       Income vs. expenses for any period. By month,
  (P&L)**               quarter, or custom range. Comparative periods.

  **Balance Sheet**     Real-time snapshot of assets, liabilities, and
                        equity. Drill down into any line item.

  **Cash Flow           Operating, investing, financing cash flows.
  Statement**           Direct and indirect method support.

  **Trial Balance**     Debit/credit balances for all accounts at any
                        date. Export to Excel or PDF.

  **Day Book / General  Day-wise and account-wise transaction listing.
  Ledger**              Full audit trail.
  -----------------------------------------------------------------------

## **Module 6: Tax & Compliance**

  -----------------------------------------------------------------------
  **Feature**           **Description**
  --------------------- -------------------------------------------------
  **GST / VAT           Configure tax rates, tax groups, cess. Map to
  Configuration**       products/services. Support for multiple tax
                        regimes.

  **GST Reports**       Auto-generate GSTR-1, GSTR-2, GSTR-3B.
                        Reconciliation between sales and purchase tax.

  **Tax Summary**       Tax collected vs. tax paid summary. Net payable
                        calculation for filing.

  **TDS / TCS           Record TDS deductions on applicable transactions.
  Tracking**            Generate TDS certificates.

  **E-Invoice           Direct IRN generation from invoice screen via
  Integration**         GSTN API. QR code auto-embedded in invoice PDF.

  **HSN/SAC Code        Searchable HSN/SAC code database auto-populated
  Master**              on product creation based on product description.

  **Multi-Region Tax**  Support for Indian GST, UAE VAT, US Sales Tax, EU
                        VAT --- configurable at business level.

  **GSTR Filing         Export GST data in JSON/Excel format compatible
  Export**              with GSTN portal for direct upload.
  -----------------------------------------------------------------------

## **Module 7: Reports & Analytics**

### **7.1 Sales Reports**

-   Sales Summary by day, week, month, quarter, year

-   Sales by Party --- top customers, customer revenue trend

-   Sales by Product --- best-selling items, slow movers

-   Sales by Category / Salesperson / Region

-   Invoice-wise profitability report (sale price vs. purchase cost)

-   Pending / Overdue invoice aging report

### **7.2 Purchase Reports**

-   Purchase summary by period, supplier, product

-   Supplier-wise outstanding payables

-   Purchase vs. sales ratio by product

-   PO fulfillment status report

### **7.3 Inventory Reports**

-   Stock summary --- current stock level, value, turnover ratio

-   Low stock / out-of-stock report

-   Near-expiry / expired batch report

-   Slow-moving / fast-moving items analysis

-   Stock ledger --- complete movement history per product

### **7.4 Financial Reports**

-   P&L, Balance Sheet, Cash Flow, Trial Balance (see Section 5.5)

-   Expense analysis by category, vendor, time period

-   Cash flow forecast (AI-powered --- see Section 11)

-   Profitability by product/category/customer/salesperson

All reports support: date range filtering, drill-down to source
transactions, export to Excel/PDF/CSV, scheduled email delivery.

## **Module 8: Payments & Receivables**

  -----------------------------------------------------------------------
  **Feature**           **Description**
  --------------------- -------------------------------------------------
  **Payment Gateway     Razorpay, Stripe, PayPal integration. Payments
  Integration**         auto-reconcile against open invoices.

  **Payment Links**     Generate standalone payment links (without
                        invoice) for advances, deposits, subscriptions.

  **Collections         Centralized view of all outstanding receivables
  Dashboard**           with aging, follow-up status, contact details.

  **Automated           Configurable automated reminder sequences over
  Follow-Ups**          WhatsApp, SMS, email based on invoice due date.

  **Write-Off / Bad     Mark invoices as written off or bad debt with
  Debt**                proper accounting treatment.

  **Credit Note         Issue credit notes against returned goods or
  Issuance**            billing adjustments. Auto-adjusts outstanding.

  **Customer            One-click send customer account statement for any
  Statements**          period via WhatsApp/email.
  -----------------------------------------------------------------------

## **Module 9: Team & Access Management**

  -----------------------------------------------------------------------
  **Feature**           **Description**
  --------------------- -------------------------------------------------
  **Role-Based Access   Pre-defined roles: Owner, Admin, Accountant,
  Control**             Sales, Inventory Manager, Viewer. Fully
                        customizable.

  **Granular            Module-level and action-level permissions
  Permissions**         (create, read, edit, delete, approve, export).

  **Multi-User          Multiple team members can work simultaneously.
  Collaboration**       Real-time data updates across sessions.

  **Activity Log /      Every action logged with user, timestamp, IP, and
  Audit Trail**         before/after state. Immutable audit trail.

  **Multi-Business**    One account manages multiple business entities.
                        Switch context with one click.

  **Salesperson         Assign invoices/parties to salespersons. Track
  Tracking**            performance metrics per salesperson.

  **Approval            Set approval thresholds for invoices, expenses,
  Workflows**           purchase orders requiring manager sign-off.

  **Two-Factor          TOTP-based 2FA for all accounts. Force 2FA for
  Authentication**      admin users.
  -----------------------------------------------------------------------

## **Module 10: Business Dashboard & Command Center**

  -----------------------------------------------------------------------
  **Widget / View**     **Description**
  --------------------- -------------------------------------------------
  **Revenue Snapshot**  Today\'s / this week\'s / this month\'s revenue
                        with trend sparkline vs. previous period.

  **Cash Position**     Total cash + bank balance. Running total of all
                        accounts. Net cash position.

  **Receivables vs.     Side-by-side outstanding amounts. Color-coded
  Payables**            aging buckets.

  **Top Customers**     Top 5-10 customers by revenue this period.
                        One-click drill-down.

  **Best-Selling        Top products by quantity and revenue. Inventory
  Products**            status overlaid.

  **Expense Breakdown** Donut chart of expenses by category. Month vs.
                        last month comparison.

  **Invoice Pipeline**  Funnel showing: Total Invoiced → Paid → Partially
                        Paid → Overdue.

  **Low Stock Alerts**  Live list of items below reorder level. One-click
                        to create PO.

  **Recent Activity     Chronological feed of recent transactions,
  Feed**                payments received, new customers added.

  **Customizable        Drag-and-drop dashboard widgets. Save multiple
  Layout**              dashboard views per user.
  -----------------------------------------------------------------------

## **Module 11: Communications & Customer Engagement**

  -----------------------------------------------------------------------
  **Feature**           **Description**
  --------------------- -------------------------------------------------
  **WhatsApp Business   Send invoices, payment reminders, statements,
  API**                 order updates directly via WhatsApp with business
                        sender ID.

  **Bulk Messaging**    Send promotional messages, statements, or
                        reminders to customer segments in bulk.

  **Email Templates**   Pre-built and customizable email templates for
                        invoices, reminders, thank-you notes, statements.

  **SMS Gateway**       Transactional SMS for invoice delivery, payment
                        confirmation, reminders.

  **Customer Portal**   Self-service portal where customers log in to
                        view their invoices, payment history, and make
                        payments.

  **Notification        In-app, push, and email notifications for all key
  Center**              events (payment received, invoice overdue, low
                        stock, etc.).
  -----------------------------------------------------------------------

## **Module 12: Integrations & Data Management**

  -----------------------------------------------------------------------
  **Integration**       **Description**
  --------------------- -------------------------------------------------
  **Excel / CSV         Bulk import products, parties, opening stock,
  Import-Export**       transactions. Export any data to Excel.

  **Tally Export**      Export accounting data in Tally-compatible XML
                        format for businesses migrating or syncing.

  **Bank Statement      Upload bank statements in CSV/OFX/MT940 for
  Import**              reconciliation.

  **E-Commerce          Sync orders from Shopify, WooCommerce, Amazon,
  Connectors**          Flipkart. Auto-create invoices and deduct stock.

  **Payment Gateway     Auto-sync payment status from Razorpay/Stripe.
  Sync**                Reconcile against open invoices.

  **GSTN API**          Direct e-invoice IRN generation, e-way bill
                        creation, GSTIN validation via NIC/GSTN APIs.

  **Open REST API**     Public API with OAuth for third-party
                        integrations. Webhooks for real-time event
                        notifications.

  **Zapier / n8n        No-code automation triggers (e.g., invoice paid →
  Webhooks**            update CRM, new customer → add to mailing list).
  -----------------------------------------------------------------------

# **3. User Experience & Design System**

BillFlow\'s design philosophy is Premium Simplicity --- the interface
must feel as polished as Stripe or Linear while remaining accessible to
a shop owner with no accounting background. Every screen should convey
confidence, clarity, and speed.

## **3.1 Design Principles**

  -----------------------------------------------------------------------
  **Principle**         **What It Means in Practice**
  --------------------- -------------------------------------------------
  **Zero Training       Any task completable in under 60 seconds without
  Required**            documentation. Contextual tooltips, not manuals.

  **Speed First**       Invoice creation under 30 seconds for repeat
                        customers. Keyboard shortcuts for power users.

  **Mobile Parity**     100% feature parity on mobile. PWA with offline
                        support. No stripped-down \'lite\' mobile
                        version.

  **Consistent Design   Unified component library (Shadcn/UI + custom).
  Language**            Every button, form, table follows the same
                        pattern.

  **Delight in          Smooth transitions, micro-animations, confetti on
  Details**             first invoice --- moments that make the product
                        memorable.

  **Accessible**        WCAG 2.1 AA compliance. Full keyboard navigation,
                        screen reader support, sufficient color contrast.
  -----------------------------------------------------------------------

## **3.2 Key UX Patterns**

-   Command Palette (Cmd+K): Universal search and action launcher ---
    > find any invoice, customer, product, or feature instantly

-   Contextual Right Panel: Click any item to see details in a side
    > panel without navigating away from the list

-   Inline Editing: Edit invoice line items, party details, and product
    > info directly in the table without modal popups

-   Smart Autofill: Product name, price, tax rate, HSN code
    > auto-populate as user types --- powered by fuzzy search

-   Undo / Redo: Ctrl+Z for accidental deletions and changes throughout
    > the application

-   Breadcrumb Navigation: Always know where you are. Deep-link to any
    > record.

-   Bulk Actions: Select multiple records for batch delete, export, tag,
    > share, or status change

-   Empty State Guidance: New users see illustrated empty states with
    > one-click getting-started CTAs, not blank screens

## **3.3 Navigation Architecture**

Left sidebar with collapsible modules. Top bar for global search,
notifications, and user settings. Main content area uses a master-detail
layout. Floating Action Button (FAB) on mobile for quick invoice
creation.

Primary navigation items: Dashboard, Sales (Invoices, Quotations,
Customers, Payments), Purchases (POs, Bills, Suppliers), Inventory
(Products, Stock, Warehouses), Accounting (Ledgers, Journal, Bank,
Expenses), Reports, Settings.

# **4. Database Schema Overview**

PostgreSQL is the primary database. Below are the core entities and
their relationships.

  -------------------------------------------------------------------------
  **Entity / Table**      **Key Attributes**
  ----------------------- -------------------------------------------------
  **businesses**          id, name, gstin, address, logo_url, tax_config,
                          currency, timezone, plan_id

  **users**               id, business_id, name, email, password_hash,
                          role, 2fa_secret, last_active

  **parties**             id, business_id, name, type
                          (customer/supplier/both), gstin, pan, email,
                          phone, credit_limit, payment_terms

  **products**            id, business_id, name, sku, hsn_sac, category_id,
                          unit, purchase_price, sale_price, tax_group_id,
                          track_inventory

  **invoices**            id, business_id, type, party_id, number, date,
                          due_date, status, subtotal, tax_amount, discount,
                          total, notes, currency

  **invoice_items**       id, invoice_id, product_id, description, qty,
                          unit, unit_price, discount, tax_amount, total

  **payments**            id, business_id, invoice_id, party_id, amount,
                          date, mode, reference, status, gateway_txn_id

  **purchase_orders**     id, business_id, party_id, number, date, status,
                          total

  **purchase_invoices**   id, business_id, party_id, po_id, number, date,
                          total, status

  **stock_entries**       id, business_id, product_id, warehouse_id, type,
                          qty, batch, expiry, cost, invoice_ref

  **warehouses**          id, business_id, name, location, is_default

  **accounts**            id, business_id, name, type, parent_id, code,
                          opening_balance

  **journal_entries**     id, business_id, date, narration, reference,
                          created_by

  **journal_lines**       id, journal_id, account_id, debit, credit,
                          party_id, invoice_ref

  **expenses**            id, business_id, category_id, amount, date,
                          payment_mode, account_id, notes, receipt_url

  **tax_groups**          id, business_id, name, components (JSONB:
                          \[{name, rate, type}\])

  **notifications**       id, business_id, user_id, type, title, body,
                          read, created_at
  -------------------------------------------------------------------------

# **5. API Architecture**

## **5.1 API Design Principles**

-   RESTful design with consistent resource naming (/api/v1/invoices,
    > /api/v1/parties, etc.)

-   JWT authentication with refresh token rotation

-   Rate limiting: 1000 req/min per business (configurable per plan)

-   Request/response validation using Zod schemas

-   Standardized error response format: { error: { code, message,
    > details } }

-   Pagination: cursor-based for large datasets

-   Field filtering: ?fields=id,number,total to reduce payload

-   Webhook delivery with retry logic and HMAC signature verification

## **5.2 Core API Endpoints**

  -----------------------------------------------------------------------
  **Endpoint Group**    **Key Endpoints**
  --------------------- -------------------------------------------------
  **Auth**              POST /auth/login, /auth/register, /auth/refresh,
                        /auth/logout, /auth/2fa/setup, /auth/2fa/verify

  **Businesses**        GET/POST/PATCH /businesses, GET
                        /businesses/:id/dashboard, GET
                        /businesses/:id/stats

  **Invoices**          CRUD /invoices, POST /invoices/:id/send, POST
                        /invoices/:id/payments, GET /invoices/:id/pdf,
                        POST /invoices/:id/irn

  **Parties**           CRUD /parties, GET /parties/:id/statement, GET
                        /parties/:id/outstanding, GET
                        /parties/:id/transactions

  **Products**          CRUD /products, POST /products/bulk-import, GET
                        /products/:id/stock-history

  **Inventory**         GET /inventory/stock-summary, POST
                        /inventory/adjustments, GET /inventory/low-stock

  **Purchases**         CRUD /purchase-orders, CRUD /purchase-invoices,
                        POST /purchase-orders/:id/convert

  **Accounting**        CRUD /accounts, CRUD /journal-entries, GET
                        /reports/trial-balance, GET /reports/pl

  **Reports**           GET /reports/sales, /reports/purchases,
                        /reports/inventory, /reports/gst,
                        /reports/cashflow

  **Payments**          CRUD /payments, POST /payment-links, GET
                        /payment-links/:id/status
  -----------------------------------------------------------------------

# **6. Subscription & Pricing Architecture**

  -----------------------------------------------------------------------
  **Plan**              **Target + Features**
  --------------------- -------------------------------------------------
  **Starter (Free)**    1 user, 1 business. Up to 30 invoices/month.
                        Basic inventory. Limited reports. No team
                        features. WhatsApp sharing. Unlimited parties.

  **Growth (\$12/mo)**  3 users, 1 business. Unlimited invoices. Full
                        inventory. GST reports. WhatsApp + email. Payment
                        reminders. Bank reconciliation.

  **Professional        10 users, 2 businesses. All Growth features +
  (\$29/mo)**           Multi-warehouse. E-invoice. Advanced reports.
                        Approval workflows. API access.

  **Enterprise          Unlimited users & businesses. All features.
  (\$79/mo)**           Priority support. Custom domain. Dedicated
                        onboarding. SLA guarantees. SSO.
  -----------------------------------------------------------------------

Annual billing offered at 20% discount. Add-ons: Extra businesses
(+\$8/business/mo), Extra users (+\$4/user/mo), WhatsApp Business API
(usage-based).

# **7. Security & Compliance**

-   All data encrypted at rest (AES-256) and in transit (TLS 1.3)

-   SOC 2 Type II compliance roadmap

-   GDPR-compliant data handling: data export, deletion requests,
    > consent logging

-   Immutable audit log: every data change logged with user, timestamp,
    > old/new values

-   Row-level security in PostgreSQL for multi-tenancy isolation

-   Business data is completely siloed --- zero cross-tenant data access

-   PCI-DSS compliance for payment handling (tokenization, no card data
    > storage)

-   Regular penetration testing. Bug bounty program.

-   Automated daily backups with 90-day retention and point-in-time
    > recovery

# **8. Performance & Reliability Requirements**

  -----------------------------------------------------------------------
  **Requirement**       **Target**
  --------------------- -------------------------------------------------
  **Invoice Creation    \< 500ms end-to-end
  (P99)**               

  **Dashboard Load**    \< 1.5s on 4G connection

  **PDF Generation**    \< 2s for standard invoice

  **Search Response**   \< 200ms for party/product search with 100k
                        records

  **Uptime SLA**        99.9% (Growth/Pro), 99.95% (Enterprise)

  **Report Generation** \< 5s for standard period reports up to 50k
                        transactions

  **Concurrent Users**  Handle 10,000 concurrent sessions without
                        degradation

  **Data Export**       Async job for exports \> 10,000 rows; email
                        download link on completion
  -----------------------------------------------------------------------

# **9. Mobile Application**

BillFlow will ship as a Progressive Web App (PWA) with optional native
wrapper (React Native / Expo) for app store distribution. The mobile app
must deliver full feature parity with the web, not a subset.

  -----------------------------------------------------------------------
  **Mobile Feature**    **Implementation**
  --------------------- -------------------------------------------------
  **Offline Mode**      Service Worker caches critical data. Invoice
                        creation and payment recording work offline. Sync
                        on reconnection.

  **Camera Barcode      Native camera API to scan product barcodes during
  Scan**                invoicing. No external scanner required.

  **Receipt Photo       Photo-to-expense: capture receipt photo, AI
  Capture**             extracts vendor/amount/date, auto-creates expense
                        entry.

  **WhatsApp Share**    Native share sheet integration for one-tap
                        invoice sharing to WhatsApp.

  **Biometric Auth**    Face ID / fingerprint login for quick, secure
                        access on return.

  **Push                Payment received, invoice overdue, low stock,
  Notifications**       approval required --- real-time push alerts.

  **Home Screen         Today\'s sales total, outstanding receivables ---
  Widgets**             at a glance without opening the app.

  **Thermal Printer     Bluetooth thermal printer support for immediate
  BT**                  in-store receipt printing.
  -----------------------------------------------------------------------

# **10. Onboarding & First-Run Experience**

-   5-step guided setup wizard: Business details → Tax configuration →
    > First product → First customer → Create first invoice

-   Sample data mode: Let users explore with pre-loaded demo data before
    > entering real records

-   One-click import from Tally, Zoho Books, QuickBooks, or Excel to
    > migrate existing data

-   Interactive product tour triggered on first login with skip option

-   Contextual tooltips and \'Pro Tip\' pop-overs for advanced features

-   In-app video tutorials for every major module (\< 2 minutes each)

-   Onboarding progress tracker: \'Your business setup is 60% complete\'

-   Dedicated CSM (Customer Success Manager) for Professional and
    > Enterprise plans

# **11. AI-Powered Features --- BillFlow\'s Competitive Edge**

This is where BillFlow goes beyond Vyapar and every other SMB billing
tool in the market. The AI layer transforms BillFlow from a recording
tool into a proactive business intelligence partner. These features are
grouped under \'BillFlow AI\' branding.

+-----------------------------------------------------------------------+
| **Strategic Vision**                                                  |
|                                                                       |
| While Vyapar and competitors record what happened, BillFlow\'s AI     |
| tells you what\'s happening, what will happen, and what you should do |
| about it. This is the paradigm shift from accounting software to a    |
| business co-pilot.                                                    |
+=======================================================================+
+-----------------------------------------------------------------------+

## **AI Feature 1: Intelligent Invoice Assistant**

+-----------------------------------------------------------------------+
| **🤖 AI-POWERED DIFFERENTIATOR**                                      |
|                                                                       |
| Natural language invoice creation: \'Create an invoice for Rajesh     |
| Traders for 50 units of cement at Rs. 350 each with 18% GST\' ---     |
| BillFlow AI populates the entire invoice form. No clicks required.    |
| Business owners who struggle with technology can dictate their        |
| invoices.                                                             |
+=======================================================================+
+-----------------------------------------------------------------------+

-   Voice-to-invoice via speech recognition --- speak the invoice
    > details, AI fills the form

-   Smart product suggestions based on party history: \'Rajesh usually
    > buys Product X --- add it?\'

-   Auto-detect tax category for new products based on product name
    > using AI classification

-   Duplicate invoice detection: AI warns when a very similar invoice
    > already exists for the same party and amount

## **AI Feature 2: Cash Flow Forecasting**

+-----------------------------------------------------------------------+
| **🤖 AI-POWERED DIFFERENTIATOR**                                      |
|                                                                       |
| BillFlow AI analyzes your historical payment patterns, recurring      |
| expenses, outstanding invoices, and seasonal trends to forecast your  |
| cash position for the next 30/60/90 days. It flags when you might     |
| face a cash crunch before it happens.                                 |
+=======================================================================+
+-----------------------------------------------------------------------+

-   \'Based on your patterns, you may face a cash shortage of Rs. 45,000
    > in 3 weeks\'

-   Scenario modeling: \'What if 3 of your overdue invoices are not
    > paid?\'

-   Recommended actions: \'Consider following up with Party X --- their
    > Rs. 1.2L is 45 days overdue\'

## **AI Feature 3: Smart Expense Categorization**

+-----------------------------------------------------------------------+
| **🤖 AI-POWERED DIFFERENTIATOR**                                      |
|                                                                       |
| Upload a receipt photo --- AI reads the vendor, date, amount, and     |
| expense category automatically using OCR + LLM. 95%+ accuracy. The    |
| business owner just reviews and confirms. No manual data entry for    |
| expenses.                                                             |
+=======================================================================+
+-----------------------------------------------------------------------+

-   Batch receipt scanning: photograph a pile of bills, AI processes
    > them all

-   Auto-detects recurring expenses and suggests creating a recurring
    > entry

-   Flags anomalies: \'This electricity bill is 40% higher than last
    > month\'

## **AI Feature 4: Accounts Receivable Co-Pilot**

+-----------------------------------------------------------------------+
| **🤖 AI-POWERED DIFFERENTIATOR**                                      |
|                                                                       |
| An AI agent that manages your collections intelligently. It analyzes  |
| each overdue customer\'s payment history, communication response, and |
| risk profile, then recommends the right message at the right time --- |
| and can send it automatically with your approval.                     |
+=======================================================================+
+-----------------------------------------------------------------------+

-   Prioritized collection queue: \'Focus on these 5 customers ---
    > highest recovery probability + highest amount\'

-   Personalized reminder tone: formal for new defaulters, gentle for
    > long-term customers

-   \'Party X has paid late 3 times --- recommend reducing their credit
    > limit to Rs. 50,000\'

-   Churn prediction: \'Party Y hasn\'t placed an order in 60 days ---
    > likely churned. Send a win-back offer?\'

## **AI Feature 5: Inventory Intelligence**

+-----------------------------------------------------------------------+
| **🤖 AI-POWERED DIFFERENTIATOR**                                      |
|                                                                       |
| AI analyzes sales velocity, seasonal patterns, and supplier lead      |
| times to recommend optimal reorder quantities and timing ---          |
| preventing both stockouts and overstock situations automatically.     |
+=======================================================================+
+-----------------------------------------------------------------------+

-   Demand forecasting: \'Product X typically sells 3x in December ---
    > stock up by November 15\'

-   Auto-generate purchase orders for low-stock items based on reorder
    > rules + AI demand forecast

-   Identify dead stock: \'These 12 products haven\'t moved in 90 days
    > --- consider a clearance pricing\'

-   Product bundling suggestions: \'Customers who buy A often also buy B
    > --- consider creating a bundle\'

## **AI Feature 6: Financial Health Score**

+-----------------------------------------------------------------------+
| **🤖 AI-POWERED DIFFERENTIATOR**                                      |
|                                                                       |
| BillFlow AI continuously monitors 15+ financial health indicators and |
| produces a Business Health Score (0-100) with weekly updates. Think   |
| of it as a credit score for your business operations --- instantly    |
| understandable, actionable, and motivating.                           |
+=======================================================================+
+-----------------------------------------------------------------------+

-   Score breakdown: Cash Flow (25%), Receivables (20%), Profitability
    > (20%), Inventory (15%), Payables (20%)

-   Week-over-week score trend with key drivers of improvement or
    > decline

-   Benchmarking: \'Your DSO (Days Sales Outstanding) of 42 days is
    > higher than the 31-day industry average\'

-   Actionable alerts: \'Your gross margin dropped 8% --- mostly driven
    > by Material Cost increase\'

## **AI Feature 7: Tax Optimization Assistant**

+-----------------------------------------------------------------------+
| **🤖 AI-POWERED DIFFERENTIATOR**                                      |
|                                                                       |
| AI scans your transactions and proactively identifies missed input    |
| tax credits, incorrectly categorized transactions, and tax-saving     |
| opportunities before you file.                                        |
+=======================================================================+
+-----------------------------------------------------------------------+

-   \'You missed claiming ITC on 3 purchase invoices worth Rs. 8,200 in
    > GST --- want to fix them?\'

-   Detect rate mismatches: product description vs. tax rate applied

-   Pre-filing checklist: \'Before filing GSTR-1, resolve these 4
    > discrepancies\'

-   Tax liability forecast: \'Your estimated GST payable this quarter is
    > Rs. 62,000\'

## **AI Feature 8: Conversational Business Q&A**

+-----------------------------------------------------------------------+
| **🤖 AI-POWERED DIFFERENTIATOR**                                      |
|                                                                       |
| An AI assistant embedded in the dashboard where business owners can   |
| ask questions in plain language and get instant answers from their    |
| own financial data --- no need to know which report to run.           |
+=======================================================================+
+-----------------------------------------------------------------------+

-   \'Who is my best customer this year?\' → Instant ranked list with
    > revenue

-   \'How much did I spend on freight last quarter?\' → Exact figure
    > with breakdown

-   \'Am I making money on Product X?\' → Margin analysis with
    > recommendation

-   \'Which invoices are overdue for more than 30 days?\' → Filtered
    > list, one click to send reminders

-   Powered by RAG (Retrieval-Augmented Generation) over the business\'s
    > own PostgreSQL data via pgvector

## **AI Feature 9: Smart Product Description & HSN Classifier**

+-----------------------------------------------------------------------+
| **🤖 AI-POWERED DIFFERENTIATOR**                                      |
|                                                                       |
| When a user adds a new product, AI auto-suggests the correct HSN/SAC  |
| code based on the product name and description --- preventing manual  |
| lookup errors that lead to compliance issues during GST filing.       |
+=======================================================================+
+-----------------------------------------------------------------------+

## **AI Feature 10: Fraud & Anomaly Detection**

+-----------------------------------------------------------------------+
| **🤖 AI-POWERED DIFFERENTIATOR**                                      |
|                                                                       |
| AI monitors transaction patterns and flags unusual activity:          |
| duplicate invoices, abnormal discounts, suspicious stock adjustments, |
| or unusual payment patterns that may indicate errors or internal      |
| fraud.                                                                |
+=======================================================================+
+-----------------------------------------------------------------------+

-   \'Invoice #INV-1045 looks like a duplicate of #INV-1032 (same party,
    > same amount, 2 days apart)\'

-   \'Stock adjustment of -200 units was made at 11:45 PM by user Ramesh
    > --- verify this\'

-   Velocity alerts: \'Unusually high number of credit notes issued
    > today by salesperson Amit\'

# **12. How BillFlow Beats Vyapar --- Strategic Differentiation**

Vyapar is an excellent product for its target market but has clear
architectural and strategic limitations. BillFlow\'s differentiation
strategy targets these gaps directly.

  -----------------------------------------------------------------------
  **Dimension**         **Vyapar Today vs. BillFlow**
  --------------------- -------------------------------------------------
  **Platform**          Vyapar is mobile + desktop app. BillFlow is a
                        true cloud SaaS --- accessible from any browser,
                        real-time multi-device sync, no installs.

  **AI / Intelligence** Vyapar has zero AI features. BillFlow embeds AI
                        at every layer --- forecasting, automation,
                        insights, anomaly detection.

  **Multi-Currency**    Vyapar is primarily India-focused. BillFlow is
                        global from day one --- multi-currency,
                        multi-tax-regime.

  **Collaboration**     Vyapar has limited team features. BillFlow is
                        built for teams with role-based access, approval
                        workflows, activity feeds.

  **Customer Portal**   Vyapar has no customer self-service. BillFlow
                        provides a branded customer portal for invoice
                        viewing, history, and payments.

  **Integrations**      Vyapar has minimal integrations. BillFlow has
                        open REST API, webhooks, e-commerce connectors,
                        payment gateways.

  **Design / UX**       Vyapar UI feels utilitarian. BillFlow is
                        premium-designed, with a design system that
                        delights modern business owners.

  **Reporting**         Vyapar has standard reports. BillFlow has
                        AI-powered predictive analytics and a
                        conversational Q&A interface.

  **Onboarding**        Vyapar requires significant self-discovery.
                        BillFlow\'s onboarding is guided, with migration
                        tools from Vyapar itself.

  **Pricing             Vyapar has confusing freemium tiers. BillFlow
  Transparency**        offers clear, simple plan tiers with generous
                        free tier.
  -----------------------------------------------------------------------

# **13. Development Roadmap --- Phased Delivery**

## **Phase 1 --- Foundation (Months 1--4)**

-   Auth, user management, business setup, multi-tenancy

-   Core invoicing: create, send, PDF, WhatsApp share

-   Basic party management (customers + suppliers)

-   Product catalog, basic inventory tracking

-   Purchase invoices and POs

-   Dashboard v1: revenue, receivables, recent activity

-   Basic reports: sales, purchases, stock summary

## **Phase 2 --- Accounting & Intelligence (Months 5--8)**

-   Full double-entry accounting: chart of accounts, journal entries

-   Bank accounts, cash book, reconciliation

-   Expense tracking with receipt capture

-   P&L, Balance Sheet, Cash Flow statements

-   GST reports, tax engine, e-invoice integration

-   AI Feature 1: Invoice Assistant (voice + natural language)

-   AI Feature 3: Smart expense categorization

-   AI Feature 8: Conversational Q&A (Phase 1)

## **Phase 3 --- Advanced Features & AI (Months 9--14)**

-   Multi-warehouse inventory management

-   Manufacturing / BOM module

-   E-commerce integrations (Shopify, WooCommerce)

-   Customer portal launch

-   Approval workflows, advanced RBAC

-   AI Feature 2: Cash Flow Forecasting

-   AI Feature 4: AR Co-Pilot

-   AI Feature 5: Inventory Intelligence

-   AI Feature 6: Financial Health Score

-   Mobile PWA with offline mode

## **Phase 4 --- Scale & Ecosystem (Months 15--20)**

-   AI Feature 7: Tax Optimization Assistant

-   AI Feature 10: Fraud & Anomaly Detection

-   Enterprise SSO, dedicated onboarding, SLAs

-   Open API v2 with partner marketplace

-   Advanced analytics: custom report builder, BI dashboards

-   WhatsApp chatbot: customers can pay via WhatsApp conversation

-   Accountant portal: manage multiple client businesses

# **14. Product Success Metrics**

  -----------------------------------------------------------------------------
  **Metric**                  **Target**
  --------------------------- -------------------------------------------------
  **Time to First Invoice**   \< 5 minutes from registration

  **Day 7 Retention**         \> 65%

  **Day 30 Retention**        \> 40%

  **Monthly Churn (paid)**    \< 2%

  **NPS Score**               \> 50

  **Free to Paid Conversion** \> 12%

  **Average                   \> 80 (growth plan users)
  Invoices/Business/Month**   

  **Support Ticket Rate**     \< 5% of MAU per month

  **Invoice Delivery via      \> 70% of all invoices sent
  WhatsApp**                  

  **AI Feature Adoption**     \> 40% of paid users using 2+ AI features by M12
  -----------------------------------------------------------------------------

# **15. Summary & Next Steps**

BillFlow is architected to be the definitive business finance platform
for the next generation of SMB owners --- entrepreneurs who expect
consumer-grade design, real-time cloud access, and intelligent
automation from their business tools.

The combination of a rock-solid transactional core (invoicing,
inventory, accounting) with a differentiated AI intelligence layer
creates a product moat that pure-play billing tools like Vyapar cannot
quickly replicate. The AI features in particular create compounding
value --- the more transactions recorded in BillFlow, the smarter and
more personalized the AI becomes for each business.

+-----------------------------------------------------------------------+
| **Immediate Next Steps**                                              |
|                                                                       |
| 1\. Validate PRD with 10 target SMB owner interviews \| 2. Finalize   |
| database schema and API contract \| 3. Set up Next.js + Node.js       |
| monorepo \| 4. Design system creation in Figma \| 5. Begin Phase 1    |
| sprint planning                                                       |
+=======================================================================+
+-----------------------------------------------------------------------+

*Document Owner: Product Team \| For questions and feedback, contact the
Product Lead.*
