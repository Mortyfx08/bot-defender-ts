import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get('shop');
    if (!shop) {
      // Return default mock data if shop is missing
      return NextResponse.json({
        data: {
          shop: { domain: 'unknown', name: 'Unknown Shop' },
          metrics: {
            totalAlerts: 0,
            totalBlockedIPs: 0,
            recentBotActivities: 0,
            threatFeedMetrics: {
              totalThreatFeedIPs: 0,
              threatFeedBlocks: 0,
              lastUpdate: new Date().toISOString(),
              threatFeedHighSeverity: 0,
              threatFeedMediumSeverity: 0,
              threatFeedLowSeverity: 0,
            },
          },
        },
      });
    }
    // Return mock dashboard data
    return NextResponse.json({
      data: {
        shop: { domain: shop, name: 'Test Shop' },
        metrics: {
          totalAlerts: 0,
          totalBlockedIPs: 0,
          recentBotActivities: 0,
          threatFeedMetrics: {
            totalThreatFeedIPs: 0,
            threatFeedBlocks: 0,
            lastUpdate: new Date().toISOString(),
            threatFeedHighSeverity: 0,
            threatFeedMediumSeverity: 0,
            threatFeedLowSeverity: 0,
          },
        },
      },
    });
  } catch (err) {
    console.error('API /api/dashboard error:', err);
    return NextResponse.json({ data: {} });
  }
} 