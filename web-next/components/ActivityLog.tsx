import React, { useEffect, useState } from 'react';
import { Card, Text, DataTable, Badge, SkeletonBodyText, EmptyState } from '@shopify/polaris';
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

const ActivityLog: React.FC<ActivityLogProps> = ({ shop }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/activity-log?shop=${shop}`);
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Error fetching activity log:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [shop]);

  const getSeverityBadge = (severity: string) => {
    const severityColors: Record<string, 'critical' | 'warning' | 'info'> = {
      high: 'critical',
      medium: 'warning',
      low: 'info'
    };
    return <Badge tone={severityColors[severity] || 'info'}>{severity}</Badge>;
  };

  if (loading) {
    return (
      <Card aria-label="Activity Log Loading">
        <div className="p-4">
          <Text variant="headingMd" as="h2">Activity Log</Text>
          <SkeletonBodyText lines={6} />
        </div>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card aria-label="No Activity Log">
        <EmptyState
          heading="No activity yet"
          action={{content: 'Learn more', url: 'https://help.shopify.com'}}
          image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
        >
          <p>Once your store receives traffic, activity will appear here.</p>
        </EmptyState>
      </Card>
    );
  }

  return (
    <Card aria-label="Activity Log Table">
      <div className="p-4">
        <Text variant="headingMd" as="h2">Activity Log</Text>
        <DataTable
          columnContentTypes={['text', 'text', 'text', 'text']}
          headings={['Type', 'Severity', 'Time', 'Details']}
          rows={Array.isArray(activities) ? activities.map(activity => [
            activity.type,
            getSeverityBadge(activity.severity),
            new Date(activity.timestamp).toLocaleString(),
            activity.details
          ]) : []}
          showTotalsInFooter={false}
          aria-label="Activity Log Table"
        />
      </div>
    </Card>
  );
};

export default React.memo(ActivityLog); 