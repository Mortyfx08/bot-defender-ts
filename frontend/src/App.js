import React, { useState, useEffect } from 'react';
import {
  AppProvider,
  Frame,
  TopBar,
  Navigation,
  Page,
  Card,
  Layout,
  Text,
  Avatar,
  Button,
  Badge,
  InlineStack,
  BlockStack,
  ProgressBar,
  ResourceList,
  ResourceItem,
  Toast,
  Modal,
  Banner,
} from '@shopify/polaris';
import { LockIcon, RefreshIcon, SearchIcon, HomeIcon } from '@shopify/polaris-icons';

import '@shopify/polaris/build/esm/styles.css';

function App() {
  // State
  const [protectionActive, setProtectionActive] = useState(true);
  const [threatLevel, setThreatLevel] = useState('Low');
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [traffic] = useState({ human: 80, bot: 20 });

  // Fetch stats and attempts on mount
  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(setStats);

    fetch('/api/recent-attempts')
      .then(res => res.json())
      .then(setRecentAttempts);
  }, []);

  // Handlers
  const handleToggleProtection = () => {
    setProtectionActive((v) => !v);
    setShowToast(true);
  };
  const handleScanNow = () => {
    fetch('/api/scan', { method: 'POST' })
      .then(res => res.json())
      .then(data => setShowToast(true));
  };
  const handleUpdateProtection = () => {
    fetch('/api/update-protection', { method: 'POST' })
      .then(res => res.json())
      .then(data => setShowToast(true));
  };
  const handleLockdown = () => {
    fetch('/api/lockdown', { method: 'POST' })
      .then(res => res.json())
      .then(data => setShowToast(true));
    setShowModal(false);
  };

  // TopBar and Navigation
  const topBarMarkup = (
    <TopBar
      userMenu={
        <TopBar.UserMenu
          name="Site Owner"
          detail="Account"
          initials="SO"
        />
      }
    />
  );

  const navigationMarkup = (
    <Navigation location="/">
      <Navigation.Section
        items={[
          {
            url: '/',
            label: 'Home',
            icon: HomeIcon,
            selected: true,
          },
        ]}
      />
    </Navigation>
  );

  return (
    <AppProvider>
      <Frame topBar={topBarMarkup} navigation={navigationMarkup}>
        <Page>
          {/* Banner */}
          <Banner title="Bot Defender" status="info">
            <p>Protect your store from malicious bots and threats in real time.</p>
          </Banner>

          {/* Quick Stats */}
          <Layout>
            <Layout.Section>
              <InlineStack gap="loose">
                <Card title="Bots Blocked Today" sectioned>
                  <Text variant="headingLg" as="h2">{stats.today}</Text>
                </Card>
                <Card title="This Week" sectioned>
                  <Text variant="headingLg" as="h2">{stats.week}</Text>
                </Card>
                <Card title="This Month" sectioned>
                  <Text variant="headingLg" as="h2">{stats.month}</Text>
                </Card>
              </InlineStack>
            </Layout.Section>
          </Layout>

          {/* Main Dashboard */}
          <Layout>
            <Layout.Section>
              <Card title="Real-time Protection Status" sectioned>
                <InlineStack align="center" gap="loose">
                  <BlockStack gap="extraTight">
                    <Text variant="bodyMd">Active Protection</Text>
                    <Button
                      primary={protectionActive}
                      destructive={!protectionActive}
                      onClick={handleToggleProtection}
                    >
                      {protectionActive ? 'ON' : 'OFF'}
                    </Button>
                  </BlockStack>
                  <BlockStack gap="extraTight">
                    <Text variant="bodyMd">Threat Level</Text>
                    <Badge status={threatLevel === 'High' ? 'critical' : threatLevel === 'Medium' ? 'warning' : 'success'}>
                      {threatLevel}
                    </Badge>
                  </BlockStack>
                </InlineStack>
              </Card>

              <Card title="Live Feed" sectioned>
                <ResourceList
                  resourceName={{ singular: 'attempt', plural: 'attempts' }}
                  items={recentAttempts}
                  renderItem={(item) => (
                    <ResourceItem id={item.id}>
                      <InlineStack gap="tight">
                        <Badge>{item.type}</Badge>
                        <Text variant="bodySm">{item.ip}</Text>
                        <Text variant="bodySm" color="subdued">{item.time}</Text>
                      </InlineStack>
                    </ResourceItem>
                  )}
                />
              </Card>

              {/* Quick Actions */}
              <Card title="Quick Actions" sectioned>
                <InlineStack gap="tight">
                  <Button icon={SearchIcon} onClick={handleScanNow}>Scan Now</Button>
                  <Button icon={RefreshIcon} onClick={handleUpdateProtection}>Update Protection</Button>
                  <Button icon={LockIcon} destructive onClick={() => setShowModal(true)}>Emergency Lockdown</Button>
                </InlineStack>
              </Card>
            </Layout.Section>

            {/* Protection Summary */}
            <Layout.Section>
              <Card title="Protection Summary" sectioned>
                <Text variant="bodyMd">Traffic Types</Text>
                <ProgressBar progress={traffic.human} color="success" />
                <Text variant="bodySm">Human: {traffic.human}% | Bot: {traffic.bot}%</Text>
                <br />
                <Text variant="bodyMd">Top Blocked Bot Types</Text>
                <ul>
                  <li>Scraper</li>
                  <li>Credential Stuffing</li>
                  <li>Spam Bot</li>
                </ul>
                <br />
                <Text variant="bodyMd">System Health</Text>
                <Badge status="success">All Systems Operational</Badge>
              </Card>
            </Layout.Section>
          </Layout>

          {/* Toast for feedback */}
          {showToast && (
            <Toast content="Action completed!" onDismiss={() => setShowToast(false)} />
          )}

          {/* Modal for Emergency Lockdown */}
          {showModal && (
            <Modal
              open={showModal}
              onClose={() => setShowModal(false)}
              title="Confirm Emergency Lockdown"
              primaryAction={{
                content: 'Confirm',
                destructive: true,
                onAction: handleLockdown,
              }}
              secondaryActions={[
                {
                  content: 'Cancel',
                  onAction: () => setShowModal(false),
                },
              ]}
            >
              <Modal.Section>
                <Text as="p">Are you sure you want to activate Emergency Lockdown? This will block all non-essential traffic.</Text>
              </Modal.Section>
            </Modal>
          )}
        </Page>
      </Frame>
    </AppProvider>
  );
}

export default App;