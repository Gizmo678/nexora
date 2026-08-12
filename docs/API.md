# Nexora REST API Documentation

Base URL: `http://13.126.10.26/api/v1` (Production) / `http://localhost:5000/api/v1` (Local)

All protected endpoints require an HTTP `Authorization` header formatted as:
`Authorization: Bearer <JWT_TOKEN>`

## Response Envelope Format

### Standard Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Standard Error Response
```json
{
  "success": false,
  "message": "Detailed error message description",
  "code": "ERROR_CODE_IDENTIFIER",
  "details": { ... }
}
```

---

## 1. System Health

### GET `/health` & GET `/api/v1/health`
- **Auth**: Public
- **Description**: Returns system status, timestamp, and uptime.
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "timestamp": "2026-08-12T18:00:00.000Z",
      "uptime": 1234.56
    }
  }
  ```

---

## 2. Authentication

### POST `/api/v1/auth/login`
- **Auth**: Public
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "uuid-v4-string",
        "name": "Admin User",
        "email": "admin@example.com",
        "role": "ADMIN",
        "status": "ACTIVE"
      }
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized` (`INVALID_CREDENTIALS`): Email or password invalid.
  - `403 Forbidden` (`ACCOUNT_SUSPENDED`): User account status is `SUSPENDED`.

### GET `/api/v1/auth/me`
- **Auth**: Bearer Token (All authenticated roles)
- **Description**: Returns the authenticated user's current profile.

---

## 3. Customer CRM

### GET `/api/v1/customers`
- **Auth**: `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`
- **Query Params**: `search`, `customerType`, `status`, `page` (default 1), `limit` (default 20)
- **Description**: Retrieves paginated customer accounts list.

### POST `/api/v1/customers`
- **Auth**: `ADMIN`, `SALES`
- **Body**: `customerName`, `mobile`, `email`, `businessName`, `address`, `customerType` (`RETAIL`|`WHOLESALE`|`DISTRIBUTOR`), `status` (`LEAD`|`ACTIVE`|`INACTIVE`), optional `gstNumber`.

### GET `/api/v1/customers/:id`
- **Auth**: `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`
- **Description**: Retrieves detailed customer record including interaction follow-up logs and sales challans history.

### PATCH `/api/v1/customers/:id`
- **Auth**: `ADMIN`, `SALES`
- **Description**: Updates existing customer fields.

### POST `/api/v1/customers/:id/follow-ups`
- **Auth**: `ADMIN`, `SALES`
- **Body**: `note` (min 3 chars), optional `followUpDate`.
- **Description**: Appends a follow-up note and updates the customer's next follow-up date.

---

## 4. Products & Inventory

### GET `/api/v1/products`
- **Auth**: `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`
- **Query Params**: `search`, `category`, `lowStock` (`true`/`false`), `page`, `limit`
- **Description**: Retrieves products catalog with computed `isLowStock` indicator (`currentStock <= minStock`).

### POST `/api/v1/products`
- **Auth**: `ADMIN`, `WAREHOUSE`
- **Body**: `name`, `sku`, `category`, `unitPrice` (positive number), `currentStock` (int >= 0), `minStock` (int >= 0), `warehouseLocation`.
- **Error Response**: `409 Conflict` if SKU already exists.

### GET `/api/v1/products/:id`
- **Auth**: `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`
- **Description**: Retrieves product record with recent 10 stock movement audit logs.

### PATCH `/api/v1/products/:id`
- **Auth**: `ADMIN`, `WAREHOUSE`
- **Description**: Updates product fields (SKU uniqueness enforced).

---

## 5. Stock Movements

### GET `/api/v1/stock-movements`
- **Auth**: `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`
- **Query Params**: `productId`, `type` (`IN`|`OUT`), `page`, `limit`
- **Description**: Retrieves stock movement audit logs with product and user attribution details.

### POST `/api/v1/stock-movements`
- **Auth**: `ADMIN`, `WAREHOUSE`
- **Body**: `productId`, `quantity` (positive integer), `type` (`IN`|`OUT`), `reason`.
- **Behavior**: Executes atomic transaction updating product stock (`increment` for IN, `decrement` for OUT). Rejects OUT dispatches if available stock is insufficient (`HTTP 400 INSUFFICIENT_STOCK`).

---

## 6. Sales Challans

### GET `/api/v1/challans`
- **Auth**: `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`
- **Query Params**: `search`, `status` (`DRAFT`|`CONFIRMED`|`CANCELLED`), `customerId`, `page`, `limit`

### POST `/api/v1/challans`
- **Auth**: `ADMIN`, `SALES`
- **Body**: `customerId`, `items`: array of `{ productId, quantity }`.
- **Behavior**: Creates sales challan in `DRAFT` status, generates sequential number (`CH-YYYY-XXXX`), and locks unit prices as snapshot line items (`productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot`, `lineTotal`).

### GET `/api/v1/challans/:id`
- **Auth**: `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`
- **Description**: Retrieves full sales challan object for viewing or printing.

### POST `/api/v1/challans/:id/confirm`
- **Auth**: `ADMIN`, `SALES`
- **Behavior**: Executes database transaction:
  1. Locks challan row (`SELECT FOR UPDATE`).
  2. Locks product rows (`SELECT FOR UPDATE`).
  3. Validates stock availability.
  4. Decrements current stock.
  5. Inserts stock movement `OUT` records.
  6. Updates status to `CONFIRMED`.

### POST `/api/v1/challans/:id/cancel`
- **Auth**: `ADMIN`, `SALES`
- **Behavior**: Cancels a `DRAFT` sales challan.

---

## 7. User Administration

### GET `/api/v1/users`
- **Auth**: `ADMIN` only
- **Query Params**: `search`, `role`, `status`, `page`, `limit`

### GET `/api/v1/users/:id`
- **Auth**: `ADMIN` only
- **Description**: Fetches user profile along with historical attribution count (`challans`, `movements`, `followUps`).

### POST `/api/v1/users`
- **Auth**: `ADMIN` only
- **Body**: `name`, `email`, `password` (min 6), `role`, `status` (`ACTIVE`|`SUSPENDED`).

### PATCH `/api/v1/users/:id`
- **Auth**: `ADMIN` only
- **Body**: optional `name`, `email`, `password`, `role`, `status`.
- **Guards**: Self-demotion, self-suspension, and last-admin modification blocked.

### PATCH `/api/v1/users/:id/status`
- **Auth**: `ADMIN` only
- **Body**: `{ "status": "ACTIVE" | "SUSPENDED" }`.

### DELETE `/api/v1/users/:id`
- **Auth**: `ADMIN` only
- **Behavior**: Deletes user if zero relations exist. If user has created challans or stock movements, returns `400 Bad Request` instructing admin to suspend user instead.

---

## 8. Executive Dashboard Metrics

### GET `/api/v1/dashboard/metrics`
- **Auth**: `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`
- **Description**: Returns operational counters: total customers, product count, low stock count, draft challans count, confirmed challans count, total sales value, upcoming 7-day follow-ups, low stock items list, and recent challans feed.
