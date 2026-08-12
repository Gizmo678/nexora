# Detailed Technical Overview of Completed Work
**Project**: Mini ERP + CRM Operations Portal  
**Location**: `C:\Users\pranj\Projects\mini-erp-crm`  
**Current Progress**: Phase 1, Phase 2, and Phase 3 Fully Completed & Tested.

---

## 1. Executive Summary of What Has Been Built

We have successfully initialized and verified the permanent production workspace for the Mini ERP + CRM project. The core architecture, database schema, server engine, environment validation, error handling, JWT authentication, and Role-Based Access Control (RBAC) middleware are **100% operational** and validated by automated tests.

---

## 2. Directory Structure & File Manifest

The codebase is organized in `C:\Users\pranj\Projects\mini-erp-crm` as a clean, production-ready modular monolith:

```text
C:\Users\pranj\Projects\mini-erp-crm/
├── docker-compose.yml                     # PostgreSQL 15 Container configuration (Port 5432)
├── README.md                              # Main documentation file
├── .gitignore                             # Git ignore rules (node_modules, .env, dist)
├── CURRENT_BUILD_EXPLANATION.md           # This comprehensive technical breakdown file
└── backend/
    ├── Dockerfile                         # Multi-stage production build configuration
    ├── package.json                       # Express, Prisma, Zod, JWT, Bcrypt, Vitest dependencies
    ├── tsconfig.json                      # Strict TypeScript compiler rules (ES2022, CommonJS)
    ├── .env                               # Development environment configuration
    ├── .env.example                       # Environment template for deployment
    ├── prisma/
    │   ├── schema.prisma                  # PostgreSQL Prisma schema (Decimal precision, Enums, Models)
    │   └── seed.ts                        # Database seed script for 4 authentic role accounts
    └── src/
        ├── app.ts                         # Express app setup (CORS, JSON parser, Logging, Error middleware)
        ├── server.ts                      # Server listener & graceful shutdown handlers
        ├── config/
        │   ├── env.ts                     # Zod schema validation for environment variables at startup
        │   └── prisma.ts                  # Managed Prisma Client singleton instance
        ├── controllers/
        │   └── auth.controller.ts         # Handlers for POST /auth/login and GET /auth/me
        ├── middlewares/
        │   ├── auth.middleware.ts         # JWT Bearer token authentication (401 Unauthorized)
        │   ├── rbac.middleware.ts         # Role authorization middleware (403 Forbidden)
        │   └── error-handler.ts           # Centralized Express error handler (Zod, Prisma, AppError)
        ├── routes/
        │   ├── auth.routes.ts             # REST API endpoints for authentication
        │   └── health.ts                  # Health check endpoints (/health & /api/v1/health)
        ├── services/
        │   └── auth.service.ts            # Business logic for password verification & JWT token generation
        ├── utils/
        │   ├── app-error.ts               # Custom AppError class with status & error codes
        │   └── response.ts                # Standardized JSON response helpers
        ├── types/
        │   └── express.d.ts               # Express Request interface extension for authenticated user payload
        ├── validators/
        │   └── auth.validator.ts          # Zod input validation schema for login
        └── __tests__/
            ├── health.test.ts             # Unit tests for server health & 404 routes
            └── auth.test.ts               # Integration unit tests for JWT & RBAC role guards
```

---

## 3. Deep-Dive Technical Implementation Details

### A. Database Architecture & Monetary Precision (`prisma/schema.prisma`)
1. **Engine**: Pure **PostgreSQL** via `DATABASE_URL`. Zero SQLite dependencies.
2. **Financial Precision**: All currency fields (`unitPrice`, `unitPriceSnapshot`, `lineTotal`, `totalAmount`) are strictly defined using Prisma `Decimal` / PostgreSQL `DECIMAL(12, 2)` to prevent floating-point precision loss.
3. **Product Snapshot Integrity**: `ChallanItem` contains snapshot fields (`productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot`). When a product price is updated later, past historical invoices retain the price at creation time.
4. **Concurrency-Safe Sequence Model**: Defined `ChallanSequence` table to generate `CH-YYYY-0001` challan numbers using PostgreSQL row locking (`SELECT FOR UPDATE`), avoiding `count + 1` race conditions.
5. **Separate Customer Follow-Up Model**: `Customer.notes` stores general notes, while `CustomerFollowUp` stores dated activity logs linked to the customer and creator.

