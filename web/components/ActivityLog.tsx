// ActivityLog.tsx
import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, Text, TextContainer, DataTable } from '@shopify/polaris';

interface LogEntry {
  id: string;
  timestamp: string;
  ip: string;
  action: string;
  details: string;
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    }
  };

  const handleBlockIP = async (ip: string) => {
    try {
      const res = await fetch('/api/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });

      if (!res.ok) throw new Error('Failed to block IP');

      // Refresh log after blocking
      const updated = await res.json();
      setLogs(prev => [...prev, updated.data]);
    } catch (err) {
      setError('Failed to block IP');
    }
  };

  const rows = logs.map(log => [
    log.timestamp,
    log.ip,
    log.action,
    log.details,
  ]);

  return (
    <Page title="Activity Log">
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <TextContainer>
                <Text variant="headingLg" as="h2">Blocked IP Activity</Text>
                <Text as="p">View and manage blocked IP addresses and their activity.</Text>
              </TextContainer>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text']}
              headings={['Timestamp', 'IP Address', 'Action', 'Details']}
              rows={rows}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
