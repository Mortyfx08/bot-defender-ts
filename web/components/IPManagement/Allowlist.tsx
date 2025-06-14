// Allowlist.tsx
import React from 'react';
import { Page, Card, DataTable, Button, TextContainer, Text } from '@shopify/polaris';

export default function Allowlist() {
  // Placeholder data
  const rows = [
    ['203.0.113.5', 'Manual', '2024-05-20', <Button size="slim">Remove</Button>],
    ['198.51.100.7', 'Admin', '2024-05-18', <Button size="slim">Remove</Button>],
  ];

  return (
    <Page title="Allowlisted IPs">
      <Card>
        <div style={{ padding: '16px' }}>
          <TextContainer>
            <Text variant="headingLg" as="h2">Allowlisted IP Addresses</Text>
          </TextContainer>
        </div>
        <DataTable
          columnContentTypes={['text', 'text', 'text', 'text']}
          headings={['IP Address', 'Added By', 'Added At', 'Actions']}
          rows={rows}
        />
      </Card>
    </Page>
  );
}
