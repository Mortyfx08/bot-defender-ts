"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const default_1 = __importDefault(require("../config/default"));
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(default_1.default.DB_URI);
        console.log('MongoDB connected');
    }
    catch (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
//# sourceMappingURL=connect.js.map