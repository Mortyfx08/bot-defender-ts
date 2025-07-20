import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shop = searchParams.get('shop');
  
  if (!shop) {
    return NextResponse.json({ 
      error: 'Shop parameter is required' 
    }, { status: 400 });
  }

  try {
    // Call the real backend API to get actual data
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/api/dashboard?shop=${shop}`);
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }
    
    const backendData = await response.json();
    
    // Return the real data from backend
    return NextResponse.json(backendData);
    
  } catch (err) {
    console.error('API /api/dashboard error:', err);
    
    // Fallback to mock data if backend is not available
    return NextResponse.json({
      data: {
        shop: { 
          domain: shop || 'unknown', 
          name: shop ? shop.replace('.myshopify.com', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown Shop'
        },
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
        recentActivities: [],
        securityAlerts: [],
        blockedIPs: [],
        timestamp: new Date().toISOString()
      }
    });
  }
} 