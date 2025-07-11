import React, { useEffect, useState } from 'react';
import { Page, Layout, Card, Text, TextContainer, Banner, SkeletonPage, SkeletonBodyText, EmptyState, InlineStack, BlockStack, Badge, Toast } from '@shopify/polaris';
import ThreatFeedMetrics from './ThreatFeedMetrics';
import ActivityLog from './ActivityLog';
import LiveBotActivity from './LiveBotActivity';
import StoreConfig, { StoreConfigType } from './StoreConfig';
import { useAppBridge } from '../providers/AppBridgeProvider';
import actions from '@shopify/app-bridge/actions';
import type { ApiError, ApiSuccess, DashboardData } from '../types/api';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showErrorBanner, setShowErrorBanner] = useState(true);
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
  const [toastActive, setToastActive] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const appBridge = useAppBridge();

  // Add App Bridge resize support
  React.useEffect(() => {
    if (appBridge) {
      const resize = actions.TitleBar.create(appBridge, { title: 'Bot Defender Dashboard' });
      actions.ContextualSaveBar.create(appBridge, {}); // Ensures correct resizing
    }
  }, [appBridge]);

  // Back to Shopify handler
  const handleBackToShopify = () => {
    if (appBridge) {
      actions.Redirect.create(appBridge).dispatch(actions.Redirect.Action.ADMIN_PATH, '/admin');
    } else {
      window.top?.location.replace('/admin');
    }
  };

  // Helper function to get shop from URL
  const getShopFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    let shop = urlParams.get('shop');
    if (!shop || shop === 'Unknown') {
      const hostname = window.location.hostname;
      if (hostname.includes('.myshopify.com')) {
        shop = hostname;
      } else {
        const storedShop = localStorage.getItem('shop');
        if (storedShop && storedShop !== 'Unknown') {
          shop = storedShop;
        }
      }
    }
    if (!shop || shop === 'Unknown') {
      const pathSegments = window.location.pathname.split('/');
      for (const segment of pathSegments) {
        if (segment.includes('.myshopify.com')) {
          shop = segment;
          break;
        }
      }
    }
    if (shop && shop !== 'Unknown') {
      localStorage.setItem('shop', shop);
    }
    return shop;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const shop = getShopFromURL();
        if (!shop) {
          setError('No shop parameter found. Please access this page through your Shopify admin.');
          setLoading(false);
          return;
        }
        if (!shop.endsWith('.myshopify.com')) {
          setError('Invalid shop domain format. Must end with .myshopify.com');
          setLoading(false);
          return;
        }
        const dashboardResponse = await fetch(`/api/dashboard?shop=${shop}`);
        if (!dashboardResponse.ok) {
          const err: ApiError = await dashboardResponse.json();
          throw new Error(err.error || 'Failed to fetch dashboard data');
        }
        const dashboardResult: ApiSuccess<DashboardData> = await dashboardResponse.json();
        setData(dashboardResult.data!);
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
  }, [storeConfig.refreshInterval]);

  const handleConfigUpdate = async (newConfig: StoreConfigType) => {
    try {
      const shop = getShopFromURL();
      if (!shop) {
        throw new Error('No shop parameter found');
      }
      const response = await fetch(`/api/store-config?shop=${shop}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig }),
      });
      if (!response.ok) {
        throw new Error('Failed to update store configuration');
      }
      setStoreConfig(newConfig);
      setToastMsg('Store configuration saved!');
      setToastActive(true);
    } catch (error) {
      setToastMsg('Error updating store configuration.');
      setToastActive(true);
      console.error('Error updating store configuration:', error);
    }
  };

  if (loading) {
    return (
      <div data-testid="dashboard-skeleton">
        <SkeletonPage primaryAction>
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack>
                  <SkeletonBodyText lines={4} />
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </SkeletonPage>
      </div>
    );
  }

  // Show a global error banner if error exists
  const errorBanner = error && showErrorBanner ? (
    <Banner title="Error" tone="critical" onDismiss={() => setShowErrorBanner(false)}>
      <p>{error}</p>
      <p>Please ensure you're accessing this page through your Shopify admin panel.</p>
      <p>If you're testing locally, you can use: http://localhost:3000/dashboard?shop=your-store.myshopify.com</p>
    </Banner>
  ) : null;

  if (!data) {
    return (
      <Page>
        {errorBanner}
        <Layout>
          <Layout.Section>
            <EmptyState
              heading="No bot activity yet"
              action={{content: 'Learn more', url: 'https://help.shopify.com'}} 
              image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
            >
              <p>Once your store receives traffic, bot activity will appear here.</p>
            </EmptyState>
          </Layout.Section>
        </Layout>
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
      <Page title={`Bot Defender - ${data.shop?.name || 'Unknown Store'}`} subtitle={storeConfig.customGreeting}>
        {errorBanner}
        <div style={{ marginBottom: 16 }}>
          <button onClick={handleBackToShopify} style={{ background: 'none', border: 'none', color: '#008060', cursor: 'pointer', fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            ← Back to Shopify
          </button>
        </div>
        <Layout>
          <Layout.Section>
            <div className={`dashboard-grid ${storeConfig.dashboardLayout}`} style={{ '--primary-color': storeConfig.primaryColor } as React.CSSProperties}>
              {/* Store Info */}
              <Card>
                <TextContainer>
                  <Text variant="headingMd" as="h2">Store Information</Text>
                  <Text as="p">Domain: {data.shop?.domain || 'Unknown'}</Text>
                  <Text as="p">Name: {data.shop?.name || 'Unknown'}</Text>
                </TextContainer>
              </Card>
              {/* Threat Feed Metrics Section */}
              {storeConfig && storeConfig.showMetrics?.threatFeed && (
                <Card>
                  <TextContainer>
                    <ThreatFeedMetrics metrics={data.metrics} />
                  </TextContainer>
                </Card>
              )}
              {/* Security Metrics Section - improved with Stack and Badge */}
              <Card>
                <TextContainer>
                  <Text variant="headingMd" as="h2">Security Metrics</Text>
                  <InlineStack gap="400" align="space-evenly">
                    {storeConfig.showMetrics.totalAlerts && (
                      <div className="metric-card">
                        <Text variant="headingLg" as="h3">{data.metrics?.totalAlerts ?? 0}</Text>
                        <Badge tone="critical">Total Alerts</Badge>
                      </div>
                    )}
                    {storeConfig.showMetrics.blockedIPs && (
                      <div className="metric-card">
                        <Text variant="headingLg" as="h3">{data.metrics?.totalBlockedIPs ?? 0}</Text>
                        <Badge tone="info">Blocked IPs</Badge>
                      </div>
                    )}
                    {storeConfig.showMetrics.botActivities && (
                      <div className="metric-card">
                        <Text variant="headingLg" as="h3">{data.metrics?.recentBotActivities ?? 0}</Text>
                        <Badge tone="warning">Recent Bot Activities</Badge>
                      </div>
                    )}
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued" alignment="end">
                    Last updated: {formatDate(data.metrics?.threatFeedMetrics?.lastUpdate)}
                  </Text>
                </TextContainer>
              </Card>
              {/* Live Bot Activity Section */}
              {storeConfig.showMetrics.botActivities && (
                <Card>
                  <LiveBotActivity shop={data.shop?.domain || 'Unknown'} />
                </Card>
              )}
              {/* Activity Log Section */}
              <Card>
                <ActivityLog shop={data.shop?.domain || 'Unknown'} />
              </Card>
            </div>
          </Layout.Section>
        </Layout>
      </Page>
      {toastActive && (
        <Toast content={toastMsg} onDismiss={() => setToastActive(false)} />
      )}
    </>
  );
};

export default Dashboard; 