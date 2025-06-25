"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBotActivity = getBotActivity;
// src/services/botActivityService.ts
async function getBotActivity() {
    const res = await fetch("/api/bot-activity");
    if (!res.ok)
        throw new Error("Failed to fetch bot activity");
    return res.json();
}
