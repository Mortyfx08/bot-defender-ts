import React from 'react';
import { Page, Layout, Card, DisplayText, ChoiceList, Button, Banner } from '@shopify/polaris';

function BotSettings() {
  return (
    <Page title="Bot Protection Settings">
      <Layout>
        <Layout.Section>
          <Card title="Detection Mode" sectioned>
            <ChoiceList
              title="Bot Detection"
              choices={[
                { label: 'Standard', value: 'standard' },
                { label: 'Aggressive', value: 'aggressive' },
                { label: 'Custom', value: 'custom' }
              ]}
              selected={["standard"]}
              onChange={() => {}}
            />
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card title="Notifications" sectioned>
            <div>Enable email alerts for detected threats.</div>
            <Button primary>Save Settings</Button>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Banner status="info">More settings coming soon!</Banner>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default BotSettings;
