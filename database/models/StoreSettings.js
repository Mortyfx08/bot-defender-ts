"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreSettings = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const StoreSettingsSchema = new mongoose_1.default.Schema({
    shop: { type: String, required: true },
    settings: { type: mongoose_1.default.Schema.Types.Mixed },
    updatedAt: { type: Date, default: Date.now },
});
exports.StoreSettings = mongoose_1.default.model('StoreSettings', StoreSettingsSchema);
