import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import config from './config/default';
import AttemptLog from './models/AttemptLog';
import BlockedIP from './models/BlockedIP';
import User from './models/User';
import Stats from './models/Stats';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from './middlewares/auth';

const app = express();
const PORT = config.PORT || 3000;

// Middleware
app.use(express.json());

// Health Check Route
app.get('/api/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'API is healthy',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  } catch (err: any) {
    next(err);
  }
});

// Get all blocked IPs
app.get('/api/blocked-ips', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const blockedIPs = await BlockedIP.find().sort({ blockedAt: -1 });
    res.status(200).json({
      status: 'success',
      data: blockedIPs
    });
  } catch (err: any) {
    next(err);
  }
});

// Check if admin exists
app.get('/api/check-admin', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    res.status(200).json({
      status: 'success',
      exists: !!admin
    });
  } catch (err: any) {
    next(err);
  }
});

// Get all users
app.get('/api/users', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select('-password'); // Exclude passwords from response
    res.status(200).json({
      status: 'success',
      data: users
    });
  } catch (err: any) {
    next(err);
  }
});

// ======================
// USER REGISTRATION
// ======================
app.post('/api/register', async (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const { email, password, storeName } = req.body;
      // Create user
      const user = await User.create({ email, password, storeName });
      // Generate JWT
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      return res.status(201).json({ token, user: { id: user._id, email } });
    } catch (err: any) {
      next(err);
    }
    return;
  })();
});

// ======================
// USER LOGIN
// ======================
app.post('/api/login', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        status: 'success',
        token,
        user: {
          id: user._id,
          email: user.email,
          storeName: user.storeName,
          role: user.role
        }
      });
    } catch (err: any) {
      next(err);
    }
    return;
  })();
});

// ======================
// USER DASHBOARD
// ======================
app.get('/api/dashboard', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'No token provided'
        });
      }

      let decoded: { userId: string };
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
      } catch (err: any) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token'
        });
      }
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
      const stats = await Stats.findOne({ userId: user._id });
      return res.status(200).json({
        status: 'success',
        data: {
          user: {
            email: user.email,
            storeName: user.storeName
          },
          stats: {
            totalBlockedBots: stats?.blockedBots || 0,
            totalScanAttempts: stats?.scanAttempts || 0,
            lastScan: stats?.lastScan
          }
        }
      });
    } catch (err: any) {
      next(err);
    }
    return;
  })();
});

// ======================
// UPDATE SCAN TO TRACK USER STATS
// ======================
app.post('/api/scan', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const { ip, userAgent, userId } = req.body;

      if (!ip || !userAgent) {
        return res.status(400).json({
          status: 'error',
          message: 'IP and userAgent are required'
        });
      }

      // Log the attempt
      const log = new AttemptLog({
        ip,
        userAgent,
        type: 'scanner',
        timestamp: new Date(),
        userId: userId || null
      });
      await log.save();

      // Update user stats if logged in
      if (userId) {
        await Stats.findOneAndUpdate(
          { userId },
          {
            $inc: { scanAttempts: 1 },
            $set: { lastScan: new Date() }
          }
        );
      }

      // Block logic (existing code)
      const attemptCount = await AttemptLog.countDocuments({ ip });
      if (attemptCount >= 5) {
        const existingBlock = await BlockedIP.findOne({ ip });
        if (!existingBlock) {
          const blockedIP = new BlockedIP({
            ip,
            reason: `Auto-blocked after ${attemptCount} attempts`,
            blockedAt: new Date()
          });
          await blockedIP.save();

          // Update blocked count for all affected users
          await Stats.updateMany(
            { userId: { $in: await AttemptLog.distinct('userId', { ip }) } },
            { $inc: { blockedBots: 1 } }
          );
        }
      }

      return res.status(201).json({
        status: 'success',
        data: log.toObject(),
        attempts: attemptCount,
        isBlocked: attemptCount >= 5
      });
    } catch (err: any) {
      next(err);
    }
    return;
  })();
});

// IP Blocking Route
app.post('/api/block', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const { ip, reason } = req.body;

      if (!ip) {
        return res.status(400).json({
          status: 'error',
          message: 'IP is required'
        });
      }

      const blockedIP = new BlockedIP({
        ip,
        reason: reason || 'Manual block',
        blockedAt: new Date()
      });
      await blockedIP.save();

      return res.status(201).json({
        status: 'success',
        data: blockedIP.toObject()
      });

    } catch (err: any) {
      next(err);
    }
    return;
  })();
});

// User Management Route (Create User)
app.post('/api/users', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const { email, password, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email and password are required'
        });
      }

      const user = new User({
        email,
        password, // Note: In production, hash this password!
        role: role || 'user'
      });
      await user.save();

      return res.status(201).json({
        status: 'success',
        data: {
          id: user._id,
          email: user.email,
          role: user.role
        }
      });

    } catch (err: any) {
      next(err);
    }
    return;
  })();
});

// Initialize admin (run once)
app.post('/api/init-admin', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      // Check if admin already exists
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        return res.status(400).json({
          status: 'error',
          message: 'Admin already exists'
        });
      }
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email and password are required'
        });
      }
      const admin = new User({
        email,
        password, // will be hashed by the pre-save hook
        role: 'admin'
      });
      await admin.save();
      return res.status(201).json({
        status: 'success',
        message: 'Admin user created'
      });
    } catch (err: any) {
      next(err);
    }
    return;
  })();
});

// Admin login
app.post('/api/admin/login', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const { email, password } = req.body;
      const adminUser = await User.findOne({ email, role: 'admin' });
      if (!adminUser) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }
      const isMatch = await bcrypt.compare(password, adminUser.password);
      if (!isMatch) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }
      // Create JWT token
      const token = jwt.sign(
        { userId: adminUser._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );
      return res.status(200).json({
        status: 'success',
        token,
        admin: {
          id: adminUser._id,
          email: adminUser.email
        }
      });
    } catch (err: any) {
      next(err);
    }
    return;
  })();
});

// Protected admin route example
app.get('/api/admin/data', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({
          status: 'error',
          message: 'No token provided'
        });
      }
      let decoded: { userId: string };
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
      } catch (err: any) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token'
        });
      }
      const adminUser = await User.findById(decoded.userId);
      if (!adminUser) {
        return res.status(401).json({
          status: 'error',
          message: 'Admin not found'
        });
      }
      return res.status(200).json({
        status: 'success',
        data: {
          message: 'This is protected admin data',
          adminEmail: adminUser.email
        }
      });
    } catch (err: any) {
      next(err);
    }
    return;
  })();
});

// Protected route example
app.get('/api/user/stats', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  Stats.findOne({ userId: user.id })
    .then(stats => res.json(stats))
    .catch((err: any) => res.status(500).json({ status: 'error', message: err.message || 'Failed to fetch stats' }));
});

// Refresh token route
app.post('/api/refresh-token', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const newToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
  res.json({ token: newToken });
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Global error:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// Database Connection
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.DB_URI as string);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api/health`);
  });
});

export default app;