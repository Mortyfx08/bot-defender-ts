import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get('shop');
    if (!shop) {
      return NextResponse.json([], { status: 200 }); // Always return an array
    }
    // Return mock activity log data
    return NextResponse.json([]);
  } catch (err) {
    console.error('API /api/activity-log error:', err);
    return NextResponse.json([], { status: 200 });
  }
} 