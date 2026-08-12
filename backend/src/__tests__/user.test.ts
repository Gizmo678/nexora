import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('ADMIN User Management & RBAC Authorization Tests', () => {
  let adminToken: string;
  let salesToken: string;
  let adminUserId: string;
  let createdUserId: string;

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;
    adminUserId = adminRes.body.data.user.id;

    // 2. Authenticate Sales User
    const salesRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'sales@example.com', password: 'Password123!' });
    expect(salesRes.status).toBe(200);
    salesToken = salesRes.body.data.token;
  });

  it('1. GET /api/v1/users — ADMIN should succeed, SALES should return 403 FORBIDDEN', async () => {
    const adminReq = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminReq.status).toBe(200);
    expect(adminReq.body.data.items).toBeDefined();

    const salesReq = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${salesToken}`);
    expect(salesReq.status).toBe(403);
    expect(salesReq.body.code).toBe('FORBIDDEN');
  });

  it('2. POST /api/v1/users — ADMIN can create new user', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Team Member',
        email: 'teammember@example.com',
        password: 'Password123!',
        role: 'WAREHOUSE',
        status: 'ACTIVE',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe('teammember@example.com');
    expect(res.body.data.role).toBe('WAREHOUSE');
    expect(res.body.data.status).toBe('ACTIVE');
    createdUserId = res.body.data.id;
  });

  it('3. POST /api/v1/users — Duplicate email should return 409 CONFLICT', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Duplicate Email Test',
        email: 'teammember@example.com',
        password: 'Password123!',
        role: 'SALES',
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('4. PATCH /api/v1/users/:id/status — Admin can suspend user & suspended user cannot log in', async () => {
    // Suspend user
    const suspendRes = await request(app)
      .patch(`/api/v1/users/${createdUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' });

    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.status).toBe('SUSPENDED');

    // Attempt login as suspended user
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'teammember@example.com', password: 'Password123!' });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.code).toBe('ACCOUNT_SUSPENDED');
  });

  it('5. PATCH /api/v1/users/:id/status — Admin can reactivate suspended user', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${createdUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACTIVE');
  });

  it('6. Self-Protection Check — Admin cannot suspend or demote themselves', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${adminUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SUSPENDED' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SELF_SUSPENSION_DENIED');
  });

  it('7. DELETE /api/v1/users/:id — Clean user deletion when 0 relations exist', async () => {
    const res = await request(app)
      .delete(`/api/v1/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
