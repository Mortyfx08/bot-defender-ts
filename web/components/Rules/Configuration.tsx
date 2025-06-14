// Configuration.tsx
import React from 'react';
import { Page, Card, TextContainer, Text } from '@shopify/polaris';

export default function Configuration() {
  return (
    <Page title="Rule Configuration">
      <Card>
        <div style={{ padding: '16px' }}>
          <TextContainer>
            <Text variant="headingLg" as="h2">Configure Bot Defense Rules</Text>
          </TextContainer>
        </div>
      </Card>
    </Page>
  );
}
