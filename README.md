# nexora

A production-quality **Mini ERP + CRM Operations Portal** for a wholesale/distribution company, built as a full-stack interview case study.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL 15 (Docker) |
| Auth | JWT + bcrypt |
| State | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |

## Features Implemented

- ✅ **Authentication** — JWT login, `/auth/me`, role-based access
- ✅ **Role-Based Authorization** — ADMIN, SALES, WAREHOUSE, ACCOUNTS (enforced on every endpoint)
- ✅ **Customer CRM** — CRUD, status tracking (LEAD/ACTIVE/INACTIVE), follow-up notes with timeline
- ✅ **Products & Inventory** — Full product management with low-stock alerts
- ✅ **Stock Movements** — Atomic IN/OUT transactions with full audit trail
- ✅ **Sales Challans** — Draft → Confirm workflow with concurrency-safe number generation
- ✅ **Dashboard** — KPIs, upcoming follow-ups, low-stock alerts, recent challans
- ✅ **Decimal Money** — All monetary values use PostgreSQL `NUMERIC(12,2)` via Prisma Decimal
- ✅ **Snapshot Pricing** — ChallanItem stores price at time of creation, immutable

## Quick Start

### Prerequisites
- Docker Desktop running
- Node.js 18+

### 1. Start the database

```bash
cd C:\Users\pranj\Projects\mini-erp-crm
docker-compose up -d
```

### 2. Start the backend

```bash
cd backend
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

Backend runs at: **http://localhost:5000**

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Password123! |
| Sales | sales@example.com | Password123! |
| Warehouse | warehouse@example.com | Password123! |
| Accounts | accounts@example.com | Password123! |

## API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/v1/auth/login` | Public |
| GET | `/api/v1/auth/me` | All authenticated |

### Customers
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/v1/customers` | All roles |
| POST | `/api/v1/customers` | ADMIN, SALES |
| GET | `/api/v1/customers/:id` | All roles |
| PATCH | `/api/v1/customers/:id` | ADMIN, SALES |
| GET | `/api/v1/customers/:id/follow-ups` | All roles |
| POST | `/api/v1/customers/:id/follow-ups` | ADMIN, SALES |

### Products
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/v1/products` | All roles |
| POST | `/api/v1/products` | ADMIN, WAREHOUSE |
| GET | `/api/v1/products/:id` | All roles |
| PATCH | `/api/v1/products/:id` | ADMIN, WAREHOUSE |

### Stock Movements
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/v1/stock-movements` | All roles |
| POST | `/api/v1/stock-movements` | ADMIN, WAREHOUSE |

### Sales Challans
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/v1/challans` | All roles |
| POST | `/api/v1/challans` | ADMIN, SALES |
| GET | `/api/v1/challans/:id` | All roles |
| POST | `/api/v1/challans/:id/confirm` | ADMIN, SALES |
| POST | `/api/v1/challans/:id/cancel` | ADMIN, SALES |

### Dashboard
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/v1/dashboard/metrics` | All roles |

## Project Structure

```
mini-erp-crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # PostgreSQL schema
│   │   ├── seed.ts            # Demo data seeder
│   │   └── migrations/        # Applied migration
│   └── src/
│       ├── config/            # env, prisma singleton
│       ├── controllers/       # Request handlers
│       ├── middlewares/       # JWT auth, RBAC, error handler
│       ├── routes/            # Express routers
│       ├── services/          # Business logic
│       ├── types/             # TypeScript types
│       ├── utils/             # AppError, response helpers
│       ├── validators/        # Zod schemas
│       └── __tests__/         # Vitest test suites
└── frontend/
    └── src/
        ├── api/               # Axios client
        ├── components/        # ProtectedRoute
        ├── contexts/          # AuthContext
        ├── layouts/           # DashboardLayout
        ├── pages/             # All pages
        └── types/             # TypeScript interfaces
```

## Design Decisions

### Decimal Money
All monetary fields (`unitPrice`, `unitPriceSnapshot`, `lineTotal`, `totalAmount`) use PostgreSQL `NUMERIC(12,2)` mapped via Prisma `Decimal` to prevent floating-point precision errors.

### Challan Sequence
`ChallanSequence` uses a PostgreSQL `INSERT ... ON CONFLICT ... DO UPDATE` pattern inside a transaction to guarantee unique, sequential challan numbers (`CH-2026-0001`) without race conditions.

### Stock Deduction
When a challan is **confirmed**, all product rows are locked with `SELECT FOR UPDATE`, stock availability is verified for all items, and only then are decrements applied — all within a single atomic transaction.

### Snapshot Pricing
When a challan is created, the product's `name`, `SKU`, and `unitPrice` are captured as immutable snapshot fields in `ChallanItem`. Changes to product prices never retroactively affect existing challans.
