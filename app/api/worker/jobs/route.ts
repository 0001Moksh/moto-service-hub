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

    // Get URL search params for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    // Fetch jobs assigned to this worker
    let query = supabaseAdmin
      .from('booking')
      .select(`
        booking_id,
        status,
        service_at,
        estimated_duration,
        job (
          job_id,
          service (
            service_id,
            service_type
          )
        ),
        customer (
          customer_id,
          mail,
          phone
        ),
        bike (
          bike_id,
          model_no,
          color
        ),
        shop (
          shop_id,
          location
        )
      `)
      .eq('worker_id', payload.userId)
      .order('service_at', { ascending: false });

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    // Transform data to match expected format
    const jobs = data.map((booking: any) => ({
      booking_id: booking.booking_id,
      customer_name: booking.customer?.mail?.split('@')[0] || 'Customer',
      customer_phone: booking.customer?.phone || 'N/A',
      bike_model: booking.bike?.model_no || 'Unknown',
      bike_color: booking.bike?.color || 'Unknown',
      service_type: booking.job?.[0]?.service?.[0]?.service_type || 'General Maintenance',
      shop_location: booking.shop?.location || 'Unknown',
      service_at: booking.service_at,
      status: booking.status,
      estimated_duration: booking.estimated_duration || 60,
      customer_rating: null, // Will be populated after completion
    }));

    return NextResponse.json({
      success: true,
      jobs,
      totalJobs: jobs.length,
    });
  } catch (error) {
    console.error('Worker jobs fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
