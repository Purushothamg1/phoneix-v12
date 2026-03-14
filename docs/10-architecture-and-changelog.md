# Architecture & Changelog

## v1.2.0 (2026-03-14)

### Security Enhancements
- **Request ID middleware** — every request gets a UUID attached (`X-Request-ID` header); echoed in all error responses for correlation
- **Compression** — gzip on all API responses (threshold 1KB, level 6)
- **express-slow-down** — progressive delay after 5 failed login attempts, before hard rate limit
- **Stricter Helmet CSP** — Content-Security-Policy with explicit `default-src 'self'`; HSTS enabled in production
- **Environment validation** — server exits at startup if `DATABASE_URL` or `JWT_SECRET` are missing
- **Audit logging** — every mutating action (login, password change, user CRUD, invoice cancel, settings update, import) written to `AuditLog` table
- **Settings key whitelist** — server-side whitelist prevents arbitrary key injection via PUT /settings

### WhatsApp Integration
- **Improved wa.me flow** — `POST /api/import-export/prepare-send` now:
  - Auto-generates PDF if not already created
  - Names PDF as `CustomerName-INV-00001.pdf` or `CustomerName-JOB-00001.pdf` (human-readable)
  - Returns full pre-filled message text, `pdfName`, `pdfUrl`, and `whatsappUrl`
  - Rich message: includes invoice totals, paid amount, outstanding balance, or repair status
- **Share preview modal** in Invoices list, Repairs list, Invoice detail, Repair detail — shows message preview and PDF filename before opening WhatsApp
- **Simultaneous PDF save** — PDF is written to disk before WhatsApp opens; user downloads it then attaches manually
- **WhatsApp settings tab** — configurable phone number and message templates with variable placeholders

### Meta Cloud API Setup (future-ready)
- New **Meta API tab** in Settings UI to configure:
  - `meta_api_enabled` (toggle)
  - WABA ID, Phone Number ID, Webhook Verify Token
  - Secure token update via dedicated `PUT /api/settings/meta-token` endpoint (token masked in GET responses)
- When `meta_api_enabled = '1'`, the architecture is ready to route to Meta Cloud API instead of wa.me
- All configuration stored in existing `Setting` table (no schema change)

### PDF Improvements
- Professional layout with colored header bar, alternating row shading, payment history section
- QR code embedded linking to invoice/repair URL (configurable via `APP_URL` env)
- Correct footer from `receipt_footer` setting
- PDF file naming: `<CustomerName>-<DocumentNumber>.pdf` — easy to recognise and attach

### Error Handling
- Comprehensive error handler covering: Prisma P2016, Multer file size/field errors, JSON `SyntaxError`, uncaught exceptions
- `requestId` included in every error response body
- Unhandled promise rejections and uncaught exceptions trigger graceful shutdown
- Frontend: `ErrorBoundary` component wraps sections; login has field-level validation

### UI / UX
- **Login page** — show/hide password toggle, field-level validation, loading spinner
- **Sidebar** — red badge on Inventory nav item showing low-stock count; Audit Log link (Admin only); version badge
- **Dashboard** — clickable low-stock alert panel showing affected items; clickable invoice/repair rows; links to detail pages
- **Audit Log page** — paginated table of all system events with action colour-coding
- **Settings** — 4-tab layout: Business, Invoice & Logo, WhatsApp, Meta API
- **Cmd+K / Ctrl+K** global shortcut opens Quick Search from anywhere
- **Receipt footer** setting applied to both Invoice and Repair PDFs
- **Record Payment** button and modal directly on Invoice detail page (no redirect to Payments page needed)
- **Generate/Regenerate PDF** button on Invoice and Repair detail when PDF missing

### Other
- `/ready` health endpoint added (for k8s readiness probes)
- Graceful shutdown: `SIGTERM`/`SIGINT` → `server.close()` → `prisma.$disconnect()` → exit; 10s force-exit watchdog
- `seed.ts` updated with WhatsApp and Meta API default settings

---

## v1.1.0 (original)
- Full-stack business suite: invoices, repairs, payments, inventory, customers, suppliers, reports, import/export
- JWT authentication with RBAC (ADMIN, MANAGER, STAFF)
- Race-condition-safe invoice/job numbering inside DB transactions
- Stock deduction/restoration on invoice create/cancel and repair create/delete
- PDFKit invoice and repair job card generation
- Excel import/export for products and sales reports
- Docker Compose production deployment with nginx reverse proxy
