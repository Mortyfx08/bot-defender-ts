"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_APP_DATA = void 0;
exports.detectBot = detectBot;
exports.GET_APP_DATA = `query GetAppData { rules { id name } }`;
function detectBot(userAgent) {
    const bots = [
        'Googlebot', 'Bingbot', 'Slurp',
        'DuckDuckBot', 'YandexBot', 'Sogou'
    ];
    return bots.some(bot => userAgent.includes(bot));
}
