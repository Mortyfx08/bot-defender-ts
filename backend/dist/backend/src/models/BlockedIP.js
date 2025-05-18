"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BlockedIPSchema = new mongoose_1.Schema({
    ip: { type: String, required: true, unique: true },
    reason: { type: String, required: true },
    blockedAt: { type: Date, default: Date.now }
});
exports.default = (0, mongoose_1.model)('BlockedIP', BlockedIPSchema);
