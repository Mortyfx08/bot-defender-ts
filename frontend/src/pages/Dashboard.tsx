// src/pages/Dashboard.js
import React, { useState } from 'react';
import {
  Page,
  Layout,
  Card,
  DataTable,
  Badge,
  Button,
  ChoiceList,
  Banner,
  ProgressBar,
  Stack,
  DisplayText
} from '@shopify/polaris';
import {
  HomeMajor,
  SettingsMajor,
  LogOutMinor,
  RefreshMajor
} from '@shopify/polaris-icons';

function Dashboard() {
  // State for bot statistics
  const [stats, setStats] = useState({
    blockedToday: 42,
    blockedWeek: 287,
    threatLevel: 'medium' as 'low' | 'medium' | 'high',
    topBots: [
      ['Scrapers', 32],
      ['Credential Stuffers', 18],
      ['Spam Bots', 12]
    ]
  });

  // Defense controls
  const [defenses, setDefenses] = useState({
    protectionLevel: 'auto',
    blockSuspicious: true,
    rateLimiting: true
  });

  return (
    <Page
      title="Bot Defender Dashboard"
      primaryAction={{ content: 'Refresh', icon: RefreshMajor }}
    >
      <Layout>
        {/* Stats Overview */}
        <Layout.Section oneHalf>
          <Card title="Today's Activity">
            <Stack vertical spacing="tight">
              <DisplayText size="large">{stats.blockedToday}</DisplayText>
              <div>Bots blocked</div>
              <ProgressBar
                progress={stats.threatLevel === 'high' ? 75 : 40}
                color={stats.threatLevel === 'high' ? 'critical' : 'success'}
              />
              <Badge status={stats.threatLevel === 'high' ? 'critical' : 'attention'}>
                {`Threat level: ${stats.threatLevel}`}
              </Badge>
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section oneHalf>
          <Card title="Weekly Summary">
            <DataTable
              columnContentTypes={['text', 'numeric']}
              headings={['Bot Type', 'Blocked']}
              rows={stats.topBots}
            />
          </Card>
        </Layout.Section>

        {/* Defense Controls */}
        <Layout.Section>
          <Card title="Defense Settings" sectioned>
            <ChoiceList
              title="Protection Level"
              choices={[
                { label: 'Auto (Recommended)', value: 'auto' },
                { label: 'Aggressive', value: 'aggressive' },
                { label: 'Manual', value: 'manual' }
              ]}
              selected={[defenses.protectionLevel]}
              onChange={(val) => setDefenses({...defenses, protectionLevel: val[0]})}
            />

            <Stack spacing="loose">
              <Button icon={SettingsMajor} primary>
                Emergency Lockdown
              </Button>
              <Button icon={HomeMajor}>View Threat Log</Button>
              <Button icon={LogOutMinor}>Generate Report</Button>
            </Stack>
          </Card>
        </Layout.Section>

        {/* Real-time Monitor */}
        <Layout.Section>
          <Card title="Live Traffic Monitor">
            <div style={{height: '200px', background: '#f6f6f7', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {/* Placeholder for live traffic chart */}
              <div>Live bot detection visualization</div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default Dashboard;