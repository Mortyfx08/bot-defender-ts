"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AttemptLogSchema = new mongoose_1.Schema({
    ip: {
        type: String,
        required: true,
        validate: {
            validator: (value) => {
                // Simple IP validation regex (IPv4)
                return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value);
            },
            message: (props) => `${props.value} is not a valid IP address!`
        }
    },
    type: {
        type: String,
        enum: ['brute-force', 'scanner', 'credential-stuffing'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true // Add index for faster querying by timestamp
    },
    // Optional field for user agent if needed
    userAgent: {
        type: String,
        required: false
    }
}, {
    // Add createdAt and updatedAt timestamps
    timestamps: true
});
// Add index for IP field for faster queries
AttemptLogSchema.index({ ip: 1 });
// Create the model
const AttemptLog = (0, mongoose_1.model)('AttemptLog', AttemptLogSchema);
exports.default = AttemptLog;
//# sourceMappingURL=AttemptLog.js.map