"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
const defaultRules = {
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
class RateLimiter {
    static async check(ruleKey, identifier) {
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
        const limit = this.limits.get(limitKey);
        limit.count++;
        // Enforce rule
        if (limit.count > rule.requests) {
            return false;
        }
        return true;
    }
}
exports.RateLimiter = RateLimiter;
RateLimiter.limits = new Map();
// Usage Example:
// await RateLimiter.check('CHECKOUT_ATTEMPTS', 'user-ip-or-id');
