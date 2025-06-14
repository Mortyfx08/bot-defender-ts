// Reports.tsx
import React from 'react';
import { Page, Card, TextContainer, Text, DataTable } from '@shopify/polaris';

export default function Reports() {
  return (
    <Page title="Analytics Reports">
      <Card>
        <div style={{ padding: '16px' }}>
          <TextContainer>
            <Text variant="headingLg" as="h2">Recent Security Events</Text>
          </TextContainer>
        </div>
      </Card>
      <Card>
        <div style={{ padding: '16px' }}>
          <DataTable
            columnContentTypes={['text', 'text', 'numeric']}
            headings={['Date', 'Event', 'Count']}
            rows={[
              ['2024-01-02', 'Bot Attack Blocked', '15'],
              ['2024-01-01', 'Suspicious Activity', '8'],
              ['2023-12-31', 'Rate Limit Exceeded', '23']
            ]}
          />
        </div>
      </Card>
    </Page>
  );
}
