"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AttemptLogSchema = new mongoose_1.Schema({
    ip: { type: String, required: true },
    type: { type: String, enum: ['brute-force', 'scanner', 'credential-stuffing'], required: true },
    timestamp: { type: Date, default: Date.now }
});
exports.default = (0, mongoose_1.model)('AttemptLog', AttemptLogSchema);
