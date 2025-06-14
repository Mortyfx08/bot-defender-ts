import React, { useEffect, useState } from 'react';
import { Card, Text, DataTable, Badge } from '@shopify/polaris';
import type { BadgeProps } from '@shopify/polaris';

interface BotActivity {
  id: string;
  ip: string;
  userAgent: string;
  path: string;
  severity: string;
  timestamp: string;
  reason: string;
}

interface LiveBotActivityProps {
  shop: string;
}

export const LiveBotActivity: React.FC<LiveBotActivityProps> = ({ shop }) => {
  const [activities, setActivities] = useState<BotActivity[]>([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/api/bot-activities?shop=${shop}`);
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Error fetching bot activities:', error);
      }
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [shop]);

  const getSeverityBadge = (severity: string) => {
    const severityColors: Record<string, BadgeProps['status']> = {
      high: 'critical',
      medium: 'warning',
      low: 'info'
    };
    return <Badge status={severityColors[severity] || 'info'}>{severity}</Badge>;
  };

  return (
    <Card>
      <div className="p-4">
        <Text variant="headingMd" as="h2">Live Bot Activity</Text>
        <DataTable
          columnContentTypes={['text', 'text', 'text', 'text', 'text']}
          headings={['IP', 'User Agent', 'Path', 'Severity', 'Time']}
          rows={activities.map(activity => [
            activity.ip,
            activity.userAgent,
            activity.path,
            getSeverityBadge(activity.severity),
            new Date(activity.timestamp).toLocaleString()
          ])}
        />
      </div>
    </Card>
  );
}; 