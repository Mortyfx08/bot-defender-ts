import React from 'react';
import { Text, Card, TextContainer, Badge, InlineStack } from '@shopify/polaris';
import type { DashboardMetrics } from '../types/api';

interface ThreatFeedMetricsProps {
  metrics: DashboardMetrics;
}

const ThreatFeedMetrics: React.FC<ThreatFeedMetricsProps> = ({ metrics }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

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
            <Text variant="headingLg" as="h3">{formatDate(metrics.threatFeedMetrics.lastUpdate)}</Text>
            <Badge tone="info">Last Update</Badge>
          </div>
        </InlineStack>
        <div style={{ marginTop: 16 }}>
          <Text variant="headingSm" as="h3" tone="subdued" aria-label="Severity Breakdown Heading">Severity Breakdown</Text>
        </div>
        <InlineStack gap="400" align="start">
          <div className="metric-card severity-high" aria-label="High Severity">
            <Text variant="headingLg" as="h3">{metrics.threatFeedMetrics.threatFeedHighSeverity}</Text>
            <Badge tone="critical">High Severity</Badge>
          </div>
          <div className="metric-card severity-medium" aria-label="Medium Severity">
            <Text variant="headingLg" as="h3">{metrics.threatFeedMetrics.threatFeedMediumSeverity}</Text>
            <Badge tone="warning">Medium Severity</Badge>
          </div>
          <div className="metric-card severity-low" aria-label="Low Severity">
            <Text variant="headingLg" as="h3">{metrics.threatFeedMetrics.threatFeedLowSeverity}</Text>
            <Badge tone="info">Low Severity</Badge>
          </div>
        </InlineStack>
        <Text as="p" variant="bodySm" tone="subdued" alignment="end">
          Last updated: {formatDate(metrics.threatFeedMetrics.lastUpdate)}
        </Text>
      </TextContainer>
    </Card>
  );
}

export default React.memo(ThreatFeedMetrics); 