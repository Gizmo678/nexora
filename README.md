# Nexora

Nexora is an operations, inventory, customer CRM, and sales management platform designed for wholesale and distribution workflows.

## Live Demo

- Live Application: http://13.126.10.26
- Health Check API: http://13.126.10.26/api/v1/health

## Overview

Nexora addresses operational disconnections common in wholesale and distribution businesses. Small-to-medium enterprises often struggle with inventory overselling, disconnected customer tracking, unaudited stock movements, and race conditions during high-volume dispatch operations.

The platform provides unified workflow management across four key business roles: Administrators, Sales Representatives, Warehouse Personnel, and Accounts/Auditing Staff.

### Key Business Problems Solved

- **Inventory Overselling Prevention**: Enforces pessimistic row-level database locking during sales challan confirmation to prevent concurrent transactions from deducting stock below zero.
- **Audit Trails for Inventory**: Logs every stock addition (IN) and dispatch (OUT) with author attribution and reference reasons.
- **Historical Price Integrity**: Captures snapshot unit prices on individual challan line items at the time of creation, protecting historical accounting records from future catalog price edits.
- **Role-Based Authorization**: Restricts access across API endpoints using JSON Web Tokens (JWT) and database-backed Role-Based Access Control (RBAC).

---

## Core Capabilities

### 1. Authentication and Access Control
- JWT-based authentication with expiration controls.
- Role-based authorization across four distinct roles (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`).
- Automatic account suspension checks preventing suspended users from authenticating.
- Protection against self-suspension, self-demotion, and self-deletion for administrative accounts.

### 2. Customer Relationship Management (CRM)
- Customer account directory with categorizations (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`).
- Follow-up scheduling and notes timeline per customer.
- Tracking of account lifecycle statuses (`LEAD`, `ACTIVE`, `INACTIVE`).

### 3. Product Catalog and Inventory Control
- Product catalog management with SKU identifiers, categories, unit prices, and warehouse location tags.
- Low-stock threshold monitoring comparing current stock against minimum stock limits.
- Stock availability calculations across dispatches.

### 4. Stock Movement Audit Trail
- Immutable logging of stock additions (`IN`) and dispatches (`OUT`).
- Transactional link between sales challan dispatches and stock movement entries.
- Attribution tracking for user action auditing.

### 5. Sales Challans and Fulfillment
- Sales challan generation starting in `DRAFT` status.
- Concurrency-safe challan numbering sequence generation (`CH-YYYY-XXXX`).
- Atomic stock deduction and status transition to `CONFIRMED` upon fulfillment.
- Printable A4 sales challans with company letterheads, customer details, line items, and signature blocks.

### 6. Operational Reporting
- Dashboard metrics summarizing active customers, catalog count, low-stock alerts, draft challans, and total revenue.
- Filtered views for upcoming customer follow-ups within a 7-day window.

### 7. User Administration
- Administrative user directory with search and filtering capabilities.
- User creation, profile updates, and role assignments.
- Account suspension and reactivation workflows.
- Safeguards blocking deletion of users referenced in historical transactions.

---

## System Architecture

```mermaid
flowchart LR
    U[User / Browser]
    N[Nginx Web Server]
    F[React + TypeScript SPA]
    A[Express REST API]
    M[Auth & RBAC Middleware]
    S[Service Layer]
    P[Prisma ORM]
    DB[(PostgreSQL Database)]

    U -->|HTTP / HTTPS| N
    N -->|Serves Static Build| F
    N -->|Reverse Proxy /api/v1| A
    A --> M
    M -->|Validated Request| S
    S --> P
    P -->|SQL Queries| DB
```

### Component Breakdown

