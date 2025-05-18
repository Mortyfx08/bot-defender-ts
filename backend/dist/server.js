"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const default_1 = __importDefault(require("./config/default"));
const AttemptLog_1 = __importDefault(require("./models/AttemptLog"));
const BlockedIP_1 = __importDefault(require("./models/BlockedIP"));
const User_1 = __importDefault(require("./models/User"));
const Stats_1 = __importDefault(require("./models/Stats"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("./middlewares/auth");
const app = (0, express_1.default)();
const PORT = default_1.default.PORT || 3000;
// Middleware
app.use(express_1.default.json());
// Health Check Route
app.get('/api/health', async (_req, res, next) => {
    try {
        res.status(200).json({
            status: 'success',
            message: 'API is healthy',
            database: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected'
        });
    }
    catch (err) {
        next(err);
    }
});
// Get all blocked IPs
app.get('/api/blocked-ips', async (_req, res, next) => {
    try {
        const blockedIPs = await BlockedIP_1.default.find().sort({ blockedAt: -1 });
        res.status(200).json({
            status: 'success',
            data: blockedIPs
        });
    }
    catch (err) {
        next(err);
    }
});
// Check if admin exists
app.get('/api/check-admin', async (_req, res, next) => {
    try {
        const admin = await User_1.default.findOne({ role: 'admin' });
        res.status(200).json({
            status: 'success',
            exists: !!admin
        });
    }
    catch (err) {
        next(err);
    }
});
// Get all users
app.get('/api/users', async (_req, res, next) => {
    try {
        const users = await User_1.default.find().select('-password'); // Exclude passwords from response
        res.status(200).json({
            status: 'success',
            data: users
        });
    }
    catch (err) {
        next(err);
    }
});
// ======================
// USER REGISTRATION
// ======================
app.post('/api/register', async (req, res, next) => {
    (async () => {
        try {
            const { email, password, storeName } = req.body;
            // Create user
            const user = await User_1.default.create({ email, password, storeName });
            // Generate JWT
            const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
            return res.status(201).json({ token, user: { id: user._id, email } });
        }
        catch (err) {
            next(err);
        }
        return;
    })();
});
// ======================
// USER LOGIN
// ======================
app.post('/api/login', (req, res, next) => {
    (async () => {
        try {
            const { email, password } = req.body;
            const user = await User_1.default.findOne({ email });
            if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }
            const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
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
        }
        catch (err) {
            next(err);
        }
        return;
    })();
});
// ======================
// USER DASHBOARD
// ======================
app.get('/api/dashboard', (req, res, next) => {
    (async () => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    status: 'error',
                    message: 'No token provided'
                });
            }
            let decoded;
            try {
                decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            }
            catch (err) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid token'
                });
            }
            const user = await User_1.default.findById(decoded.userId);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }
            const stats = await Stats_1.default.findOne({ userId: user._id });
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
        }
        catch (err) {
            next(err);
        }
        return;
    })();
});
// ======================
// UPDATE SCAN TO TRACK USER STATS
// ======================
app.post('/api/scan', (req, res, next) => {
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
            const log = new AttemptLog_1.default({
                ip,
                userAgent,
                type: 'scanner',
                timestamp: new Date(),
                userId: userId || null
            });
            await log.save();
            // Update user stats if logged in
            if (userId) {
                await Stats_1.default.findOneAndUpdate({ userId }, {
                    $inc: { scanAttempts: 1 },
                    $set: { lastScan: new Date() }
                });
            }
            // Block logic (existing code)
            const attemptCount = await AttemptLog_1.default.countDocuments({ ip });
            if (attemptCount >= 5) {
                const existingBlock = await BlockedIP_1.default.findOne({ ip });
                if (!existingBlock) {
                    const blockedIP = new BlockedIP_1.default({
                        ip,
                        reason: `Auto-blocked after ${attemptCount} attempts`,
                        blockedAt: new Date()
                    });
                    await blockedIP.save();
                    // Update blocked count for all affected users
                    await Stats_1.default.updateMany({ userId: { $in: await AttemptLog_1.default.distinct('userId', { ip }) } }, { $inc: { blockedBots: 1 } });
                }
            }
            return res.status(201).json({
                status: 'success',
                data: log.toObject(),
                attempts: attemptCount,
                isBlocked: attemptCount >= 5
            });
        }
        catch (err) {
            next(err);
        }
        return;
    })();
});
// IP Blocking Route
app.post('/api/block', (req, res, next) => {
    (async () => {
        try {
            const { ip, reason } = req.body;
            if (!ip) {
                return res.status(400).json({
                    status: 'error',
                    message: 'IP is required'
                });
            }
            const blockedIP = new BlockedIP_1.default({
                ip,
                reason: reason || 'Manual block',
                blockedAt: new Date()
            });
            await blockedIP.save();
            return res.status(201).json({
                status: 'success',
                data: blockedIP.toObject()
            });
        }
        catch (err) {
            next(err);
        }
        return;
    })();
});
// User Management Route (Create User)
app.post('/api/users', (req, res, next) => {
    (async () => {
        try {
            const { email, password, role } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email and password are required'
                });
            }
            const user = new User_1.default({
                email,
                password,
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
        }
        catch (err) {
            next(err);
        }
        return;
    })();
});
// Initialize admin (run once)
app.post('/api/init-admin', (req, res, next) => {
    (async () => {
        try {
            // Check if admin already exists
            const existingAdmin = await User_1.default.findOne({ role: 'admin' });
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
            const admin = new User_1.default({
                email,
                password,
                role: 'admin'
            });
            await admin.save();
            return res.status(201).json({
                status: 'success',
                message: 'Admin user created'
            });
        }
        catch (err) {
            next(err);
        }
        return;
    })();
});
// Admin login
app.post('/api/admin/login', (req, res, next) => {
    (async () => {
        try {
            const { email, password } = req.body;
            const adminUser = await User_1.default.findOne({ email, role: 'admin' });
            if (!adminUser) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }
            const isMatch = await bcryptjs_1.default.compare(password, adminUser.password);
            if (!isMatch) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }
            // Create JWT token
            const token = jsonwebtoken_1.default.sign({ userId: adminUser._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
            return res.status(200).json({
                status: 'success',
                token,
                admin: {
                    id: adminUser._id,
                    email: adminUser.email
                }
            });
        }
        catch (err) {
            next(err);
        }
        return;
    })();
});
// Protected admin route example
app.get('/api/admin/data', (req, res, next) => {
    (async () => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    status: 'error',
                    message: 'No token provided'
                });
            }
            let decoded;
            try {
                decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            }
            catch (err) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid token'
                });
            }
            const adminUser = await User_1.default.findById(decoded.userId);
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
        }
        catch (err) {
            next(err);
        }
        return;
    })();
});
// Protected route example
app.get('/api/user/stats', auth_1.authenticate, (req, res) => {
    const user = req.user;
    Stats_1.default.findOne({ userId: user.id })
        .then(stats => res.json(stats))
        .catch((err) => res.status(500).json({ status: 'error', message: err.message || 'Failed to fetch stats' }));
});
// Refresh token route
app.post('/api/refresh-token', auth_1.authenticate, (req, res) => {
    const user = req.user;
    const newToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: newToken });
});
// 404 Handler
app.use((_req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
});
// Error Handler
app.use((err, _req, res, _next) => {
    console.error('Global error:', err);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal server error'
    });
});
// Database Connection
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(default_1.default.DB_URI);
        console.log('✅ MongoDB connected successfully');
    }
    catch (err) {
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
exports.default = app;
//# sourceMappingURL=server.js.map