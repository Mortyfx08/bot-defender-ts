import React, { useEffect, useState } from 'react';
import { Card, Text, DataTable, Badge } from '@shopify/polaris';
import type { BadgeProps } from '@shopify/polaris';

interface Activity {
  id: string;
  type: string;
  severity: string;
  timestamp: string;
  details: string;
}

interface ActivityLogProps {
  shop: string;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ shop }) => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/api/activity-log?shop=${shop}`);
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Error fetching activity log:', error);
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
        <Text variant="headingMd" as="h2">Activity Log</Text>
        <DataTable
          columnContentTypes={['text', 'text', 'text', 'text']}
          headings={['Type', 'Severity', 'Time', 'Details']}
          rows={activities.map(activity => [
            activity.type,
            getSeverityBadge(activity.severity),
            new Date(activity.timestamp).toLocaleString(),
            activity.details
          ])}
        />
      </div>
    </Card>
  );
}; 