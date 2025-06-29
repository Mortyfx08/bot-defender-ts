"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockedIP = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const BlockedIPSchema = new mongoose_1.default.Schema({
    ip: { type: String, required: true },
    shop: { type: String },
    reason: { type: String },
    blockedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    metadata: { type: mongoose_1.default.Schema.Types.Mixed },
});
exports.BlockedIP = mongoose_1.default.model('BlockedIP', BlockedIPSchema);
