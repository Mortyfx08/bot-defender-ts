interface RateLimitRule {
  requests: number;
  interval: number; // milliseconds
  action: 'block' | 'throttle' | 'notify';
}

const defaultRules: Record<string, RateLimitRule> = {
  API_CALLS: {
    requests: 100,
    interval: 60000,
    action: 'throttle'
  },
  CHECKOUT_ATTEMPTS: {
    requests: 5,
    interval: 30000,
    action: 'block'
  }
};

export class RateLimiter {
  private static limits = new Map<string, { count: number, timer: NodeJS.Timeout }>();

  static async check(ruleKey: string, identifier: string): Promise<boolean> {
    const rule = defaultRules[ruleKey] || defaultRules.API_CALLS;
    const limitKey = `${ruleKey}:${identifier}`;

    // Get or initialize counter
    if (!this.limits.has(limitKey)) {
      this.limits.set(limitKey, {
        count: 1,
        timer: setTimeout(() => this.limits.delete(limitKey), rule.interval)
      });
      return true;
    }

    const limit = this.limits.get(limitKey)!;
    limit.count++;

    // Enforce rule
    if (limit.count > rule.requests) {
      return false;
    }

    return true;
  }
}

// Usage Example:
// await RateLimiter.check('CHECKOUT_ATTEMPTS', 'user-ip-or-id');