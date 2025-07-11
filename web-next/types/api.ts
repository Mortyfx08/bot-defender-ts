// Shared API response and error types for frontend and backend

export interface ApiError {
  error: string;
  details?: any;
}

export interface ApiSuccess<T = any> {
  status: 'success';
  message?: string;
  data?: T;
}

// Example: Dashboard metrics type
export interface DashboardMetrics {
  totalAlerts: number;
  totalBlockedIPs: number;
  recentBotActivities: number;
  threatFeedMetrics: {
    totalThreatFeedIPs: number;
    threatFeedBlocks: number;
    lastUpdate: string | null;
    threatFeedHighSeverity: number;
    threatFeedMediumSeverity: number;
    threatFeedLowSeverity: number;
  };
}

export interface DashboardData {
  metrics: DashboardMetrics;
  shop: {
    name: string;
    domain: string;
  };
  recentActivities?: any[];
  securityAlerts?: any[];
  blockedIPs?: any[];
  timestamp?: string;
} 