"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BlockedIPSchema = new mongoose_1.Schema({
    ip: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: (value) => {
                // Basic IPv4 validation
                return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value);
            },
            message: (props) => `${props.value} is not a valid IPv4 address`
        }
    },
    reason: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 200
    },
    blockedAt: {
        type: Date,
        default: Date.now,
        immutable: true // Cannot be modified after creation
    },
    expiresAt: {
        type: Date,
        required: false,
        index: { expireAfterSeconds: 0 } // Automatic document expiration
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});
// Add index for faster queries by IP
BlockedIPSchema.index({ ip: 1 });
// Create the model
const BlockedIP = (0, mongoose_1.model)('BlockedIP', BlockedIPSchema);
exports.default = BlockedIP;
//# sourceMappingURL=BlockedIP.js.map