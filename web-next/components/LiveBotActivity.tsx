import React, { useEffect, useState } from 'react';
import { Card, Text, DataTable, Badge, SkeletonBodyText, EmptyState } from '@shopify/polaris';

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

const LiveBotActivity: React.FC<LiveBotActivityProps> = ({ shop }) => {
  const [activities, setActivities] = useState<BotActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/bot-activities?shop=${shop}`);
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Error fetching bot activities:', error);
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
      <Card aria-label="Live Bot Activity Loading">
        <div className="p-4">
          <Text variant="headingMd" as="h2">Live Bot Activity</Text>
          <SkeletonBodyText lines={6} />
        </div>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card aria-label="No Live Bot Activity">
        <EmptyState
          heading="No live bot activity yet"
          action={{content: 'Learn more', url: 'https://help.shopify.com'}}
          image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
        >
          <p>Once your store receives traffic, live bot activity will appear here.</p>
        </EmptyState>
      </Card>
    );
  }

  return (
    <Card aria-label="Live Bot Activity Table">
      <div className="p-4">
        <Text variant="headingMd" as="h2">Live Bot Activity</Text>
        <DataTable
          columnContentTypes={['text', 'text', 'text', 'text', 'text']}
          headings={['IP', 'User Agent', 'Path', 'Severity', 'Time']}
          rows={Array.isArray(activities) ? activities.map(activity => [
            activity.ip,
            activity.userAgent,
            activity.path,
            getSeverityBadge(activity.severity),
            new Date(activity.timestamp).toLocaleString()
          ]) : []}
          showTotalsInFooter={false}
          aria-label="Live Bot Activity Table"
        />
      </div>
    </Card>
  );
};

export default React.memo(LiveBotActivity); 