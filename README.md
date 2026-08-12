# Nexora

Nexora is a production-oriented business operations, inventory control, customer CRM, and sales management platform designed for wholesale and distribution workflows.

## Live Demo

- Frontend: http://13.126.10.26
- Backend Health: http://13.126.10.26/api/v1/health
- GitHub: https://github.com/Gizmo678/nexora

The application is deployed on an AWS EC2 instance using Nginx as a web server and reverse proxy, with containerized PostgreSQL data persistence.

---

## Overview

Nexora connects operational workflows across customer account management, catalog control, stock movement auditing, and sales challan fulfillment. Built specifically for wholesale and distribution enterprises, it addresses inventory overselling, disconnected customer tracking, and unverified dispatch transactions.

The system enforces strict role segregation across four business functions: Administrators, Sales Representatives, Warehouse Leads, and Accounts Staff.

---

## Core Capabilities

- **Authentication & RBAC**: Token-based JWT authentication with role-restricted middleware enforcement across four roles (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`). Includes user administration and account suspension safeguards.
- **Customer CRM**: Client account management (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`), scheduled interaction follow-ups, and lifecycle status tracking (`LEAD`, `ACTIVE`, `INACTIVE`).
- **Products & Inventory**: Catalog management with SKU identifiers, unit prices, rack locations, and real-time low-stock alerts (`currentStock <= minStock`).
- **Stock Movements**: Audited, immutable logging of stock additions (`IN`) and dispatches (`OUT`) with author attribution.
- **Sales Challans**: Concurrency-safe sequential challan numbering (`CH-YYYY-XXXX`), line-item snapshot pricing, draft-to-fulfillment lifecycle, and printable A4 sales receipts.
- **Operational Dashboard**: Real-time metrics covering active customers, catalog totals, low-stock counts, draft challans, and confirmed revenue.

---

## Documentation

Detailed engineering documentation is organized in the `docs/` directory:

| Document | Description |
|---|---|
| [System Architecture](docs/ARCHITECTURE.md) | Application architecture, component responsibilities, and request processing flows |
| [API Documentation](docs/API.md) | REST API endpoints, request/response schemas, and status codes |
| [Deployment Guide](docs/DEPLOYMENT.md) | AWS EC2 setup, Nginx reverse proxy, and Docker environment configuration |
| [Concurrency & Inventory Consistency](docs/CONCURRENCY.md) | PostgreSQL row locking (`SELECT FOR UPDATE`) and empirical race-condition test results |

---

## Key Engineering Highlights

- **Concurrency & Inventory Consistency**: Prevents overselling by executing PostgreSQL pessimistic row locks (`SELECT ... FOR UPDATE`) inside interactive database transactions (`prisma.$transaction`) during challan fulfillment.
  - *Verified Test Result*: With starting stock = 9, two concurrent requests for 5 units were sent simultaneously via `Promise.all`. Exactly one request succeeded (`200 OK`), one was rejected (`400 INSUFFICIENT_STOCK`), and final stock remained at 4.
- **Data Integrity & Historical Auditability**: Uses Decimal precision for monetary calculations and records unit price snapshots at challan creation to preserve historical accounting integrity.
- **Production-Oriented Infrastructure**: Containerized PostgreSQL persistence coupled with Nginx static asset serving and API reverse proxying on AWS EC2.

---

## Technology Stack

| Layer | Component | Version / Specification |
|---|---|---|
| **Frontend** | Framework & Build | React 19 (`19.2.8`), TypeScript, Vite (`8.2.0`) |
| | State & Query | TanStack Query (`5.101.4`), Axios (`1.19.0`) |
| | Forms & Styling | React Hook Form (`7.85.0`), Zod (`3.25.76`), Tailwind CSS (`4.3.3`) |
| **Backend** | Runtime & Framework | Node.js (v18+), Express (`4.18.3`), TypeScript (`5.3.3`) |
| | Database & ORM | PostgreSQL 15, Prisma ORM (`5.10.2`) |
| | Security & Validation | JWT (`jsonwebtoken 9.0.2`), bcryptjs (`2.4.3`), Zod (`3.22.4`) |
| **Testing** | Framework | Vitest (`1.3.1`), Supertest (`6.3.4`) |
| **Infrastructure** | Web Server & Proxy | Nginx (Port 80 HTTP Reverse Proxy) |
| | Host & Containers | AWS EC2 Linux, Docker, Docker Compose |

---

## Role-Based Access Control (RBAC)

| Module / Endpoint | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|---|:---:|:---:|:---:|:---:|
| Dashboard Metrics | Allowed | Allowed | Allowed | Allowed |
| Customers Directory | Allowed | Allowed | Read Only | Allowed |
| Product Catalog | Allowed | Read Only | Allowed | Read Only |
| Stock Movements | Allowed | Read Only | Allowed | Read Only |
| Sales Challans | Allowed | Allowed | Read Only | Read Only |
| User Administration | Allowed | Denied | Denied | Denied |

---

## Demo Credentials

The database seed initializes default accounts for evaluation across all roles. The default password for all seed accounts is `Password123!`.

| Role | Email Address | Password | Primary Scope |
|---|---|---|---|
| **Admin** | `admin@example.com` | `Password123!` | System administration & user management |
| **Sales** | `sales@example.com` | `Password123!` | Customer CRM & sales challan creation |
| **Warehouse** | `warehouse@example.com` | `Password123!` | Catalog maintenance & stock dispatches |
| **Accounts** | `accounts@example.com` | `Password123!` | Financial auditing & sales reporting |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher) or Docker
- npm (v9 or higher)

### 1. Database Setup
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment
cat <<EOT > .env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://erp_user:erp_password@localhost:5432/mini_erp_db?schema=public"
JWT_SECRET="development-secret-key-at-least-32-characters"
JWT_EXPIRES_IN="1d"
CORS_ORIGIN="http://localhost:5173"
EOT

# Run migrations and seed data
npx prisma db push
npm run seed

# Start development API server
npm run dev
```

### 3. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install

# Configure environment
cat <<EOT > .env
VITE_API_URL="http://localhost:5000/api/v1"
EOT

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Testing

Run the automated Vitest test suite covering authentication, RBAC authorization, customer CRUD, health metrics, and concurrency overselling prevention:

```bash
cd backend
npm test
```

---

## Known Limitations

- **Protocol**: Deployed over HTTP on public IP (`13.126.10.26`). Custom domain registration and SSL/TLS termination are not configured for this case study instance.
- **Topology**: Single EC2 host deployment with containerized PostgreSQL running on the same host instance.

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
