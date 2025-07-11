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
  Toast,
} from '@shopify/polaris';

interface StoreConfigProps {
  shop: {
    name: string;
    domain: string;
  };
  onConfigUpdate: (config: StoreConfigType) => void;
}

export type StoreConfigType = {
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
};

const StoreConfig: React.FC<StoreConfigProps> = ({ shop, onConfigUpdate }) => {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState<StoreConfigType>({
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
  const [errors, setErrors] = useState<{ customDomain?: string; blockThreshold?: string }>({});

  const handleConfigChange = (key: keyof StoreConfigType, value: any) => {
    let newErrors = { ...errors };
    if (key === 'customDomain') {
      if (value && !/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(value)) {
        newErrors.customDomain = 'Invalid domain format.';
      } else {
        delete newErrors.customDomain;
      }
    }
    if (key === 'blockThreshold') {
      if (value < 1 || value > 100) {
        newErrors.blockThreshold = 'Threshold must be between 1 and 100.';
      } else {
        delete newErrors.blockThreshold;
      }
    }
    setErrors(newErrors);
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigUpdate(newConfig);
    setToastMsg('Configuration updated');
    setToastActive(true);
  };

  const handleMetricsChange = (metric: keyof StoreConfigType['showMetrics'], value: boolean) => {
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
          url: `https://${shop?.domain || 'unknown'}`,
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

  const timeZones = [
    'UTC',
    'Europe/Paris',
    'America/New_York',
    'Asia/Tokyo',
    // ...add as needed
  ];

  if (!shop) {
    return <Text as="p">Loading store info...</Text>;
  }

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
                  <SettingToggle
                    action={{
                      content: config.notifications ? 'Disable' : 'Enable',
                      onAction: () => handleConfigChange('notifications', !config.notifications),
                    }}
                    enabled={config.notifications}
                  >
                    Notifications are {config.notifications ? 'enabled' : 'disabled'}.
                  </SettingToggle>
                  <SettingToggle
                    action={{
                      content: config.autoBlock ? 'Disable' : 'Enable',
                      onAction: () => handleConfigChange('autoBlock', !config.autoBlock),
                    }}
                    enabled={config.autoBlock}
                  >
                    Auto-block is {config.autoBlock ? 'enabled' : 'disabled'}.
                  </SettingToggle>
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
                    error={errors.customDomain}
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
                    error={errors.blockThreshold}
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
                    options={timeZones.map((tz: string) => ({
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
                  <SettingToggle
                    action={{
                      content: config.notifications ? 'Disable Notifications' : 'Enable Notifications',
                      onAction: () => handleConfigChange('notifications', !config.notifications),
                    }}
                    enabled={config.notifications}
                  >
                    <Text as="p">
                      Receive notifications for new alerts and important system updates.
                    </Text>
                  </SettingToggle>

                  <SettingToggle
                    action={{
                      content: config.autoBlock ? 'Disable Auto-Block' : 'Enable Auto-Block',
                      onAction: () => handleConfigChange('autoBlock', !config.autoBlock),
                    }}
                    enabled={config.autoBlock}
                  >
                    <Text as="p">
                      Automatically block suspicious IP addresses after exceeding the threshold.
                    </Text>
                  </SettingToggle>

                  <Select
                    label="Primary Color"
                    options={[
                      { label: 'Green', value: '#008060' },
                      { label: 'Blue', value: '#0076CE' },
                      { label: 'Purple', value: '#635BFF' },
                      { label: 'Red', value: '#FF4444' },
                      { label: 'Orange', value: '#FF8800' },
                    ]}
                    value={config.primaryColor}
                    onChange={(value) => handleConfigChange('primaryColor', value)}
                  />

                  <RangeSlider
                    label="Refresh Interval"
                    output
                    min={10}
                    max={300}
                    value={config.refreshInterval}
                    onChange={(value) => handleConfigChange('refreshInterval', value)}
                  />
                </FormLayout>
              )}
              {activeTab === 2 && (
                <FormLayout>
                  <SettingToggle
                    action={{
                      content: config.showMetrics.totalAlerts ? 'Hide Total Alerts' : 'Show Total Alerts',
                      onAction: () => handleMetricsChange('totalAlerts', !config.showMetrics.totalAlerts),
                    }}
                    enabled={config.showMetrics.totalAlerts}
                  >
                    <Text as="p">
                      Display total number of alerts in the dashboard.
                    </Text>
                  </SettingToggle>

                  <SettingToggle
                    action={{
                      content: config.showMetrics.blockedIPs ? 'Hide Blocked IPs' : 'Show Blocked IPs',
                      onAction: () => handleMetricsChange('blockedIPs', !config.showMetrics.blockedIPs),
                    }}
                    enabled={config.showMetrics.blockedIPs}
                  >
                    <Text as="p">
                      Display a list of blocked IP addresses.
                    </Text>
                  </SettingToggle>

                  <SettingToggle
                    action={{
                      content: config.showMetrics.botActivities ? 'Hide Bot Activities' : 'Show Bot Activities',
                      onAction: () => handleMetricsChange('botActivities', !config.showMetrics.botActivities),
                    }}
                    enabled={config.showMetrics.botActivities}
                  >
                    <Text as="p">
                      Display bot activity metrics.
                    </Text>
                  </SettingToggle>

                  <SettingToggle
                    action={{
                      content: config.showMetrics.threatFeed ? 'Hide Threat Feed' : 'Show Threat Feed',
                      onAction: () => handleMetricsChange('threatFeed', !config.showMetrics.threatFeed),
                    }}
                    enabled={config.showMetrics.threatFeed}
                  >
                    <Text as="p">
                      Display the latest threat feed updates.
                    </Text>
                  </SettingToggle>
                </FormLayout>
              )}
            </div>
          </Tabs>
        </Modal.Section>
      </Modal>
      {toastActive && (
        <Toast content={toastMsg} onDismiss={() => setToastActive(false)} />
      )}
    </>
  );
};

export default StoreConfig; 