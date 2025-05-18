"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const BlockedIP_1 = __importDefault(require("../database/models/BlockedIP"));
const router = (0, express_1.Router)();
// Middleware to block known malicious IPs
router.use((req, res, next) => {
    (async () => {
        const ip = req.ip;
        const blocked = await BlockedIP_1.default.findOne({ ip });
        if (blocked) {
            return res.status(403).json({ error: 'IP blocked' });
        }
        next();
    })().catch(next);
});
exports.default = router;
