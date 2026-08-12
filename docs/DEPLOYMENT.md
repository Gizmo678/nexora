# Nexora Deployment Architecture & Setup Guide

This document details the production environment architecture deployed on AWS EC2, Nginx reverse proxy configuration, Dockerized PostgreSQL setup, and build deployment procedures.

## 1. Deployment Architecture Diagram

```mermaid
flowchart TD
    Client[Client Web Browser]
    
    subgraph AWS EC2 Host [AWS EC2 Linux Instance - 13.126.10.26]
        Nginx[Nginx Web Server - Port 80]
        
        subgraph Static Host [/var/www/nexora]
            SPA[Compiled React 19 SPA Build]
        end
        
        subgraph Node Process [Express API Server]
            Express[Express.js Engine - Port 5000]
        end
        
        subgraph Docker Environment [Docker Network]
            PGContainer[(PostgreSQL 15 Container - Port 5432)]
            PGVolume[(Docker Volume: postgres_data)]
        end
    end

    Client -->|HTTP Port 80| Nginx
    Nginx -->|Serves Static Asset Files| SPA
    Nginx -->|Proxy Pass /api/v1| Express
    Express -->|Database Connection| PGContainer
    PGContainer --- PGVolume
```

---

## 2. Infrastructure Overview

- **Cloud Provider**: Amazon Web Services (AWS) EC2.
- **Operating System**: Linux (Ubuntu / Amazon Linux).
- **Public Entry Point**: `http://13.126.10.26` (Port 80 HTTP).
- **Web Server & Reverse Proxy**: Nginx.
- **Application Server**: Node.js & Express API listening locally on `127.0.0.1:5000`.
- **Database Engine**: PostgreSQL 15 running inside a Docker container (`mini_erp_postgres`) mapped to host port 5432 with persistent volume storage (`postgres_data`).

---

## 3. Network & Security Isolation

- **Nginx Reverse Proxy**: Public HTTP traffic on port 80 is handled by Nginx. Static requests serve compiled assets directly from `/var/www/nexora`. Requests prefixed with `/api/v1` are proxy-passed internally to `http://localhost:5000/api/v1`.
- **Database Security**: PostgreSQL is accessible to the Express backend application via internal host networking. The database port is shielded by EC2 security groups.

---

## 4. Nginx Server Configuration

Below is the production Nginx virtual host configuration routing requests:

```nginx
server {
    listen 80;
    server_name 13.126.10.26;

    # Static Assets Frontend Build
    location / {
        root /var/www/nexora;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy Pass to Backend Express Server
    location /api/v1/ {
        proxy_pass http://localhost:5000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 5. Production Environment Variables

### Backend `.env` Configuration (`backend/.env`)
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://erp_user:erp_password@localhost:5432/mini_erp_db?schema=public"
JWT_SECRET="production-secure-random-secret-key-min-32-chars"
JWT_EXPIRES_IN="1d"
CORS_ORIGIN="*"
```

### Frontend Build Client Configuration (`frontend/src/api/client.ts`)
The production frontend relies on relative API routing `/api/v1`:
```typescript
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
```
This ensures browser requests call `http://13.126.10.26/api/v1/...` cleanly through the Nginx reverse proxy without cross-origin configuration mismatches or port exposures.

---

## 6. Build and Deployment Steps

### Step 1: Deploy Database via Docker Compose
```bash
docker-compose up -d
```

### Step 2: Run Database Migrations & Seed Default Accounts
```bash
cd backend
npm install
npx prisma db push
npm run seed
```

### Step 3: Build & Start Backend Application Server
```bash
npm run build
npm start
```

### Step 4: Build & Deploy Frontend Production Assets
```bash
cd ../frontend
npm install
npm run build

# Deploy compiled assets to Nginx root
sudo rm -rf /var/www/nexora/*
sudo cp -r dist/* /var/www/nexora/

# Reload Nginx
sudo systemctl reload nginx
```
