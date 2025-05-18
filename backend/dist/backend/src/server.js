"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const default_1 = __importDefault(require("./config/default"));
const botStats_1 = __importDefault(require("./routes/botStats"));
// import scannerRouter from './scanner'; // Remove or comment out since scanner.ts does not exist
const connect_1 = require("../../database/connect");
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use('/api/stats', botStats_1.default);
// Start server
(0, connect_1.connectDB)().then(() => {
    app.listen(default_1.default.PORT, () => {
        console.log(`Server running on port ${default_1.default.PORT}`);
    });
});
