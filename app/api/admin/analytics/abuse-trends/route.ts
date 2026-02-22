import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Extract and verify token
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Missing authentication token' }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const trends: any[] = [];

    // Fetch all shops to check for abuse patterns
    const { data: shops, error: shopsError } = await supabaseAdmin
      .from('shop')
      .select('shop_id, name');

    if (shopsError) {
      console.error('Database error:', shopsError);
      return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 });
    }

    // Analyze each shop for abuse patterns
    for (const shop of shops || []) {
      // Check for no-shows
      const { data: bookings, error: bookingsError } = await supabaseAdmin
        .from('booking')
        .select('booking_id, status, created_at')
        .eq('shop_id', shop.shop_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (bookingsError) continue;

      // Count no-shows (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentBookings = bookings?.filter(
        (b: any) => b.created_at && new Date(b.created_at) > thirtyDaysAgo
      ) || [];

      const noShowCount = recentBookings.filter((b: any) => b.status === 'no-show').length;
      const cancellationCount = recentBookings.filter((b: any) => b.status === 'cancelled').length;

      // High-risk pattern: More than 20% no-show rate
      if (recentBookings.length > 0) {
        const noShowRate = noShowCount / recentBookings.length;

        if (noShowRate > 0.2) {
          trends.push({
            shop_id: shop.shop_id,
            shop_name: shop.name,
            abuse_type: 'High No-Show Rate',
            count: noShowCount,
            severity: noShowRate > 0.4 ? 'high' : 'medium',
            last_incident: new Date().toISOString(),
          });
        }

        // Medium-risk pattern: High cancellation rate
        const cancellationRate = cancellationCount / recentBookings.length;
        if (cancellationRate > 0.15) {
          trends.push({
            shop_id: shop.shop_id,
            shop_name: shop.name,
            abuse_type: 'High Cancellation Rate',
            count: cancellationCount,
            severity: cancellationRate > 0.3 ? 'high' : 'medium',
            last_incident: new Date().toISOString(),
          });
        }
      }

      // Check for low ratings (below 3 stars)
      const { data: shopData } = await supabaseAdmin
        .from('shop')
        .select('rating')
        .eq('shop_id', shop.shop_id)
        .single();

      if (shopData && shopData.rating < 3) {
        trends.push({
          shop_id: shop.shop_id,
          shop_name: shop.name,
          abuse_type: 'Low Customer Rating',
          count: Math.floor((5 - shopData.rating) * 10),
          severity: shopData.rating < 2 ? 'high' : 'medium',
          last_incident: new Date().toISOString(),
        });
      }
    }

    // Sort by severity
    const severityOrder = { high: 0, medium: 1, low: 2 };
    trends.sort((a, b) => severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]);

    return NextResponse.json({
      success: true,
      trends: trends.slice(0, 20), // Return top 20 abuse trends
      totalTrends: trends.length,
    });
  } catch (error) {
    console.error('Abuse trends fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
