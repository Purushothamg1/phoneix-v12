# Phoneix Business Suite v1.2.0

A production-grade, full-stack business management platform built for service-based retail shops.
Covers invoicing, repair job tracking, inventory management, payments, customer CRM, reporting, and WhatsApp sharing.

## Tech Stack

| Layer    | Technology                           |
|----------|--------------------------------------|
| Frontend | Next.js 14, React 18, Tailwind CSS   |
| Backend  | Node.js, Express 4, TypeScript       |
| Database | PostgreSQL via Prisma ORM            |
| Auth     | JWT (RS/HS256), bcrypt (cost 12)     |
| PDF      | PDFKit + QRCode                      |
| Charts   | Recharts                             |
| Proxy    | Nginx                                |
| Deploy   | Docker Compose                       |

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET at minimum
docker compose up -d
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run prisma:seed
```

Open http://localhost:3000 — login with `admin@phoneix.com` / `Admin@1234`

**Change the default password immediately after first login.**

## Quick Start (Local Dev)

```bash
# Backend
cd backend
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate deploy
npm run prisma:seed
npm run dev            # runs on :5000

# Frontend (separate terminal)
cd frontend
cp .env.example .env   # set NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev            # runs on :3000
```

## WhatsApp Sharing

When you click **Share via WhatsApp** on any invoice or repair job:

1. The system automatically generates and saves a PDF named `CustomerName-INV-00001.pdf`
2. A preview modal shows the pre-filled message text
3. Clicking **Open WhatsApp** opens `wa.me/<phone>?text=<message>` — a WhatsApp chat with that customer, message pre-filled
4. Download the PDF from the modal, attach it, and hit send

### Future: Meta Cloud API
Go to **Settings → Meta API** to configure your Meta Business WABA credentials.
When `Meta API Enabled` is set to **Yes**, messages will be sent automatically.
Currently the wa.me manual flow is the default.

## Modules

- **Dashboard** — KPIs, sales chart, active repairs, low-stock alerts
- **Customers** — CRM with history (invoices + repairs + outstanding balance)
- **Inventory** — Products, stock adjustments, low-stock tracking, categories
- **Suppliers** — Supplier directory with payment terms
- **Invoices** — Create/view/cancel invoices with line items, tax, discount; PDF + WhatsApp sharing
- **Repairs** — Job cards for device repairs, parts tracking, technician assignment, status workflow
- **Payments** — Record payments (Cash/UPI/Card/Bank Transfer), refunds, payment history
- **Reports** — Sales, Inventory, Repairs, Financial reports with date range filters
- **Import/Export** — Bulk product import (CSV/Excel), export products and sales reports
- **Users** — User management with RBAC (Admin/Manager/Staff)
- **Audit Log** — Full activity history for compliance
- **Settings** — Business info, invoice config, WhatsApp templates, Meta API integration

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all options.

Required:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — at least 64 random characters

## Roles

| Role    | Access                                                  |
|---------|---------------------------------------------------------|
| STAFF   | Customers, Invoices, Repairs, Search                    |
| MANAGER | + Inventory, Suppliers, Payments, Reports, Import/Export|
| ADMIN   | Full access + Users, Audit Log, Settings                |

## Production Checklist

- [ ] Change `JWT_SECRET` to a cryptographically random 64+ char string
- [ ] Change default admin password
- [ ] Set `NODE_ENV=production`
- [ ] Configure `FRONTEND_URL` for CORS
- [ ] Set `APP_URL` for QR code links in PDFs
- [ ] Provision PostgreSQL with regular backups
- [ ] Mount persistent volumes for uploads
- [ ] Set up TLS (Let's Encrypt) in front of nginx
