import React from 'react';
import {
  Page,
  Layout,
  Card,
  DisplayText,
  Button
} from '@shopify/polaris';

function Welcome() {
  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <DisplayText size="large">
              Welcome to Bot Defender
            </DisplayText>
            <p>Protect your store from malicious bots and threats.</p>
            <Button primary url="/login">
              Go to Login
            </Button>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default Welcome;  // Must include this line!