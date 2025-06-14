export interface BlockedAttempt {
  ip: string;
  userAgent: string;
  path: string;
  timestamp: Date;
  reason: string;
  headers: Record<string, string>;
}

export interface RateLimitViolation {
  ip: string;
  userAgent: string;
  path: string;
  timestamp: Date;
  limitType: string;
  headers: Record<string, string>;
}

export interface BotActivityLog {
  ip: string;
  userAgent: string;
  path: string;
  timestamp: Date;
  additionalData: {
    headers?: Record<string, string>;
    rawData?: any;
  };
} 