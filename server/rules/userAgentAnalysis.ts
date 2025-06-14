export class UserAgentAnalyzer {
  private static BOT_INDICATORS = [
    'bot', 'crawl', 'spider', 'slurp', 'search', 'fetch',
    'google', 'bing', 'yandex', 'duckduck', 'baidu'
  ];

  private static HEADLESS_BROWSERS = [
    'PhantomJS', 'HeadlessChrome', 'Electron'
  ];

  static isBot(userAgent: string): boolean {
    if (!userAgent) return true;

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

  static analyze(userAgent: string): { isBot: boolean, reason?: string } {
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

// Shopify-specific extension
export function isShopifyBot(userAgent: string): boolean {
  return userAgent.includes('Shopify') && 
    !userAgent.includes('Shopify POS') && 
    !userAgent.includes('Shopify Admin');
}