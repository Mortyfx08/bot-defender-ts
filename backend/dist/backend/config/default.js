"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    PORT: process.env.PORT || 3000,
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY || '',
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET || '',
    DB_URI: process.env.DB_URI || 'mongodb://localhost:27017/bot-defender',
    LOG_FILE: './log/attack.log'
};
