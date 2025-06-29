"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAgentAnalyzer = void 0;
exports.isShopifyBot = isShopifyBot;
class UserAgentAnalyzer {
    static isBot(userAgent) {
        if (!userAgent)
            return true;
        const ua = userAgent.toLowerCase();
        // Check for bot indicators
        if (this.BOT_INDICATORS.some(term => ua.includes(term))) {
            return true;
        }
        // Detect headless browsers
        if (this.HEADLESS_BROWSERS.some(browser => userAgent.includes(browser))) {
            return true;
        }
        // Missing user agent or suspiciously short
        if (userAgent.length < 20) {
            return true;
        }
        return false;
    }
    static analyze(userAgent) {
        const ua = userAgent.toLowerCase();
        for (const term of this.BOT_INDICATORS) {
            if (ua.includes(term)) {
                return { isBot: true, reason: `Matched bot indicator: ${term}` };
            }
        }
        for (const browser of this.HEADLESS_BROWSERS) {
            if (userAgent.includes(browser)) {
                return { isBot: true, reason: `Headless browser detected: ${browser}` };
            }
        }
        return { isBot: false };
    }
}
exports.UserAgentAnalyzer = UserAgentAnalyzer;
UserAgentAnalyzer.BOT_INDICATORS = [
    'bot', 'crawl', 'spider', 'slurp', 'search', 'fetch',
    'google', 'bing', 'yandex', 'duckduck', 'baidu'
];
UserAgentAnalyzer.HEADLESS_BROWSERS = [
    'PhantomJS', 'HeadlessChrome', 'Electron'
];
// Shopify-specific extension
function isShopifyBot(userAgent) {
    return userAgent.includes('Shopify') &&
        !userAgent.includes('Shopify POS') &&
        !userAgent.includes('Shopify Admin');
}
