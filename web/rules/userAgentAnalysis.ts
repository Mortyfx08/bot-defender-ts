export class UserAgentAnalyzer {
  private static BOT_INDICATORS = [
    'bot', 'crawl', 'spider', 'slurp', 'search', 'fetch',
    'google', 'bing', 'yandex', 'duckduck', 'baidu'
  ];

  private static HEADLESS_BROWSERS = [
    'PhantomJS', 'HeadlessChrome', 'Electron'
  ];

  static analyze(userAgent: string): { isBot: boolean; reason?: string } {
    if (!userAgent) return { isBot: true, reason: 'No user agent' };

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