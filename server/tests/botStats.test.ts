import request from 'supertest';
import express from 'express';
import botStatsRouter from '../routes/botStats';

jest.mock('../models/AttemptLog', () => ({
  aggregate: jest.fn(),
  find: jest.fn(),
}));
const AttemptLog = require('../models/AttemptLog');

describe('/stats API', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    // Mock auth middleware to inject shopify session
    app.use((req, res, next) => {
      req.shopify = { session: { shop: 'test-shop' } };
      next();
    });
    app.use('/stats', botStatsRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns stats and recent attacks', async () => {
    AttemptLog.aggregate.mockResolvedValueOnce([
      {
        totalBlockedBots: 5,
        totalScanAttempts: 10,
        lastScan: new Date(),
        falsePositives: 1,
      },
    ]);
    AttemptLog.find.mockReturnValueOnce({
      sort: () => ({
        limit: () => ({
          select: () => [
            { ip: '1.2.3.4', timestamp: new Date(), userAgent: 'bot', blocked: true },
          ],
        }),
      }),
    });
    const res = await request(app).get('/stats');
    expect(res.status).toBe(200);
    expect(res.body.stats.totalBlockedBots).toBe(5);
    expect(res.body.recentAttacks[0].ip).toBe('1.2.3.4');
    expect(res.body.healthScore).toBeLessThanOrEqual(100);
  });

  it('returns 401 if no shop ID', async () => {
    const appNoAuth = express();
    appNoAuth.use((req, res, next) => next()); // no shopify session
    appNoAuth.use('/stats', botStatsRouter);
    const res = await request(appNoAuth).get('/stats');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Unauthorized/);
  });

  it('returns 500 on error', async () => {
    AttemptLog.aggregate.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/stats');
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/Failed to fetch stats/);
  });
}); 