# Phoneix Business Suite

A full-stack business management platform for service-based retail. Includes invoicing, repairs, inventory, customers, suppliers, payments, and reporting.

## Architecture

- **Frontend**: Next.js 14 (App Router) — runs on port 5000
- **Backend**: Express.js + TypeScript + Prisma — runs on port 3001
- **Database**: Replit PostgreSQL (via Prisma ORM)

## Directory Structure

```
frontend/   — Next.js app (src/app/, src/lib/, src/components/, src/hooks/)
backend/    — Express API (src/modules/, src/config/, src/shared/)
  prisma/   — Database schema and migrations
```

## Running the App

Two workflows run simultaneously:

1. **Start application** — `cd frontend && npm run dev` (port 5000, webview)
2. **Backend API** — `cd backend && npm run start` (port 3001, console)

Frontend proxies all `/api/*` and `/uploads/*` requests to the backend via Next.js rewrites (configured in `frontend/next.config.js`). This eliminates CORS issues — all traffic goes through a single origin.

## Environment Variables / Secrets

| Key | Description |
|-----|-------------|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Replit DB) |
| `JWT_SECRET` | Secret for signing JWT tokens (minimum 64 chars) |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Public Replit domain (https://...) |
| `NEXT_PUBLIC_API_URL` | Set to empty — frontend uses relative `/api` URLs |
| `APP_URL` | Public Replit domain (used by backend for PDF URLs) |
| `PORT` | Backend port (3001) |

## Database

- Prisma schema: `backend/prisma/schema.prisma`
- Migrations: `backend/prisma/migrations/`
- Run migrations: `cd backend && npx prisma migrate deploy`
- Generate client: `cd backend && npx prisma generate`

## Key Design Decisions

- Frontend uses relative API URLs (`/api/...`) so Next.js rewrites forward them to backend — no CORS config needed for browser requests
- Backend CORS allows `.replit.dev` and `.replit.app` domains
- `output: 'standalone'` removed from next.config.js (not needed for Replit dev server)
- TypeScript fixes applied to Prisma 5+ compatibility (removed deprecated `$on('beforeExit')`, fixed enum type casts)

## Default Login

- Email: `admin@phoneix.com`
- Password: `Admin@1234`
