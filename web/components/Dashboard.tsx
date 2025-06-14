import React, { useState, useEffect } from 'react';
import { Page, Card, Text, Banner, Spinner, TextContainer, Layout } from '@shopify/polaris';
import { ThreatFeedMetrics } from './ThreatFeedMetrics';
import './DashboardPage.css';

interface SecurityAlert {
  _id: string;
  type: string;
  severity: string;
  message: string;
  details: {
    ip: string;
    userAgent: string;
    path: string;
  };
  timestamp: string;
  resolved: boolean;
}

interface BotActivity {
  _id: string;
  ip: string;
  userAgent: string;
  path: string;
  severity: string;
  timestamp: string;
  metadata: {
    headers: any;
    reason: string;
  };
}

interface BlockedIP {
  _id: string;
  ip: string;
  reason: string;
  blockedAt: string;
  expiresAt: string;
  metadata: {
    userAgent: string;
    path: string;
    headers: any;
  };
}

interface DashboardData {
  metrics: {
    totalAlerts: number;
    totalBlockedIPs: number;
    recentBotActivities: number;
    highSeverityAlerts: number;
    mediumSeverityAlerts: number;
    lowSeverityAlerts: number;
    threatFeedMetrics: {
      totalThreatFeedIPs: number;
      threatFeedBlocks: number;
      lastUpdate: string | null;
      threatFeedHighSeverity: number;
      threatFeedMediumSeverity: number;
      threatFeedLowSeverity: number;
    };
  };
  botStats: any;
  recentActivities: any[];
  securityAlerts: any[];
  blockedIPs: {
    mongo: any[];
    redis: any[];
  };
  threatFeedData: {
    totalIPs: number;
    lastUpdate: string | null;
    recentBlocks: any[];
    updateStats: any;
  };
  timestamp: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Page title="Bot Defender">
        <Banner status="critical">
          <p>Error loading dashboard: {error}</p>
        </Banner>
      </Page>
    );
  }

  if (!data) {
    return (
      <Page title="Bot Defender">
        <Card>
          <TextContainer>
            <Text variant="headingMd" as="h2">No Data Available</Text>
            <Text as="p">There is no bot activity data available for your store yet.</Text>
          </TextContainer>
        </Card>
      </Page>
    );
  }

  return (
    <Page title="Bot Defender">
      <Layout>
        <Layout.Section>
          <div className="dashboard-grid">
            {/* Threat Feed Metrics Section */}
            <Card>
              <TextContainer>
                <ThreatFeedMetrics
                  metrics={data.metrics.threatFeedMetrics}
                  threatFeedData={data.threatFeedData}
                />
              </TextContainer>
            </Card>

            {/* Security Metrics Section */}
            <Card>
              <TextContainer>
                <Text variant="headingMd" as="h2">Security Metrics</Text>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <Text variant="headingLg" as="h3">{data.metrics.totalAlerts}</Text>
                    <Text as="p">Total Alerts</Text>
                  </div>
                  <div className="metric-card">
                    <Text variant="headingLg" as="h3">{data.metrics.totalBlockedIPs}</Text>
                    <Text as="p">Blocked IPs</Text>
                  </div>
                  <div className="metric-card">
                    <Text variant="headingLg" as="h3">{data.metrics.recentBotActivities}</Text>
                    <Text as="p">Recent Bot Activities</Text>
                  </div>
                </div>
              </TextContainer>
            </Card>

            {/* Severity Breakdown Section */}
            <Card>
              <TextContainer>
                <Text variant="headingMd" as="h2">Alert Severity</Text>
                <div className="metrics-grid">
                  <div className="metric-card severity-high">
                    <Text variant="headingLg" as="h3">{data.metrics.highSeverityAlerts}</Text>
                    <Text as="p">High Severity</Text>
                  </div>
                  <div className="metric-card severity-medium">
                    <Text variant="headingLg" as="h3">{data.metrics.mediumSeverityAlerts}</Text>
                    <Text as="p">Medium Severity</Text>
                  </div>
                  <div className="metric-card severity-low">
                    <Text variant="headingLg" as="h3">{data.metrics.lowSeverityAlerts}</Text>
                    <Text as="p">Low Severity</Text>
                  </div>
                </div>
              </TextContainer>
            </Card>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
