import React, { useState } from 'react';
import {
  TopBar,
  Text,
  Button,
  Modal,
  FormLayout,
  TextField,
  Select,
  Banner,
  ActionList,
  ColorPicker,
  RangeSlider,
  Tabs,
  Card,
  SettingToggle,
} from '@shopify/polaris';

interface StoreConfigProps {
  shop: {
    name: string;
    domain: string;
  };
  onConfigUpdate: (config: StoreConfig) => void;
}

export interface StoreConfig {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  autoBlock: boolean;
  blockThreshold: number;
  customDomain?: string;
  dashboardLayout: 'compact' | 'detailed' | 'custom';
  primaryColor: string;
  refreshInterval: number;
  showMetrics: {
    totalAlerts: boolean;
    blockedIPs: boolean;
    botActivities: boolean;
    threatFeed: boolean;
  };
  customGreeting?: string;
  timezone: string;
  dateFormat: string;
}

export const StoreConfig: React.FC<StoreConfigProps> = ({ shop, onConfigUpdate }) => {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState<StoreConfig>({
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

  const handleConfigChange = (key: keyof StoreConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigUpdate(newConfig);
  };

  const handleMetricsChange = (metric: keyof StoreConfig['showMetrics'], value: boolean) => {
    const newMetrics = { ...config.showMetrics, [metric]: value };
    handleConfigChange('showMetrics', newMetrics);
  };

  const userMenuMarkup = (
    <ActionList
      items={[
        {
          content: 'Store Settings',
          onAction: () => setIsConfigModalOpen(true),
        },
        {
          content: 'View Store',
          url: `https://${shop.domain}`,
          external: true,
        },
      ]}
    />
  );

  const tabs = [
    {
      id: 'general',
      content: 'General',
      accessibilityLabel: 'General settings',
      panelID: 'general-settings',
    },
    {
      id: 'appearance',
      content: 'Appearance',
      accessibilityLabel: 'Appearance settings',
      panelID: 'appearance-settings',
    },
    {
      id: 'metrics',
      content: 'Metrics',
      accessibilityLabel: 'Metrics settings',
      panelID: 'metrics-settings',
    },
  ];

  return (
    <>
      <TopBar
        userMenu={userMenuMarkup}
        showNavigationToggle
      />
      
      <Modal
        open={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Store Configuration"
        primaryAction={{
          content: 'Save',
          onAction: () => setIsConfigModalOpen(false),
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setIsConfigModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <Tabs tabs={tabs} selected={activeTab} onSelect={setActiveTab}>
            <div className="config-tabs-content">
              {activeTab === 0 && (
                <FormLayout>
                  <Select
                    label="Theme"
                    options={[
                      { label: 'System Default', value: 'system' },
                      { label: 'Light', value: 'light' },
                      { label: 'Dark', value: 'dark' },
                    ]}
                    value={config.theme}
                    onChange={(value) => handleConfigChange('theme', value)}
                  />
                  
                  <TextField
                    label="Custom Domain"
                    value={config.customDomain || ''}
                    onChange={(value) => handleConfigChange('customDomain', value)}
                    placeholder="e.g., shop.yourdomain.com"
                    autoComplete="off"
                  />

                  <Select
                    label="Auto-Block Threshold"
                    options={[
                      { label: '3 Attempts', value: '3' },
                      { label: '5 Attempts', value: '5' },
                      { label: '10 Attempts', value: '10' },
                    ]}
                    value={String(config.blockThreshold)}
                    onChange={(value) => handleConfigChange('blockThreshold', Number(value))}
                  />

                  <TextField
                    label="Custom Greeting"
                    value={config.customGreeting || ''}
                    onChange={(value) => handleConfigChange('customGreeting', value)}
                    placeholder="Welcome to your dashboard!"
                    autoComplete="off"
                  />

                  <Select
                    label="Timezone"
                    options={Intl.supportedValuesOf('timeZone').map(tz => ({
                      label: tz,
                      value: tz,
                    }))}
                    value={config.timezone}
                    onChange={(value) => handleConfigChange('timezone', value)}
                  />

                  <Select
                    label="Date Format"
                    options={[
                      { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
                      { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
                      { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
                    ]}
                    value={config.dateFormat}
                    onChange={(value) => handleConfigChange('dateFormat', value)}
                  />
                </FormLayout>
              )}

              {activeTab === 1 && (
                <FormLayout>
                  <Select
                    label="Dashboard Layout"
                    options={[
                      { label: 'Compact', value: 'compact' },
                      { label: 'Detailed', value: 'detailed' },
                      { label: 'Custom', value: 'custom' },
                    ]}
                    value={config.dashboardLayout}
                    onChange={(value) => handleConfigChange('dashboardLayout', value)}
                  />

                  <div className="color-picker-wrapper">
                    <Text as="p" variant="bodyMd">Primary Color</Text>
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                    />
                  </div>

                  <RangeSlider
                    label="Refresh Interval (seconds)"
                    value={config.refreshInterval}
                    min={10}
                    max={60}
                    step={5}
                    onChange={(value) => handleConfigChange('refreshInterval', value)}
                    output
                  />
                </FormLayout>
              )}

              {activeTab === 2 && (
                <FormLayout>
                  <SettingToggle
                    action={{
                      content: config.showMetrics.totalAlerts ? 'Hide' : 'Show',
                      onAction: () => handleMetricsChange('totalAlerts', !config.showMetrics.totalAlerts),
                    }}
                    enabled={config.showMetrics.totalAlerts}
                  >
                    Show Total Alerts
                  </SettingToggle>

                  <SettingToggle
                    action={{
                      content: config.showMetrics.blockedIPs ? 'Hide' : 'Show',
                      onAction: () => handleMetricsChange('blockedIPs', !config.showMetrics.blockedIPs),
                    }}
                    enabled={config.showMetrics.blockedIPs}
                  >
                    Show Blocked IPs
                  </SettingToggle>

                  <SettingToggle
                    action={{
                      content: config.showMetrics.botActivities ? 'Hide' : 'Show',
                      onAction: () => handleMetricsChange('botActivities', !config.showMetrics.botActivities),
                    }}
                    enabled={config.showMetrics.botActivities}
                  >
                    Show Bot Activities
                  </SettingToggle>

                  <SettingToggle
                    action={{
                      content: config.showMetrics.threatFeed ? 'Hide' : 'Show',
                      onAction: () => handleMetricsChange('threatFeed', !config.showMetrics.threatFeed),
                    }}
                    enabled={config.showMetrics.threatFeed}
                  >
                    Show Threat Feed
                  </SettingToggle>
                </FormLayout>
              )}
            </div>
          </Tabs>

          <Banner
            title="Store Information"
            status="info"
          >
            <p>Store Name: {shop.name}</p>
            <p>Domain: {shop.domain}</p>
          </Banner>
        </Modal.Section>
      </Modal>
    </>
  );
}; 