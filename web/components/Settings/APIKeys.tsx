// APIKeys.tsx
import React from 'react';
import { Page, Card, TextField, Button, TextContainer, Text } from '@shopify/polaris';

export default function APIKeys() {
  return (
    <Page title="API Keys">
      <Card>
        <div style={{ padding: '16px' }}>
          <TextContainer>
            <Text variant="headingLg" as="h2">Manage API Keys</Text>
            <Text as="p">Configure and manage your API keys for Bot Defender.</Text>
          </TextContainer>
        </div>
      </Card>
    </Page>
  );
}
