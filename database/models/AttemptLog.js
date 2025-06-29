"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttemptLog = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AttemptLogSchema = new mongoose_1.default.Schema({
    ip: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userAgent: { type: String },
    path: { type: String },
    severity: { type: String },
    metadata: { type: mongoose_1.default.Schema.Types.Mixed },
});
exports.AttemptLog = mongoose_1.default.model('AttemptLog', AttemptLogSchema);
