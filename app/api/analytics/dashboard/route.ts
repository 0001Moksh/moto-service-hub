import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

    // Get booking metrics
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true });

    const { count: completedBookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { count: cancelledBookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'cancelled');

    // Get revenue
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, platform_commission');

    const totalRevenue = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
    const platformCommission = invoices?.reduce(
      (sum, inv) => sum + (inv.platform_commission || 0),
      0
    ) || 0;

    // Get average rating
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('rating');

    const averageRating =
      bookingData && bookingData.length > 0
        ? bookingData.reduce((sum, b) => sum + (b.rating || 0), 0) / bookingData.length
        : 0;

    // Get active workers and shops
    const { count: activeWorkers } = await supabase
      .from('workers')
      .select('id', { count: 'exact', head: true })
      .eq('is_available', true);

    const { count: activeShops } = await supabase
      .from('shops')
      .select('id', { count: 'exact', head: true });

    // Get this month metrics
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const { count: bookingsThisMonth } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStartStr);

    const { data: thisMonthInvoices } = await supabase
      .from('invoices')
      .select('total_amount')
      .gte('created_at', monthStartStr);

    const revenueThisMonth = thisMonthInvoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;

    const metrics = {
      total_bookings: totalBookings || 0,
      completed_bookings: completedBookings || 0,
      cancelled_bookings: cancelledBookings || 0,
      total_revenue: totalRevenue,
      platform_commission: platformCommission,
      average_rating: averageRating,
      active_workers: activeWorkers || 0,
      active_shops: activeShops || 0,
      bookings_this_month: bookingsThisMonth || 0,
      revenue_this_month: revenueThisMonth,
      completion_rate:
        totalBookings && totalBookings > 0 ? ((completedBookings || 0) / totalBookings) * 100 : 0,
      cancellation_rate:
        totalBookings && totalBookings > 0 ? ((cancelledBookings || 0) / totalBookings) * 100 : 0
    };

    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
