import React from 'react';
import { Card, TextContainer, Text, InlineStack, Badge } from '@shopify/polaris';
import type { DashboardMetrics } from '../types/api';

function ClientDate({ date }: { date: string | null }) {
  const [formatted, setFormatted] = React.useState('Never');
  React.useEffect(() => {
    if (date) setFormatted(new Date(date).toLocaleString());
  }, [date]);
  return <>{formatted}</>;
}

interface ThreatFeedMetricsProps {
  metrics: DashboardMetrics;
}

const ThreatFeedMetrics: React.FC<ThreatFeedMetricsProps> = ({ metrics }) => {
  return (
    <Card aria-label="Threat Feed Metrics">
      <TextContainer>
        <Text variant="headingMd" as="h2" aria-label="Threat Feed Metrics Heading">Threat Feed Metrics</Text>
        <InlineStack gap="400" align="start">
          <div className="metric-card" aria-label="Total Threat Feed IPs">
            <Text variant="headingLg" as="h3">{metrics.threatFeedMetrics.totalThreatFeedIPs}</Text>
            <Badge tone="info">Total Threat Feed IPs</Badge>
          </div>
          <div className="metric-card" aria-label="Threat Feed Blocks">
            <Text variant="headingLg" as="h3">{metrics.threatFeedMetrics.threatFeedBlocks}</Text>
            <Badge tone="critical">Threat Feed Blocks</Badge>
          </div>
          <div className="metric-card" aria-label="Last Update">
            <Text variant="headingLg" as="h3"><ClientDate date={metrics.threatFeedMetrics.lastUpdate} /></Text>
            <Badge tone="info">Last Update</Badge>
          </div>
        </InlineStack>
        <div style={{ marginTop: 16 }}>
          <Text variant="headingSm" as="h3" tone="subdued" aria-label="Severity Breakdown Heading">Severity Breakdown</Text>
        </div>
        <InlineStack gap="400" align="start">
          <div className="metric-card" aria-label="High Severity">
            <Text variant="headingLg" as="h3">{metrics.threatFeedMetrics.threatFeedHighSeverity}</Text>
            <Badge tone="critical">High Severity</Badge>
          </div>
          <div className="metric-card" aria-label="Medium Severity">
            <Text variant="headingLg" as="h3">{metrics.threatFeedMetrics.threatFeedMediumSeverity}</Text>
            <Badge tone="warning">Medium Severity</Badge>
          </div>
          <div className="metric-card" aria-label="Low Severity">
            <Text variant="headingLg" as="h3">{metrics.threatFeedMetrics.threatFeedLowSeverity}</Text>
            <Badge tone="info">Low Severity</Badge>
          </div>
        </InlineStack>
      </TextContainer>
    </Card>
  );
};

export default ThreatFeedMetrics; 