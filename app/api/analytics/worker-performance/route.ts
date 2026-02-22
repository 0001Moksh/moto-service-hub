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

    // Get all workers with their performance metrics
    const { data: workers } = await supabase
      .from('workers')
      .select('id, name, rating, is_available');

    const topWorkers = await Promise.all(
      (workers || []).map(async (worker) => {
        // Get bookings for this worker
        const { count: totalBookings } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('worker_id', worker.id)
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);

        const { count: completedBookings } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('worker_id', worker.id)
          .eq('status', 'completed')
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);

        const { count: cancelledBookings } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('worker_id', worker.id)
          .eq('status', 'cancelled')
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);

        // Get earnings from invoices where worker provided service
        const { data: bookingIds } = await supabase
          .from('bookings')
          .select('id')
          .eq('worker_id', worker.id)
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);

        const { data: invoices } = await supabase
          .from('invoices')
          .select('shop_payout')
          .in(
            'booking_id',
            bookingIds?.map((b) => b.id) || []
          );

        const earnings = invoices?.reduce((sum, inv) => sum + (inv.shop_payout || 0), 0) || 0;

        return {
          worker_id: worker.id,
          worker_name: worker.name,
          rating: worker.rating,
          total_bookings: totalBookings || 0,
          completed_bookings: completedBookings || 0,
          cancelled_bookings: cancelledBookings || 0,
          completion_rate:
            (totalBookings || 0) > 0 ? ((completedBookings || 0) / (totalBookings || 0)) * 100 : 0,
          average_rating: worker.rating,
          earnings: earnings,
          active_status: worker.is_available
        };
      })
    );

    // Sort by earnings
    topWorkers.sort((a, b) => b.earnings - a.earnings);

    // Get top performer
    const topPerformer = topWorkers[0] || null;

    // Calculate platform averages
    const totalComplete = topWorkers.reduce((sum, w) => sum + w.completed_bookings, 0);
    const totalAll = topWorkers.reduce((sum, w) => sum + w.total_bookings, 0);
    const averageCompletionRate = totalAll > 0 ? (totalComplete / totalAll) * 100 : 0;
    const averageEarnings =
      topWorkers.length > 0
        ? topWorkers.reduce((sum, w) => sum + w.earnings, 0) / topWorkers.length
        : 0;

    const analytics = {
      top_workers: topWorkers.slice(0, 10),
      total_active_workers: workers?.filter((w) => w.is_available).length || 0,
      average_completion_rate: averageCompletionRate,
      average_earnings: averageEarnings,
      top_performer: topPerformer
    };

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
