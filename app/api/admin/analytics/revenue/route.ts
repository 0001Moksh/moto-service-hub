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

    // Fetch services for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: services, error: servicesError } = await supabaseAdmin
      .from('service')
      .select('service_id, end_at, bill')
      .eq('status', 'completed')
      .gte('end_at', thirtyDaysAgo.toISOString())
      .order('end_at', { ascending: true });

    if (servicesError) {
      console.error('Database error:', servicesError);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    // Group services by date
    const revenueByDate = new Map<string, { revenue: number; services: number; costs: number }>();

    (services || []).forEach((service: any) => {
      const date = new Date(service.end_at).toISOString().split('T')[0];
      const serviceCost = service.bill || 0;

      if (!revenueByDate.has(date)) {
        revenueByDate.set(date, { revenue: 0, services: 0, costs: 0 });
      }

      const dayData = revenueByDate.get(date)!;
      dayData.revenue += serviceCost;
      dayData.services += 1;
      dayData.costs += serviceCost * 0.7; // 70% goes to shop owner
    });

    // Convert to array format
    const revenueData = Array.from(revenueByDate.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      bookings: data.services,
      shop_commission: data.costs,
      platform_commission: data.revenue - data.costs,
    }));

    return NextResponse.json({
      success: true,
      data: revenueData,
      summary: {
        total_revenue: revenueData.reduce((sum, d) => sum + d.revenue, 0),
        total_bookings: revenueData.reduce((sum, d) => sum + d.bookings, 0),
        total_platform_commission: revenueData.reduce((sum, d) => sum + d.platform_commission, 0),
        total_shop_commission: revenueData.reduce((sum, d) => sum + d.shop_commission, 0),
        average_daily_revenue:
          revenueData.length > 0
            ? revenueData.reduce((sum, d) => sum + d.revenue, 0) / revenueData.length
            : 0,
      },
    });
  } catch (error) {
    console.error('Revenue data fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
