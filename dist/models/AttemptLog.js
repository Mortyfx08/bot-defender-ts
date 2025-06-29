"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const attemptLogSchema = new mongoose_1.default.Schema({
    shopId: {
        type: String,
        required: true,
        index: true
    },
    ip: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['blocked', 'allowed', 'false_positive'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    details: {
        type: mongoose_1.default.Schema.Types.Mixed
    }
});
const AttemptLog = mongoose_1.default.model('AttemptLog', attemptLogSchema);
exports.default = AttemptLog;
