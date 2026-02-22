import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getDateRange(range: string) {
  const endDate = new Date();
  const startDate = new Date();

  if (range === '7d') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === '30d') {
    startDate.setDate(startDate.getDate() - 30);
  } else if (range === '90d') {
    startDate.setDate(startDate.getDate() - 90);
  }

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as any;

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Only admin can access' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const dateRange = getDateRange(range);

    // Get daily booking trends
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, status, created_at')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .order('created_at', { ascending: true });

    // Group by date
    const trendMap = new Map<
      string,
      { total: number; completed: number; cancelled: number; pending: number }
    >();

    bookings?.forEach((booking) => {
      const date = booking.created_at.split('T')[0];
      const existing = trendMap.get(date) || {
        total: 0,
        completed: 0,
        cancelled: 0,
        pending: 0
      };

      existing.total += 1;
      if (booking.status === 'completed') existing.completed += 1;
      else if (booking.status === 'cancelled') existing.cancelled += 1;
      else existing.pending += 1;

      trendMap.set(date, existing);
    });

    const trends = Array.from(trendMap.entries()).map(([date, counts]) => ({
      date,
      total_bookings: counts.total,
      completed: counts.completed,
      cancelled: counts.cancelled,
      pending: counts.pending
    }));

    // Find peak day
    let peakDay = 'N/A';
    let peakCount = 0;
    trends.forEach((trend) => {
      if (trend.total_bookings > peakCount) {
        peakCount = trend.total_bookings;
        peakDay = trend.date;
      }
    });

    const averageDaily =
      trends.length > 0 ? trends.reduce((sum, t) => sum + t.total_bookings, 0) / trends.length : 0;

    // Find busiest hour
    const { data: hourlyData } = await supabase
      .from('bookings')
      .select('created_at')
      .gte('created_at', dateRange.start);

    const hourCounts = new Map<number, number>();
    let busiestHour = 0;
    let maxCount = 0;

    hourlyData?.forEach((booking) => {
      const hour = new Date(booking.created_at).getHours();
      const count = (hourCounts.get(hour) || 0) + 1;
      hourCounts.set(hour, count);

      if (count > maxCount) {
        maxCount = count;
        busiestHour = hour;
      }
    });

    // Get most popular service
    const { data: serviceData } = await supabase
      .from('bookings')
      .select('service:services(name)')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    const serviceMap = new Map<string, number>();
    serviceData?.forEach((booking: any) => {
      const serviceName = booking.service?.name || 'Unknown';
      serviceMap.set(serviceName, (serviceMap.get(serviceName) || 0) + 1);
    });

    let mostPopularService = 'N/A';
    let maxServiceCount = 0;
    serviceMap.forEach((count, service) => {
      if (count > maxServiceCount) {
        maxServiceCount = count;
        mostPopularService = service;
      }
    });

    // Get most popular shop
    const { data: shopData } = await supabase
      .from('bookings')
      .select('shop:shops(name)')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    const shopMap = new Map<string, number>();
    shopData?.forEach((booking: any) => {
      const shopName = booking.shop?.name || 'Unknown';
      shopMap.set(shopName, (shopMap.get(shopName) || 0) + 1);
    });

    let mostPopularShop = 'N/A';
    let maxShopCount = 0;
    shopMap.forEach((count, shop) => {
      if (count > maxShopCount) {
        maxShopCount = count;
        mostPopularShop = shop;
      }
    });

    const analytics = {
      trends,
      peak_day: peakDay,
      peak_count: peakCount,
      average_daily: Math.round(averageDaily),
      busiest_hour: busiestHour,
      most_popular_service: mostPopularService,
      most_popular_shop: mostPopularShop
    };

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
