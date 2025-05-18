"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AttemptLog_1 = __importDefault(require("../models/AttemptLog"));
const router = (0, express_1.Router)();
// Get bot attack statistics
router.get('/stats', async (_req, res) => {
    try {
        const stats = await AttemptLog_1.default.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        res.json(stats);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
exports.default = router;
//# sourceMappingURL=botStats.js.map