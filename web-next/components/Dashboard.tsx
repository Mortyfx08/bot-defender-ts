'use client';

import React, { useEffect, useState } from 'react';
import { Page, Layout, Card, Text, Banner, SkeletonPage, SkeletonBodyText, EmptyState, InlineStack, BlockStack, Badge, Toast } from '@shopify/polaris';
import { Button, Tooltip, ProgressBar, Divider } from '@shopify/polaris';
import { RefreshIcon } from '@shopify/polaris-icons';
import ActivityLog from './ActivityLog';
import LiveBotActivity from './LiveBotActivity';
import { StoreConfigType } from './StoreConfig';
import { useAppBridge } from '../providers/AppBridgeProvider';
import { TitleBar, ContextualSaveBar } from '@shopify/app-bridge/actions';
import type { ApiError, ApiSuccess, DashboardData } from '../types/api';

function ClientDate({ date, timeZone }: { date: string | null, timeZone?: string }) {
  const [formatted, setFormatted] = React.useState('Never');
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  React.useEffect(() => {
    if (date && mounted) {
      setFormatted(new Date(date).toLocaleString(undefined, timeZone ? { timeZone } : undefined));
    }
  }, [date, timeZone, mounted]);
  
  // Return consistent value during SSR and initial client render
  if (!mounted) {
    return <>{date ? 'Loading...' : 'Never'}</>;
  }
  
  return <>{formatted}</>;
}

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
    timezone: 'UTC', // set default to UTC for SSR
    dateFormat: 'MM/DD/YYYY',
  });
  const [toastActive, setToastActive] = useState(false);
  const appBridge = useAppBridge();

  // Add App Bridge resize support
  React.useEffect(() => {
    if (appBridge) {
      TitleBar.create(appBridge, { title: 'Bot Defender Dashboard' });
      ContextualSaveBar.create(appBridge, {}); // Ensures correct resizing
    }
  }, [appBridge]);

  // Set timezone to client value after mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setStoreConfig(prev => ({ ...prev, timezone: tz }));
    }
  }, []);

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

  // Add a refetch trigger
  const [refreshIndex, setRefreshIndex] = useState(0);

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
  }, [storeConfig.refreshInterval, refreshIndex]);



  // Add a manual refresh button that triggers a refetch
  const handleManualRefresh = () => {
    setLoading(true);
    setRefreshIndex(i => i + 1);
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
      <p>Please ensure you&apos;re accessing this page through your Shopify admin panel.</p>
      <p>If you&apos;re testing locally, you can use: http://localhost:3000/dashboard?shop=your-store.myshopify.com</p>
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
    return <ClientDate date={date} timeZone={storeConfig.timezone} />;
  };

  // For ProgressBar, use a max value (e.g., 100 or a realistic max)
  const maxValue = 100;

  return (
    <>
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="heading2xl" as="h1" tone="success">
                  👋 Welcome, {data.shop?.name || 'Shopify User'}!
                </Text>
                <Text as="p" tone="subdued">
                  Here&apos;s your real-time bot defense dashboard for <b>{data.shop?.domain || 'Unknown'}</b>.
                </Text>
                <InlineStack align="center" gap="200">
                  <Tooltip content="Refresh dashboard data">
                    <Button icon={RefreshIcon} onClick={handleManualRefresh} variant="tertiary" accessibilityLabel="Refresh" />
                  </Tooltip>
                  <Text as="span" tone="subdued">
                    Last updated: {formatDate(data.metrics?.threatFeedMetrics?.lastUpdate)}
                  </Text>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingLg" as="h2">Threat Feed Metrics</Text>
                <Divider/>
                <InlineStack gap="800" align="start">
                  <BlockStack gap="200">
                    <Tooltip content="Total IPs in threat feed">
                      <Text variant="headingMd" as="h3">{data.metrics?.threatFeedMetrics.totalThreatFeedIPs ?? 0}</Text>
                    </Tooltip>
                    <Text as="p" tone="subdued">Total Threat Feed IPs</Text>
                    <ProgressBar progress={Math.min((data.metrics?.threatFeedMetrics.totalThreatFeedIPs ?? 0) / maxValue * 100, 100)} size="small" />
                  </BlockStack>
                  <BlockStack gap="200">
                    <Tooltip content="Number of blocks from threat feed">
                      <Text variant="headingMd" as="h3">{data.metrics?.threatFeedMetrics.threatFeedBlocks ?? 0}</Text>
                    </Tooltip>
                    <Text as="p" tone="subdued">Threat Feed Blocks</Text>
                    <ProgressBar progress={Math.min((data.metrics?.threatFeedMetrics.threatFeedBlocks ?? 0) / maxValue * 100, 100)} size="small" tone="critical" />
                  </BlockStack>
                  <BlockStack gap="200">
                    <Tooltip content="Last time threat feed was updated">
                      <Text variant="headingMd" as="h3"><ClientDate date={data.metrics?.threatFeedMetrics.lastUpdate} timeZone={storeConfig.timezone} /></Text>
                    </Tooltip>
                    <Text as="p" tone="subdued">Last Update</Text>
                  </BlockStack>
                </InlineStack>
                <Divider/>
                <InlineStack gap="800" align="start">
                  <BlockStack gap="200">
                    <Tooltip content="High severity threats">
                      <Badge tone="critical">{`High: ${data.metrics?.threatFeedMetrics.threatFeedHighSeverity ?? 0}`}</Badge>
                    </Tooltip>
                  </BlockStack>
                  <BlockStack gap="200">
                    <Tooltip content="Medium severity threats">
                      <Badge tone="warning">{`Medium: ${data.metrics?.threatFeedMetrics.threatFeedMediumSeverity ?? 0}`}</Badge>
                    </Tooltip>
                  </BlockStack>
                  <BlockStack gap="200">
                    <Tooltip content="Low severity threats">
                      <Badge tone="info">{`Low: ${data.metrics?.threatFeedMetrics.threatFeedLowSeverity ?? 0}`}</Badge>
                    </Tooltip>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingLg" as="h2">Security Metrics</Text>
                <Divider/>
                <InlineStack gap="800" align="start">
                  <BlockStack gap="200">
                    <Tooltip content="Total alerts triggered">
                      <Text variant="headingMd" as="h3">{data.metrics?.totalAlerts ?? 0}</Text>
                    </Tooltip>
                    <Text as="p" tone="subdued">Total Alerts</Text>
                    <ProgressBar progress={Math.min((data.metrics?.totalAlerts ?? 0) / maxValue * 100, 100)} size="small" tone="critical" />
                  </BlockStack>
                  <BlockStack gap="200">
                    <Tooltip content="Total blocked IPs">
                      <Text variant="headingMd" as="h3">{data.metrics?.totalBlockedIPs ?? 0}</Text>
                    </Tooltip>
                    <Text as="p" tone="subdued">Blocked IPs</Text>
                    <ProgressBar progress={Math.min((data.metrics?.totalBlockedIPs ?? 0) / maxValue * 100, 100)} size="small" />
                  </BlockStack>
                  <BlockStack gap="200">
                    <Tooltip content="Recent bot activities">
                      <Text variant="headingMd" as="h3">{data.metrics?.recentBotActivities ?? 0}</Text>
                    </Tooltip>
                    <Text as="p" tone="subdued">Recent Bot Activities</Text>
                    <ProgressBar progress={Math.min((data.metrics?.recentBotActivities ?? 0) / maxValue * 100, 100)} size="small" />
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingLg" as="h2">Live Bot Activity</Text>
                <Divider/>
                <LiveBotActivity shop={data.shop?.domain || 'Unknown'} />
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingLg" as="h2">Activity Log</Text>
                <Divider/>
                <ActivityLog shop={data.shop?.domain || 'Unknown'} />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
      {toastActive && (
        <Toast content="" onDismiss={() => setToastActive(false)} />
      )}
    </>
  );
};

export default Dashboard; 