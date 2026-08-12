# Nexora

Nexora is an operations, inventory, customer CRM, and sales management platform designed for wholesale and distribution workflows.

## Live Demo

- Live Application: http://13.126.10.26
- Health Check API: http://13.126.10.26/api/v1/health
- GitHub Repository: https://github.com/Gizmo678/nexora

The application is deployed on an AWS EC2 instance using Nginx as a web server and reverse proxy, with containerized PostgreSQL data persistence.

---

## Overview

Nexora connects operational workflows across customer account management, catalog control, stock movement auditing, and sales challan fulfillment. Built specifically for wholesale and distribution enterprises, it addresses inventory overselling, disconnected customer tracking, and unverified dispatch transactions.

The system enforces strict role segregation across four business functions: Administrators, Sales Representatives, Warehouse Leads, and Accounts Staff.

---

## Core Capabilities

### Authentication & Authorization
- Token-based JWT authentication with role-restricted middleware enforcement.
- User management module for account creation, role assignment, and account suspension.
- Protection mechanisms against self-demotion, self-suspension, and last-admin account deletion.

### Customer CRM
- Customer account directory categorized by client type (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`).
- Scheduled interaction follow-ups and chronological communication logs.
- Customer account status tracking (`LEAD`, `ACTIVE`, `INACTIVE`).

### Products & Inventory
- Product catalog management with SKU identifiers, unit prices, minimum thresholds, and rack locations.
- Real-time low stock monitoring (`currentStock <= minStock`).

### Stock Movements
- Audited logging of inventory additions (`IN`) and dispatches (`OUT`).
- Transactional link between sales challan fulfillments and stock movement records.

### Sales Challans & Printing
- Sequential challan numbering (`CH-YYYY-XXXX`) generated via atomic database operations.
- Historical unit price snapshotting on line items to preserve accounting accuracy.
- Print-optimized A4 document layouts for customer receipts and physical dispatches.

### Dashboard & Analytics
- Executive dashboard providing real-time metrics on customer counts, inventory health, pending draft challans, and confirmed revenue.

---

## Documentation

Comprehensive engineering documentation is available in the `docs/` directory:

| Document | Description |
|---|---|
| [System Architecture](docs/ARCHITECTURE.md) | Application architecture, request flow, and business workflow processing |
| [API Documentation](docs/API.md) | REST API endpoints, request schemas, authentication, and status codes |
| [Deployment Guide](docs/DEPLOYMENT.md) | AWS EC2 setup, Nginx reverse proxy, and Docker PostgreSQL environment |
| [Concurrency & Inventory Consistency](docs/CONCURRENCY.md) | Pessimistic row locking (`SELECT FOR UPDATE`) and race-condition test results |

---

## System Architecture

```mermaid
flowchart LR
    Client[Browser / Client]
    Nginx[Nginx Web Server]
    React[React 19 + TypeScript SPA]
    API[Express REST API Engine]
    Auth[JWT & RBAC Security Layer]
    Services[Service Layer]
    Prisma[Prisma ORM Client]
    DB[(PostgreSQL 15 Database)]

    Client -->|HTTP Port 80| Nginx
    Nginx -->|Serves Static Files| React
    Nginx -->|Proxy Pass /api/v1| API
    API --> Auth
    Auth -->|Validated Request| Services
    Services --> Prisma
    Prisma -->|SQL Queries| DB
```

For complete architectural details and request processing sequence diagrams, see the [System Architecture Guide](docs/ARCHITECTURE.md).

---

## Key Engineering Highlights

### Concurrency and Inventory Race-Condition Control
Nexora prevents inventory overselling by executing PostgreSQL pessimistic row-level locking (`SELECT ... FOR UPDATE`) inside database transactions during sales challan fulfillment.

```
Client A & Client B (Parallel Request for Stock = 9)
       │
       ▼
PostgreSQL Transaction ($transaction)
       │
       ├─► Client A locks Product Row ──► Validates (9 >= 5) ──► Stock = 4 (Committed)
       │
       └─► Client B Blocked ────────────► Reads Stock = 4 ────► Rejected: 400 Insufficient Stock
```

### Empirical Test Verification
The backend includes parallel test suites (`backend/src/__tests__/concurrency.test.ts`) executed via `Promise.all`:
- **Valid Split (5 + 4 on Stock 9)**: Both requests succeed; final stock = `0`.
- **Oversale Race Condition (5 + 5 on Stock 9)**: Exactly 1 request succeeds, 1 request rejected; final stock = `4`. Overselling prevented.
- **High Contention (5 Parallel Clients)**: Requests for 11 total units against stock of 9; exactly 9 units fulfilled, 1 rejected; final stock = `0`.

For full implementation details and test outputs, see the [Concurrency & Inventory Consistency Guide](docs/CONCURRENCY.md).

---

## Technology Stack

| Layer | Component | Specification / Version |
|---|---|---|
| **Frontend** | Framework | React 19 (`19.2.8`), TypeScript, Vite (`8.2.0`) |
| | State & Query | TanStack Query (`5.101.4`), Axios (`1.19.0`) |
| | Forms & Styling | React Hook Form (`7.85.0`), Zod (`3.25.76`), Tailwind CSS (`4.3.3`) |
| **Backend** | Runtime & Framework | Node.js (v18+), Express (`4.18.3`), TypeScript (`5.3.3`) |
| | Database & ORM | PostgreSQL 15, Prisma ORM (`5.10.2`) |
| | Security | JWT (`jsonwebtoken 9.0.2`), bcryptjs (`2.4.3`), Zod (`3.22.4`) |
| **Testing** | Suite | Vitest (`1.3.1`), Supertest (`6.3.4`) |
| **Infrastructure** | Web Server & Proxy | Nginx (Port 80 HTTP Reverse Proxy) |
| | Host & Containers | AWS EC2 Linux, Docker, Docker Compose |

---

## Role-Based Access Control (RBAC) Matrix

| Endpoint Group | HTTP Methods | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|---|---|:---:|:---:|:---:|:---:|
| `/api/v1/auth/login` | POST | Public | Public | Public | Public |
| `/api/v1/dashboard/metrics` | GET | Allowed | Allowed | Allowed | Allowed |
| `/api/v1/customers` | GET, POST, PATCH | Allowed | Allowed | Read Only | Allowed |
| `/api/v1/customers/:id/follow-ups` | POST | Allowed | Allowed | Denied | Denied |
| `/api/v1/products` | GET | Allowed | Allowed | Allowed | Allowed |
| `/api/v1/products` | POST, PATCH | Allowed | Denied | Allowed | Denied |
| `/api/v1/stock-movements` | GET, POST | Allowed | Read Only | Allowed | Read Only |
| `/api/v1/challans` | GET, POST, CONFIRM | Allowed | Allowed | Read Only | Read Only |
| `/api/v1/users` | GET, POST, PATCH, DELETE | Allowed | Denied | Denied | Denied |

---

## Demo Credentials

The database seed script initializes default accounts for evaluation across all roles. The default password for all seed accounts is `Password123!`.

| Role | Email Address | Password | Primary Scope |
|---|---|---|---|
| **Admin** | `admin@example.com` | `Password123!` | System administration & user management |
| **Sales** | `sales@example.com` | `Password123!` | Customer CRM & sales challan creation |
| **Warehouse** | `warehouse@example.com` | `Password123!` | Catalog maintenance & stock dispatches |
| **Accounts** | `accounts@example.com` | `Password123!` | Financial auditing & sales reporting |

---

## Quick Start (Local Setup)

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher) or Docker
- npm (v9 or higher)

### 1. Database Setup
Start a local PostgreSQL instance or run Docker Compose:
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create environment file
cat <<EOT > .env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://erp_user:erp_password@localhost:5432/mini_erp_db?schema=public"
JWT_SECRET="development-secret-key-at-least-32-characters"
JWT_EXPIRES_IN="1d"
CORS_ORIGIN="http://localhost:5173"
EOT

# Run database migrations and seed default data
npx prisma db push
npm run seed

# Start API server
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install

# Create environment file
cat <<EOT > .env
VITE_API_URL="http://localhost:5000/api/v1"
EOT

# Start Vite development server
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## Testing

Run the automated Vitest integration test suite covering authentication, RBAC authorization, customer CRUD, health metrics, and concurrency overselling checks:

```bash
cd backend
npm test
```

---

## Deployment Summary

- **Host Environment**: AWS EC2 Linux Instance (`13.126.10.26`).
- **Web Server**: Nginx serving static assets from `/var/www/nexora` and proxying `/api/v1` traffic to `127.0.0.1:5000`.
- **Database**: PostgreSQL containerized via Docker Compose.

For step-by-step production deployment instructions, see the [Deployment Guide](docs/DEPLOYMENT.md).

---

## Known Limitations

- **Protocol**: Deployed over HTTP on public IP (`13.126.10.26`). Domain name registration and TLS/HTTPS termination are not configured for this case study instance.
- **Topology**: Single EC2 host deployment with PostgreSQL containerized on the same virtual machine.

---

## Submission & Reference Links

- **Live Application**: http://13.126.10.26
- **Backend Health Check**: http://13.126.10.26/api/v1/health
- **GitHub Repository**: https://github.com/Gizmo678/nexora

---

## Author

**Pranjal Dadhich**  
B.Tech Computer Science & Engineering  
Expected Graduation: 2027
