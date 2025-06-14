// Notifications.tsx
import React from 'react';
import { Page, Card, TextContainer, Text } from '@shopify/polaris';

export default function Notifications() {
  return (
    <Page title="Notification Settings">
      <Card>
        <div style={{ padding: '16px' }}>
          <TextContainer>
            <Text variant="headingLg" as="h2">Manage Notifications</Text>
          </TextContainer>
        </div>
      </Card>
    </Page>
  );
}
