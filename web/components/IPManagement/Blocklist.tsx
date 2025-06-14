// Blocklist.tsx
import React, { useEffect, useState } from 'react';
import { Page, Card, TextContainer, Text } from '@shopify/polaris';

export default function Blocklist() {
  const [blockedIPs, setBlockedIPs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlockedIPs = async () => {
      try {
        const res = await fetch('/api/blocked-ips');
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          setBlockedIPs(json.data.map((ip: any) => ip.ip));
        } else {
          setBlockedIPs([]);
        }
      } catch (e) {
        setError('Failed to load blocked IPs');
        setBlockedIPs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockedIPs();
  }, []);

  if (loading) {
    return <div>Loading blocked IPs...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <Page title="Blocked IPs">
      <Card>
        <div style={{ padding: '16px' }}>
          <TextContainer>
            <Text variant="headingLg" as="h2">Blocked IP Addresses</Text>
            {blockedIPs.length > 0 ? (
              <ul>
                {blockedIPs.map((ip, index) => (
                  <li key={index}>{ip}</li>
                ))}
              </ul>
            ) : (
              <Text as="p">No blocked IPs found.</Text>
            )}
          </TextContainer>
        </div>
      </Card>
    </Page>
  );
}
