import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('GET /health', () => {
  it('should return 200 OK and status ok payload', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
