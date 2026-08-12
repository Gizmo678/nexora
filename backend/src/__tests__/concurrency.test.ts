import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../config/prisma';

const API_URL = 'http://localhost:5000/api/v1';

async function apiPost(path: string, body: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

describe('Concurrency & Stock Overselling Prevention Tests', () => {
  let adminToken: string;
  let salesToken: string;
  let testProductId: string;
  let testCustomerId: string;

  beforeAll(async () => {
    // 1. Authenticate Client A (Admin) and Client B (Sales)
    const adminRes = await apiPost('/auth/login', {
      email: 'admin@example.com',
      password: 'Password123!',
    });
    expect(adminRes.ok).toBe(true);
    adminToken = adminRes.data.data.token;

    const salesRes = await apiPost('/auth/login', {
      email: 'sales@example.com',
      password: 'Password123!',
    });
    expect(salesRes.ok).toBe(true);
    salesToken = salesRes.data.data.token;

    // 2. Fetch test product and customer
    const product = await prisma.product.findFirst();
    expect(product).toBeDefined();
    testProductId = product!.id;

    const customer = await prisma.customer.findFirst();
    expect(customer).toBeDefined();
    testCustomerId = customer!.id;
  });

  it('TEST 1: Valid Split (Stock = 9, Requested: 5 + 4 concurrently)', async () => {
    // Reset starting stock to exactly 9
    await prisma.product.update({
      where: { id: testProductId },
      data: { currentStock: 9 },
    });

    // Create 2 draft challans
    const challanARes = await apiPost('/challans', { customerId: testCustomerId, items: [{ productId: testProductId, quantity: 5 }] }, adminToken);
    expect(challanARes.ok).toBe(true);
    const challanAId = challanARes.data.data.id;

    const challanBRes = await apiPost('/challans', { customerId: testCustomerId, items: [{ productId: testProductId, quantity: 4 }] }, salesToken);
    expect(challanBRes.ok).toBe(true);
    const challanBId = challanBRes.data.data.id;

    // Execute confirmation simultaneously with Promise.all
    const [resA, resB] = await Promise.all([
      apiPost(`/challans/${challanAId}/confirm`, {}, adminToken),
      apiPost(`/challans/${challanBId}/confirm`, {}, salesToken),
    ]);

    console.log('TEST 1 Results:', { statusA: resA.status, statusB: resB.status });

    expect(resA.ok).toBe(true);
    expect(resB.ok).toBe(true);

    // Query DB state directly
    const updatedProduct = await prisma.product.findUnique({ where: { id: testProductId } });
    console.log('TEST 1 Final Stock:', updatedProduct?.currentStock);

    expect(updatedProduct?.currentStock).toBe(0);
  });

  it('TEST 2: Oversale Race Condition (Stock = 9, Requested: 5 + 5 concurrently)', async () => {
    // Reset starting stock to exactly 9
    await prisma.product.update({
      where: { id: testProductId },
      data: { currentStock: 9 },
    });

    // Create 2 draft challans requesting 5 each
    const challanARes = await apiPost('/challans', { customerId: testCustomerId, items: [{ productId: testProductId, quantity: 5 }] }, adminToken);
    const challanAId = challanARes.data.data.id;

    const challanBRes = await apiPost('/challans', { customerId: testCustomerId, items: [{ productId: testProductId, quantity: 5 }] }, salesToken);
    const challanBId = challanBRes.data.data.id;

    // Execute confirmation simultaneously with Promise.all
    const [resA, resB] = await Promise.all([
      apiPost(`/challans/${challanAId}/confirm`, {}, adminToken),
      apiPost(`/challans/${challanBId}/confirm`, {}, salesToken),
    ]);

    console.log('TEST 2 Results:', {
      clientA: { status: resA.status, ok: resA.ok, message: resA.data?.message },
      clientB: { status: resB.status, ok: resB.ok, message: resB.data?.message },
    });

    const successCount = (resA.ok ? 1 : 0) + (resB.ok ? 1 : 0);
    const failCount = (!resA.ok ? 1 : 0) + (!resB.ok ? 1 : 0);

    // Verify exactly 1 succeeded and 1 failed
    expect(successCount).toBe(1);
    expect(failCount).toBe(1);

    // Query DB state directly
    const updatedProduct = await prisma.product.findUnique({ where: { id: testProductId } });
    console.log('TEST 2 Final Stock:', updatedProduct?.currentStock);

    expect(updatedProduct?.currentStock).toBe(4);
  });

  it('TEST 3: High Contention (Stock = 9, Requested: 3, 3, 2, 2, 1 = 11 total)', async () => {
    // Reset starting stock to exactly 9
    await prisma.product.update({
      where: { id: testProductId },
      data: { currentStock: 9 },
    });

    const quantities = [3, 3, 2, 2, 1];
    const challanIds: string[] = [];

    for (const qty of quantities) {
      const res = await apiPost('/challans', { customerId: testCustomerId, items: [{ productId: testProductId, quantity: qty }] }, adminToken);
      challanIds.push(res.data.data.id);
    }

    // Launch all 5 confirmations in parallel
    const responses = await Promise.all(
      challanIds.map((id) => apiPost(`/challans/${id}/confirm`, {}, adminToken))
    );

    const successResponses = responses.filter((r) => r.ok);
    const failResponses = responses.filter((r) => !r.ok);

    console.log('TEST 3 Results:', {
      successCount: successResponses.length,
      failCount: failResponses.length,
    });

    const updatedProduct = await prisma.product.findUnique({ where: { id: testProductId } });
    console.log('TEST 3 Final Stock:', updatedProduct?.currentStock);

    // Final stock must NEVER be negative
    expect(updatedProduct?.currentStock).toBeGreaterThanOrEqual(0);
    // Total stock deducted must not exceed 9
    expect(9 - updatedProduct!.currentStock).toBeLessThanOrEqual(9);
  });
});