| Layer | Technology | Primary Responsibility |
|---|---|---|
| **Reverse Proxy** | Nginx | Serves static React assets and proxies API requests to the Express backend. |
| **Frontend** | React 18, TypeScript, Vite | Single-page application rendering UI, managing state with TanStack Query and React Hook Form. |
| **API Server** | Node.js, Express, TypeScript | Handles HTTP routing, input validation (Zod), and response formatting. |
| **Security Layer** | JWT, bcryptjs | Validates request tokens and verifies user roles (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`). |
| **Service Layer** | TypeScript | Executes business operations, transactional logic, and concurrency controls. |
| **ORM** | Prisma ORM | Provides typed database access, schema migration, and transaction management. |
| **Database** | PostgreSQL | Handles persistence, atomic transactions, and pessimistic row locking (`FOR UPDATE`). |

---

## Business Workflow Architecture

The execution flow for confirming a sales challan demonstrates how Nexora maintains inventory consistency under concurrent load:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client / Sales Rep
    participant API as Express API Router
    participant Auth as RBAC Middleware
    participant Service as Challan Service
    participant DB as PostgreSQL Database

    Client->>API: POST /api/v1/challans/:id/confirm
    API->>Auth: Validate JWT & check Role (ADMIN or SALES)
    Auth-->>API: Authorized
    API->>Service: confirmChallan(challanId, userId)
    
    rect rgb(240, 240, 240)
        note over Service,DB: Begin PostgreSQL Transaction ($transaction)
        Service->>DB: SELECT * FROM sales_challans WHERE id = :id FOR UPDATE
        DB-->>Service: Return Challan (Verify status == DRAFT)
        
        Service->>DB: SELECT * FROM products WHERE id = :productId FOR UPDATE
        note over DB: Lock Product Rows (Blocks concurrent confirmations)
        DB-->>Service: Return Current Stock
        
        alt Stock < Requested Quantity
            Service-->>API: Throw AppError 400 (INSUFFICIENT_STOCK)
            API-->>Client: HTTP 400 Insufficient Stock Response
        else Stock >= Requested Quantity
            Service->>DB: UPDATE products SET currentStock = currentStock - qty
            Service->>DB: INSERT INTO stock_movements (Type: OUT, Reason: Challan #)
            Service->>DB: UPDATE sales_challans SET status = CONFIRMED
            DB-->>Service: Commit Transaction
            Service-->>API: Return Confirmed Challan Object
            API-->>Client: HTTP 200 OK Response
        end
    end
```

---

## Technical & Engineering Decisions

### Concurrency and Stock Overselling Control
In high-volume distribution systems, multiple sales representatives might attempt to confirm orders for limited stock simultaneously. 

To prevent race conditions:
1. Nexora wraps the entire confirmation process in an interactive database transaction (`prisma.$transaction`).
2. It executes a raw SQL pessimistic lock (`SELECT * FROM products WHERE id = $1 FOR UPDATE`) on the required product rows before checking stock levels.
3. This forces concurrent transactions attempting to confirm challans for the same items to queue at the database level.
4. When the second transaction unblocks, it reads the updated, decremented stock level and fails validation gracefully with an `INSUFFICIENT_STOCK` error if inventory has been depleted.

### Concurrency-Safe Sequence Numbers
Sales challan numbers follow a sequential format (`CH-YYYY-XXXX`). To prevent duplicate sequence numbers during parallel creations:
- Sequence tracking is stored in a dedicated `challan_sequences` table indexed by year.
- Sequence increments utilize PostgreSQL atomic operations:
  ```sql
  INSERT INTO challan_sequences (year, "lastValue") VALUES ($1, 1)
  ON CONFLICT (year) DO UPDATE SET "lastValue" = challan_sequences."lastValue" + 1
  RETURNING "lastValue"
  ```

### Data Integrity over Hard Deletion
Users in Nexora are linked to historical dispatches, audit logs, and customer interactions via foreign key relationships. The user administration service prevents hard deletion if a user has associated database records. Instead, administrative users are instructed to set the user's status to `SUSPENDED`, preserving complete auditability.

---

## Role-Based Access Control (RBAC) Matrix

| Endpoint Route | HTTP | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|---|---|:---:|:---:|:---:|:---:|
| `/api/v1/auth/login` | POST | Public | Public | Public | Public |
| `/api/v1/auth/me` | GET | Allowed | Allowed | Allowed | Allowed |
| `/api/v1/dashboard/metrics` | GET | Allowed | Allowed | Allowed | Allowed |
| `/api/v1/customers` | GET, POST | Allowed | Allowed | Read Only | Allowed |
| `/api/v1/customers/:id` | GET, PATCH | Allowed | Allowed | Read Only | Allowed |
| `/api/v1/customers/:id/follow-ups` | POST | Allowed | Allowed | Denied | Denied |
| `/api/v1/products` | GET | Allowed | Allowed | Allowed | Allowed |
| `/api/v1/products` | POST, PATCH | Allowed | Denied | Allowed | Denied |
| `/api/v1/stock-movements` | GET | Allowed | Allowed | Allowed | Allowed |
| `/api/v1/stock-movements` | POST | Allowed | Denied | Allowed | Denied |
| `/api/v1/challans` | GET, GET `:id` | Allowed | Allowed | Allowed | Allowed |
| `/api/v1/challans` | POST | Allowed | Allowed | Denied | Denied |
| `/api/v1/challans/:id/confirm` | POST | Allowed | Allowed | Denied | Denied |
| `/api/v1/challans/:id/cancel` | POST | Allowed | Allowed | Denied | Denied |
| `/api/v1/users` | ALL | Allowed | Denied | Denied | Denied |

---

## Data Model

```mermaid
erDiagram
    User ||--o{ SalesChallan : "creates"
    User ||--o{ StockMovement : "records"
    User ||--o{ CustomerFollowUp : "logs"
    Customer ||--o{ SalesChallan : "receives"
    Customer ||--o{ CustomerFollowUp : "has"
    SalesChallan ||--|{ ChallanItem : "contains"
    Product ||--o{ ChallanItem : "referenced in"
    Product ||--o{ StockMovement : "tracked in"

    User {
        string id PK
        string name
        string email UK
        string passwordHash
        enum role
        enum status
        datetime createdAt
        datetime updatedAt
    }

    Customer {
        string id PK
        string customerName
        string mobile
        string email
        string businessName
        string address
        enum customerType
        enum status
        datetime followUpDate
        datetime createdAt
    }

    Product {
        string id PK
        string name
        string sku UK
        string category
        decimal unitPrice
        int currentStock
        int minStock
        string warehouseLocation
        datetime createdAt
    }

    StockMovement {
        string id PK
        string productId FK
        int quantity
        enum type
        string reason
        string createdById FK
        datetime createdAt
    }

    SalesChallan {
        string id PK
        string challanNumber UK
        string customerId FK
        enum status
        int totalQuantity
        decimal totalAmount
        string createdById FK
        datetime createdAt
    }

    ChallanItem {
        string id PK
        string challanId FK
        string productId FK
        string productNameSnapshot
        string skuSnapshot
        decimal unitPriceSnapshot
        int quantity
        decimal lineTotal
    }
```

---

## Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher) or Docker Desktop
- npm (v9 or higher)

### 1. Repository Setup
```bash
git clone https://github.com/pranjal/mini-erp-crm.git
cd mini-erp-crm
```

### 2. Database Environment Setup
Ensure PostgreSQL is running locally or start the provided Docker PostgreSQL instance:
```bash
docker run --name nexora-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=mini_erp_db -p 5432:5432 -d postgres:15
```

### 3. Backend Configuration & Migration
Navigating to the backend directory:
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mini_erp_db?schema=public"
JWT_SECRET="your-development-secret-key-at-least-32-chars"
JWT_EXPIRES_IN="1d"
CORS_ORIGIN="http://localhost:5173"
```

Apply database migrations and seed default administrative and operational demo accounts:
```bash
npx prisma db push
npm run seed
```

Start the backend development server:
```bash
npm run dev
```

The backend server will run at `http://localhost:5000`.

### 4. Frontend Configuration Setup
Open a new terminal window and navigate to `frontend/`:
```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:
```env
VITE_API_URL="http://localhost:5000/api/v1"
```

Start the frontend development server:
```bash
npm run dev
```

The frontend application will run at `http://localhost:5173`.

---

## Default Seed Accounts

The database seed populates four pre-configured accounts representing each organizational role. The password for all seed accounts is `Password123!`.

| Role | Email Address | Default Password | Permissions Summary |
|---|---|---|---|
| **Admin** | `admin@example.com` | `Password123!` | Full platform administration & user management |
| **Sales** | `sales@example.com` | `Password123!` | Customer CRM & Sales Challan creation/confirmation |
| **Warehouse** | `warehouse@example.com` | `Password123!` | Product catalog management & stock movement logging |
| **Accounts** | `accounts@example.com` | `Password123!` | Read-only auditing of metrics, sales, & stock |

---

## Testing

### Automated Test Suite Execution

Run the backend test suite covering authentication, CRM endpoints, health metrics, and concurrency controls:

```bash
cd backend
npm test
```

### Concurrency Test Coverage
The test suite includes explicit parallel requests (`Promise.all`) verifying stock overselling prevention:
- **Valid Split Test**: Confirms parallel fulfillment when cumulative requested quantity equals current stock.
- **Oversale Race Condition Test**: Verifies that when two parallel requests each request more stock than available, exactly one transaction succeeds while the losing transaction is rejected with an `INSUFFICIENT_STOCK` error.
- **High Contention Test**: Executes 5 parallel dispatch requests against a limited stock count, asserting that final stock never drops below zero.

---

## Deployment Architecture

The application is deployed on an AWS EC2 instance using Docker and Nginx.

```
                    +------------------------------------------+
                    |               AWS EC2                    |
                    |                                          |
                    |   +----------------------------------+   |
                    |   |          Nginx (Port 80)         |   |
                    |   +----------------+-----------------+   |
                    |                    |                     |
                    |          +---------+---------+           |
                    |          |                   |           |
                    |          v                   v           |
                    |  /var/www/nexora      Reverse Proxy      |
                    |  (React SPA Build)   http://localhost:5000|
                    |                              |           |
                    |                              v           |
                    |                     Express Server (Docker)|
                    |                              |           |
                    |                              v           |
                    |                     PostgreSQL (Docker)  |
                    +------------------------------------------+
```

1. **Nginx**: Listens on port 80. Serves the compiled production static assets (`/var/www/nexora`) for frontend requests and acts as a reverse proxy forwarding `/api/v1` traffic to `http://localhost:5000`.
2. **Backend**: Express Application running inside a Docker container.
3. **Database**: PostgreSQL database running in a containerized environment with persistent volume mapping.
