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

    if (!payload || payload.role !== 'worker') {
      return NextResponse.json({ error: 'Unauthorized: Worker access required' }, { status: 403 });
    }

    // Fetch worker metrics
    const { data: worker, error: workerError } = await supabaseAdmin
      .from('worker')
      .select('*')
      .eq('worker_id', payload.userId)
      .single();

    if (workerError || !worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Fetch all bookings for this worker to calculate completion rate
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('booking')
      .select('booking_id, status, completed_at, customer (customer_id), service (service_id)')
      .eq('worker_id', payload.userId);

    if (bookingsError) {
      console.error('Bookings fetch error:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Calculate metrics
    const totalJobs = bookings?.length || 0;
    const completedJobs = bookings?.filter((b: any) => b.status === 'completed').length || 0;
    const completionRate = totalJobs > 0 ? completedJobs / totalJobs : 0;
    const cancellations = bookings?.filter((b: any) => b.status === 'cancelled').length || 0;

    // Calculate rating (default to 0 if no ratings yet)
    // In a real app, this would be calculated from customer feedback
    const rating = worker.rating || 0;

    // Calculate earnings
    const totalEarnings = worker.revenue || 0;

    // Calculate average service time
    const totalServiceTime = worker.total_service_time || 0;
    const averageServiceDuration = completedJobs > 0 ? Math.round(totalServiceTime / completedJobs) : 0;

    const metrics = {
      total_jobs: totalJobs,
      completed_jobs: completedJobs,
      rating: rating,
      total_earnings: totalEarnings,
      completion_rate: completionRate,
      average_service_duration: averageServiceDuration,
      cancellations: cancellations,
      performance_score: worker.performance_score || 0,
    };

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('Performance metrics fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
