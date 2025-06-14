import React, { useEffect, useState } from 'react';
import { Page, Layout, Card, Text, TextContainer, Banner } from '@shopify/polaris';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThreatFeedMetrics } from './ThreatFeedMetrics';
import { ActivityLog } from './ActivityLog';
import { LiveBotActivity } from './LiveBotActivity';
import { StoreConfig, StoreConfig as StoreConfigType } from './StoreConfig';

interface DashboardData {
  metrics: {
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
  };
  threatFeedData: {
    totalIPs: number;
    lastUpdate: string | null;
    recentBlocks: any[];
    updateStats: any;
  };
  shop: {
    name: string;
    domain: string;
  };
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfigType>({
    theme: 'system',
    notifications: true,
    autoBlock: true,
    blockThreshold: 5,
    dashboardLayout: 'detailed',
    primaryColor: '#008060',
    refreshInterval: 30,
    showMetrics: {
      totalAlerts: true,
      blockedIPs: true,
      botActivities: true,
      threatFeed: true,
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get shop from URL parameters
        const urlParams = new URLSearchParams(location.search);
        const shop = urlParams.get('shop');

        if (!shop) {
          // If no shop parameter, try to get it from the hostname
          const hostname = window.location.hostname;
          if (hostname.includes('.myshopify.com')) {
            // If we're on a Shopify domain, use it
            const shopDomain = hostname;
            navigate(`/dashboard?shop=${shopDomain}`);
            return;
          } else {
            setError('No shop parameter found. Please access this page through your Shopify admin.');
            setLoading(false);
            return;
          }
        }

        // Validate shop domain format
        if (!shop.endsWith('.myshopify.com')) {
          setError('Invalid shop domain format. Must end with .myshopify.com');
          setLoading(false);
          return;
        }

        // Fetch dashboard data
        const dashboardResponse = await fetch(`/api/dashboard?shop=${shop}`);
        if (!dashboardResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const dashboardResult = await dashboardResponse.json();
        setData(dashboardResult.data);

        // Fetch store configuration
        const configResponse = await fetch(`/api/store-config?shop=${shop}`);
        if (configResponse.ok) {
          const configResult = await configResponse.json();
          setStoreConfig(configResult.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, storeConfig.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [location.search, storeConfig.refreshInterval, navigate]);

  const handleConfigUpdate = async (newConfig: StoreConfigType) => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop');

      if (!shop) {
        throw new Error('No shop parameter found');
      }

      const response = await fetch('/api/store-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop, config: newConfig }),
      });

      if (!response.ok) {
        throw new Error('Failed to update store configuration');
      }

      setStoreConfig(newConfig);
    } catch (error) {
      console.error('Error updating store configuration:', error);
    }
  };

  if (loading) {
    return (
      <Page>
        <Text as="p">Loading dashboard data...</Text>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <Banner
          title="Error"
          status="critical"
        >
          <p>{error}</p>
          <p>Please ensure you're accessing this page through your Shopify admin panel.</p>
          <p>If you're testing locally, you can use: http://localhost:3000/dashboard?shop=your-store.myshopify.com</p>
        </Banner>
      </Page>
    );
  }

  if (!data) {
    return (
      <Page>
        <Text as="p">No data available</Text>
      </Page>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString(undefined, {
      timeZone: storeConfig.timezone,
    });
  };

  return (
    <>
      <StoreConfig shop={data.shop} onConfigUpdate={handleConfigUpdate} />
      <Page 
        title={`Bot Defender - ${data.shop.name}`}
        subtitle={storeConfig.customGreeting}
      >
        <Layout>
          <Layout.Section>
            <div 
              className={`dashboard-grid ${storeConfig.dashboardLayout}`}
              style={{ '--primary-color': storeConfig.primaryColor } as React.CSSProperties}
            >
              {/* Store Info */}
              <Card>
                <TextContainer>
                  <Text variant="headingMd" as="h2">Store Information</Text>
                  <Text as="p">Domain: {data.shop.domain}</Text>
                  <Text as="p">Name: {data.shop.name}</Text>
                </TextContainer>
              </Card>

              {/* Threat Feed Metrics Section */}
              {storeConfig.showMetrics.threatFeed && (
                <Card>
                  <TextContainer>
                    <ThreatFeedMetrics
                      metrics={data.metrics.threatFeedMetrics}
                      threatFeedData={data.threatFeedData}
                    />
                  </TextContainer>
                </Card>
              )}

              {/* Security Metrics Section */}
              <Card>
                <TextContainer>
                  <Text variant="headingMd" as="h2">Security Metrics</Text>
                  <div className="metrics-grid">
                    {storeConfig.showMetrics.totalAlerts && (
                      <div className="metric-card">
                        <Text variant="headingLg" as="h3">{data.metrics.totalAlerts}</Text>
                        <Text as="p">Total Alerts</Text>
                      </div>
                    )}
                    {storeConfig.showMetrics.blockedIPs && (
                      <div className="metric-card">
                        <Text variant="headingLg" as="h3">{data.metrics.totalBlockedIPs}</Text>
                        <Text as="p">Blocked IPs</Text>
                      </div>
                    )}
                    {storeConfig.showMetrics.botActivities && (
                      <div className="metric-card">
                        <Text variant="headingLg" as="h3">{data.metrics.recentBotActivities}</Text>
                        <Text as="p">Recent Bot Activities</Text>
                      </div>
                    )}
                  </div>
                </TextContainer>
              </Card>

              {/* Live Bot Activity Section */}
              {storeConfig.showMetrics.botActivities && (
                <Card>
                  <LiveBotActivity shop={data.shop.domain} />
                </Card>
              )}

              {/* Activity Log Section */}
              <Card>
                <ActivityLog shop={data.shop.domain} />
              </Card>
            </div>
          </Layout.Section>
        </Layout>
      </Page>
    </>
  );
}; 