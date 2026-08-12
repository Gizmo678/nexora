import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { Role, CustomerType, CustomerStatus } from '@prisma/client';

describe('Customer CRM & Follow-Up Module Suite', () => {
  const adminToken = jwt.sign(
    { userId: 'admin-1', email: 'admin@example.com', role: Role.ADMIN, name: 'Admin User' },
    env.JWT_SECRET
  );

  const salesToken = jwt.sign(
    { userId: 'sales-1', email: 'sales@example.com', role: Role.SALES, name: 'Sales Manager' },
    env.JWT_SECRET
  );

  const warehouseToken = jwt.sign(
    { userId: 'wh-1', email: 'warehouse@example.com', role: Role.WAREHOUSE, name: 'Warehouse Op' },
    env.JWT_SECRET
  );

  const accountsToken = jwt.sign(
    { userId: 'acc-1', email: 'accounts@example.com', role: Role.ACCOUNTS, name: 'Accounts Specialist' },
    env.JWT_SECRET
  );

  const mockCustomer = {
    id: 'cust-100',
    customerName: 'Apex Wholesale Distribution',
    mobile: '+919876543210',
    email: 'apex@example.com',
    businessName: 'Apex Distributors Ltd',
    gstNumber: '27AAAAA0000A1Z5',
    customerType: CustomerType.WHOLESALE,
    address: '123 Business Hub, Metro City',
    status: CustomerStatus.ACTIVE,
    followUpDate: new Date('2026-08-20T10:00:00Z'),
    notes: 'Key wholesale buyer in western region',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { followUps: 1, challans: 0 },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/customers (Create Customer)', () => {
    it('should create a customer when invoked by SALES role', async () => {
      vi.spyOn(prisma.customer, 'create').mockResolvedValue(mockCustomer as any);

      const payload = {
        customerName: 'Apex Wholesale Distribution',
        mobile: '+919876543210',
        email: 'apex@example.com',
        businessName: 'Apex Distributors Ltd',
        gstNumber: '27AAAAA0000A1Z5',
        customerType: CustomerType.WHOLESALE,
        address: '123 Business Hub, Metro City',
        status: CustomerStatus.ACTIVE,
      };

      const res = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${salesToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customerName).toBe('Apex Wholesale Distribution');
    });

    it('should reject customer creation with 422 if mobile number is invalid/too short', async () => {
      const payload = {
        customerName: 'Invalid Customer',
        mobile: '123',
        email: 'invalid@example.com',
        businessName: 'Short Mobile Ltd',
        address: '123 Street',
      };

      const res = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${salesToken}`)
        .send(payload);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should deny WAREHOUSE role from creating a customer (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({
          customerName: 'Unauthorized Cust',
          mobile: '+919876543210',
          email: 'unauth@example.com',
          businessName: 'Unauth Inc',
          address: 'Address',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should deny ACCOUNTS role from creating a customer (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${accountsToken}`)
        .send({
          customerName: 'Accounts Attempt',
          mobile: '+919876543210',
          email: 'accounts-create@example.com',
          businessName: 'Accounts Inc',
          address: 'Address',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/customers (List & Filter Customers)', () => {
    it('should allow ACCOUNTS, SALES, and ADMIN to list customers', async () => {
      vi.spyOn(prisma.customer, 'count').mockResolvedValue(1);
      vi.spyOn(prisma.customer, 'findMany').mockResolvedValue([mockCustomer] as any);

      const res = await request(app)
        .get('/api/v1/customers?search=Apex&customerType=WHOLESALE')
        .set('Authorization', `Bearer ${accountsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.meta.total).toBe(1);
    });

    it('should deny WAREHOUSE role from viewing customer list (403 Forbidden)', async () => {
      const res = await request(app).get('/api/v1/customers').set('Authorization', `Bearer ${warehouseToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/customers/:id (Customer Details & History)', () => {
    it('should return customer details including follow-up history', async () => {
      vi.spyOn(prisma.customer, 'findUnique').mockResolvedValue({
        ...mockCustomer,
        followUps: [
          {
            id: 'f-1',
            customerId: 'cust-100',
            note: 'Initial sales call completed',
            followUpDate: new Date('2026-08-15T10:00:00Z'),
            createdById: 'sales-1',
            createdBy: { id: 'sales-1', name: 'Sales Manager', email: 'sales@example.com', role: Role.SALES },
            createdAt: new Date(),
          },
        ],
      } as any);

      const res = await request(app)
        .get('/api/v1/customers/cust-100')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('cust-100');
      expect(res.body.data.followUps).toHaveLength(1);
    });

    it('should return 404 for non-existent customer ID', async () => {
      vi.spyOn(prisma.customer, 'findUnique').mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/customers/non-existent-id')
        .set('Authorization', `Bearer ${salesToken}`);

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/customers/:id/follow-ups (Add Customer Follow-up Note)', () => {
    it('should add a follow-up note and update customer follow-up date when invoked by SALES', async () => {
      vi.spyOn(prisma.customer, 'findUnique').mockResolvedValue(mockCustomer as any);

      const mockFollowUpResult = {
        id: 'f-2',
        customerId: 'cust-100',
        note: 'Sent product price list for wholesale catalog',
        followUpDate: new Date('2026-08-25T14:00:00Z'),
        createdById: 'sales-1',
        createdBy: { id: 'sales-1', name: 'Sales Manager', email: 'sales@example.com', role: Role.SALES },
        createdAt: new Date(),
      };

      vi.spyOn(prisma, '$transaction').mockResolvedValue([mockFollowUpResult, mockCustomer] as any);

      const res = await request(app)
        .post('/api/v1/customers/cust-100/follow-ups')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          note: 'Sent product price list for wholesale catalog',
          followUpDate: '2026-08-25T14:00:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.note).toContain('Sent product price list');
    });

    it('should deny WAREHOUSE role from adding follow-up note (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/customers/cust-100/follow-ups')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({
          note: 'Warehouse note attempt',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });
});
