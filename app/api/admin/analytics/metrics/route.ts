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

    // Fetch all shops
    const { data: shops, error: shopsError } = await supabaseAdmin
      .from('shop')
      .select('shop_id, rating, revenue');

    if (shopsError) {
      console.error('Database error:', shopsError);
      return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 });
    }

    const shopList = shops || [];

    // Calculate metrics
    const total_shops = shopList.length;
    const total_revenue = shopList.reduce((sum: number, s: any) => sum + (s.revenue || 0), 0);
    const average_rating =
      total_shops > 0
        ? shopList.reduce((sum: number, s: any) => sum + (s.rating || 0), 0) / total_shops
        : 0;

    // Fetch all bookings for total count
    const { count: total_bookings } = await supabaseAdmin
      .from('booking')
      .select('*', { count: 'exact', head: true });

    // Count high-risk shops (abuse score > 70)
    let high_risk_shops = 0;
    for (const shop of shopList) {
      const { count: noShows } = await supabaseAdmin
        .from('booking')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.shop_id)
        .eq('status', 'no-show');

      const { count: totalShopBookings } = await supabaseAdmin
        .from('booking')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shop.shop_id);

      const abuseScore =
        (totalShopBookings || 0) > 0
          ? ((noShows || 0) / (totalShopBookings || 1)) * 100
          : 0;

      if (abuseScore > 70) {
        high_risk_shops++;
      }
    }

    const metrics = {
      total_shops,
      total_revenue,
      total_bookings: total_bookings || 0,
      average_rating: Math.round(average_rating * 10) / 10,
      high_risk_shops,
    };

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('Metrics fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
