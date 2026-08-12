import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import app from '../app';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { Role } from '@prisma/client';
import { errorHandler } from '../middlewares/error-handler';

// Create isolated test app for RBAC testing
const testApp = express();
testApp.use(express.json());

testApp.get('/test-admin-only', authenticateJwt, requireRole([Role.ADMIN]), (req: Request, res: Response) => {
  res.status(200).json({ success: true, data: 'Admin section' });
});

testApp.get(
  '/test-sales-warehouse',
  authenticateJwt,
  requireRole([Role.SALES, Role.WAREHOUSE]),
  (req: Request, res: Response) => {
    res.status(200).json({ success: true, data: 'Sales or Warehouse section' });
  }
);

testApp.use(errorHandler);

describe('Authentication & RBAC Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should reject login request with invalid email format', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('should reject login request with invalid credentials (user not found)', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 401 when requesting /auth/me without authorization header', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 when requesting /auth/me with invalid JWT token', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('should allow access to ADMIN role on admin-only route', async () => {
    const token = jwt.sign(
      { userId: 'admin-123', email: 'admin@example.com', role: Role.ADMIN, name: 'Admin' },
      env.JWT_SECRET
    );

    const res = await request(testApp).get('/test-admin-only').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should deny access (403 Forbidden) when SALES role attempts admin-only route', async () => {
    const token = jwt.sign(
      { userId: 'sales-123', email: 'sales@example.com', role: Role.SALES, name: 'Sales' },
      env.JWT_SECRET
    );

    const res = await request(testApp).get('/test-admin-only').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
    expect(res.body.message).toContain("Role 'SALES' is not authorized");
  });
});
