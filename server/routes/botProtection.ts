import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { StoreSettings } from '../../database/models/StoreSettings';
import { BlockedIP } from '../../database/models/BlockedIP';
import { AttemptLog } from '../../database/models/AttemptLog';

const router = Router();

// Get store settings
router.get('/settings', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const storeId = req.session?.shop;
    if (!storeId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const settings = await StoreSettings.findOne({ storeId });
    res.json(settings || {});
  } catch (error) {
    next(error);
  }
});

// Update store settings
router.put('/settings', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const storeId = req.session?.shop;
    if (!storeId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const settings = await StoreSettings.findOneAndUpdate(
      { storeId },
      { ...req.body, storeId },
      { upsert: true, new: true }
    );
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// Get blocked IPs
router.get('/blocked-ips', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const storeId = req.session?.shop;
    if (!storeId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const blockedIPs = await BlockedIP.find({ storeId });
    res.json(blockedIPs);
  } catch (error) {
    next(error);
  }
});

// Unblock IP
router.delete('/blocked-ips/:ip', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const storeId = req.session?.shop;
    if (!storeId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    await BlockedIP.findOneAndDelete({ ip: req.params.ip, storeId });
    res.json({ message: 'IP unblocked successfully' });
  } catch (error) {
    next(error);
  }
});

// Get attempt logs
router.get('/logs', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const storeId = req.session?.shop;
    if (!storeId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const logs = await AttemptLog.find({ storeId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    const total = await AttemptLog.countDocuments({ storeId });
    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get bot protection settings
router.get('/bot-protection-settings', authenticate, async (req, res) => {
  try {
    // For now, return default settings
    res.json({
      isEnabled: true,
      blockThreshold: 50,
      blockDuration: 24,
      notifyOnBlock: true
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update bot protection settings
router.put('/bot-protection-settings', authenticate, async (req, res) => {
  try {
    const { isEnabled, blockThreshold, blockDuration, notifyOnBlock } = req.body;
    // For now, just return the updated settings
    res.json({
      isEnabled,
      blockThreshold,
      blockDuration,
      notifyOnBlock
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attempt logs
router.get('/bot-protection-logs', authenticate, async (req, res) => {
  try {
    const logs = await AttemptLog.find()
      .sort({ timestamp: -1 })
      .limit(100);
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unblock an IP
router.delete('/bot-protection-blocked-ips/:ip', authenticate, async (req, res) => {
  try {
    const { ip } = req.params;
    await BlockedIP.findOneAndDelete({ ip });
    res.json({ message: 'IP unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;