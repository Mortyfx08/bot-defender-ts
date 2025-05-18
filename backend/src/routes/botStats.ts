import { Request, Response, Router } from 'express';
import AttemptLog from '../models/AttemptLog';

const router = Router();

// Get bot attack statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await AttemptLog.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;