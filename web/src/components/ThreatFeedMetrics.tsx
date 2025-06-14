import React from 'react';
import { Text, Card, TextContainer } from '@shopify/polaris';

interface ThreatFeedMetricsProps {
  metrics: {
    totalThreatFeedIPs: number;
    threatFeedBlocks: number;
    lastUpdate: string | null;
    threatFeedHighSeverity: number;
    threatFeedMediumSeverity: number;
    threatFeedLowSeverity: number;
  };
  threatFeedData: {
    totalIPs: number;
    lastUpdate: string | null;
    recentBlocks: any[];
    updateStats: any;
  };
}

export const ThreatFeedMetrics: React.FC<ThreatFeedMetricsProps> = ({ metrics, threatFeedData }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="threat-feed-metrics">
      <TextContainer>
        <Text variant="headingMd" as="h2">Threat Feed Metrics</Text>
        
        {/* Main Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <Text variant="headingLg" as="h3">{metrics.totalThreatFeedIPs}</Text>
            <Text as="p">Total Threat Feed IPs</Text>
          </div>
          <div className="metric-card">
            <Text variant="headingLg" as="h3">{metrics.threatFeedBlocks}</Text>
            <Text as="p">Threat Feed Blocks</Text>
          </div>
          <div className="metric-card">
            <Text variant="headingLg" as="h3">{formatDate(metrics.lastUpdate)}</Text>
            <Text as="p">Last Update</Text>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="metrics-grid">
          <div className="metric-card severity-high">
            <Text variant="headingLg" as="h3">{metrics.threatFeedHighSeverity}</Text>
            <Text as="p">High Severity</Text>
          </div>
          <div className="metric-card severity-medium">
            <Text variant="headingLg" as="h3">{metrics.threatFeedMediumSeverity}</Text>
            <Text as="p">Medium Severity</Text>
          </div>
          <div className="metric-card severity-low">
            <Text variant="headingLg" as="h3">{metrics.threatFeedLowSeverity}</Text>
            <Text as="p">Low Severity</Text>
          </div>
        </div>
      </TextContainer>
    </div>
  );
}; 