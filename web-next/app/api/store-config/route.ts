import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get('shop');
    if (!shop) {
      // Return default mock config if shop is missing
      return NextResponse.json({
        data: {
          theme: 'system',
          notifications: true,
          autoBlock: true,
          blockThreshold: 5,
          dashboardLayout: 'detailed',
          primaryColor: '#008060',
          refreshInterval: 30,
          showMetrics: {
            totalAlerts: true,
            blockedIPs: true,
            botActivities: true,
            threatFeed: true,
          },
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
        },
      });
    }
    // Return mock store config data
    return NextResponse.json({
      data: {
        theme: 'system',
        notifications: true,
        autoBlock: true,
        blockThreshold: 5,
        dashboardLayout: 'detailed',
        primaryColor: '#008060',
        refreshInterval: 30,
        showMetrics: {
          totalAlerts: true,
          blockedIPs: true,
          botActivities: true,
          threatFeed: true,
        },
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
      },
    });
  } catch (err) {
    console.error('API /api/store-config error:', err);
    return NextResponse.json({ data: {} });
  }
} 