### B. Startup Environment Validation (`src/config/env.ts`)
The backend validates environment variables at server boot using Zod. If `DATABASE_URL` or `JWT_SECRET` is missing or invalid, the process halts immediately with clear formatting instead of failing silently at runtime.

### C. Authentication & Token Management (`src/services/auth.service.ts` & `src/middlewares/auth.middleware.ts`)
1. **Password Security**: Passwords are hashed using `bcryptjs` (salt rounds: 10).
2. **JWT Payload**: Standardized payload containing `userId`, `email`, `role`, and `name`.
3. **Auth Middleware (`authenticateJwt`)**: Checks `Authorization: Bearer <token>`. If missing or invalid, returns HTTP `401 Unauthorized` with JSON code `UNAUTHORIZED`.

### D. Strict Backend Role Authorization (`src/middlewares/rbac.middleware.ts`)
1. **Role Enforcement**: `requireRole([Role.ADMIN, ...])` verifies `req.user.role`.
2. **Security Guarantee**: Hiding UI components is not relied upon. Any unauthorized API attempt returns HTTP `403 Forbidden` with a message like `"Role 'SALES' is not authorized to perform this operation."`

### E. Standardized API Response & Error Contract (`src/utils/response.ts` & `src/middlewares/error-handler.ts`)
All API responses follow a uniform contract:

**Success (200 OK / 201 Created)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "usr-123",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
}
```

**Error (401 / 403 / 422 / 500)**:
```json
{
  "success": false,
  "message": "Access denied. Role 'SALES' is not authorized to perform this operation.",
  "code": "FORBIDDEN"
}
```

---

## 4. Database Seed Credentials

Run `npm run prisma:seed` in `backend/` to seed these 4 real accounts:

| Role | Email | Password | Allowed System Capabilities |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@example.com` | `Password123!` | Full system control. |
| **SALES** | `sales@example.com` | `Password123!` | Customers, CRM follow-ups, view products, draft & confirm challans. |
| **WAREHOUSE** | `warehouse@example.com` | `Password123!` | Products catalog, stock management, record IN/OUT movements. |
| **ACCOUNTS** | `accounts@example.com` | `Password123!` | View-only access to customers, products, challans, and financials. |

---

## 5. Verification & Test Results

1. **TypeScript Build Check (`npm run lint`)**: Passed with **0 errors**.
2. **Automated Unit & Integration Test Suite (`npm run test`)**:
   - `src/__tests__/health.test.ts`: Passed (Health route check & 404 check).
   - `src/__tests__/auth.test.ts`: Passed (Invalid email validation, invalid password, missing token, invalid token, authorized access, **403 Forbidden role rejection**).
   - Total Result: **8/8 tests passed in 770ms**.

---

## 6. What Needs to Be Implemented Next (Roadmap)

- **Phase 4**: Customer CRM & Follow-Up API (`/api/v1/customers`, detail view, follow-ups log).
- **Phase 5**: Product Catalog & Inventory API (`/api/v1/products`, low-stock alerts, Decimal pricing).
- **Phase 6**: Stock Movements API (`/api/v1/stock-movements`, IN/OUT positive quantity validation, stock guards).
- **Phase 7**: Sales Challan Workflow & Transactional Stock Confirmation (`/api/v1/challans`, auto-sequence `CH-YYYY-0001`, product snapshots, atomic PostgreSQL `$transaction` with stock deduction).
- **Phases 8 - 17**: Comprehensive backend integration testing, React + Vite frontend UI, Postman collection, Docker verification, and final interview documentation.
