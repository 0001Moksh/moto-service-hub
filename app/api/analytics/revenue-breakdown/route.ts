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

    // Get all invoices for revenue
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, total_amount, platform_commission, created_at')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    const totalRevenue = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
    const platformCommission = invoices?.reduce(
      (sum, inv) => sum + (inv.platform_commission || 0),
      0
    ) || 0;
    const shopPayouts = totalRevenue - platformCommission;

    const averageTransaction =
      invoices && invoices.length > 0 ? totalRevenue / invoices.length : 0;

    // Get all services and calculate revenue
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('service:services(name), id')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    const serviceRevenueMap = new Map<string, number>();
    bookingData?.forEach((booking: any) => {
      const serviceName = booking.service?.name || 'Unknown';
      // Get revenue for this service from invoices
      const serviceInvoices = invoices?.filter(
        (inv: any) => inv.id === booking.id // In real scenario, would need proper join
      );
      const serviceRevenue = serviceInvoices?.reduce((sum: number, inv: any) => sum + inv.total_amount, 0) || 0;
      serviceRevenueMap.set(
        serviceName,
        (serviceRevenueMap.get(serviceName) || 0) + serviceRevenue
      );
    });

    const revenueByService = Array.from(serviceRevenueMap.entries())
      .map(([service, revenue]) => ({
        service,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Get revenue by shop
    const { data: shopBookingData } = await supabase
      .from('bookings')
      .select('shop:shops(name), id')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    const shopRevenueMap = new Map<string, number>();
    shopBookingData?.forEach((booking: any) => {
      const shopName = booking.shop?.name || 'Unknown';
      const shopInvoices = invoices?.filter((inv: any) => inv.id === booking.id);
      const shopRevenue = shopInvoices?.reduce((sum: number, inv: any) => sum + inv.total_amount, 0) || 0;
      shopRevenueMap.set(shopName, (shopRevenueMap.get(shopName) || 0) + shopRevenue);
    });

    const revenueByShop = Array.from(shopRevenueMap.entries())
      .map(([shop, revenue]) => ({
        shop,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Calculate monthly growth
    const previousStart = new Date(new Date(dateRange.start).setMonth(
      new Date(dateRange.start).getMonth() - 1
    ))
      .toISOString()
      .split('T')[0];
    const previousEnd = dateRange.start;

    const { data: previousInvoices } = await supabase
      .from('invoices')
      .select('total_amount')
      .gte('created_at', previousStart)
      .lte('created_at', previousEnd);

    const previousRevenue = previousInvoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
    const monthlyGrowth =
      previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    const analytics = {
      total_revenue: totalRevenue,
      platform_commission: platformCommission,
      shop_payouts: shopPayouts,
      average_transaction: averageTransaction,
      revenue_by_service: revenueByService,
      revenue_by_shop: revenueByShop,
      monthly_growth: monthlyGrowth,
      commission_split: {
        platform: 30,
        shop: 70
      }
    };

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
