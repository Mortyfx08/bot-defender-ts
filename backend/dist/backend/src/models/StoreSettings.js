"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const StoreSettingsSchema = new mongoose_1.Schema({
    shop: { type: String, required: true, unique: true },
    autoBlock: { type: Boolean, default: true },
    sensitivity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
});
exports.default = (0, mongoose_1.model)('StoreSettings', StoreSettingsSchema);
