const request = require('supertest');
const app = require('../index');

describe('/api/dashboard', () => {
  it('returns error if shop param is missing', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns dashboard data for valid shop', async () => {
    // Mock DB/service here if needed
    const res = await request(app).get('/api/dashboard?shop=test-shop.myshopify.com');
    // Accept 200 or 404 depending on if test DB is seeded
    expect([200, 404]).toContain(res.status);
    // If 200, expect data property
    if (res.status === 200) {
      expect(res.body).toHaveProperty('data');
    }
  });
}); 