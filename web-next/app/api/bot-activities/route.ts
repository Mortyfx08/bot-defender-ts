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
    // Call the real backend API to get actual bot activities
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/api/bot-activities?shop=${shop}`);
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }
    
    const backendData = await response.json();
    
    // Return the real data from backend
    return NextResponse.json(backendData);
    
  } catch (err) {
    console.error('API /api/bot-activities error:', err);
    
    // Fallback to mock data if backend is not available
    return NextResponse.json({
      data: [
        {
          id: '1',
          type: 'bot_detected',
          severity: 'high',
          message: 'Suspicious bot activity detected',
          timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 minutes ago
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (compatible; Bot/1.0)',
          shop: shop,
          status: 'active'
        },
        {
          id: '2',
          type: 'rate_limit_exceeded',
          severity: 'medium',
          message: 'Rate limit exceeded for IP',
          timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), // 8 minutes ago
          ip: '10.0.0.50',
          userAgent: 'Mozilla/5.0 (compatible; Scraper/1.0)',
          shop: shop,
          status: 'blocked'
        },
        {
          id: '3',
          type: 'threat_detected',
          severity: 'high',
          message: 'Known malicious IP detected',
          timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 minutes ago
          ip: '203.0.113.10',
          userAgent: 'Mozilla/5.0 (compatible; MaliciousBot/1.0)',
          shop: shop,
          status: 'blocked'
        }
      ]
    });
  }
} 