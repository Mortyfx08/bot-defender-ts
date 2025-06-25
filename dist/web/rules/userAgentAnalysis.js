"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAgentAnalyzer = void 0;
class UserAgentAnalyzer {
    static analyze(userAgent) {
        if (!userAgent)
            return { isBot: true, reason: 'No user agent' };
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
