import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const bookingId = id;

    // Fetch booking with all related data
    const { data: booking, error } = await supabaseAdmin
      .from('booking')
      .select(`
        booking_id,
        customer_id,
        bike_id,
        shop_id,
        service_id,
        worker_id,
        status,
        service_cost,
        created_at,
        started_at,
        completed_at,
        estimated_completion_time,
        bike:bike(model),
        shop:shop(name),
        service:service(service_name, estimated_time, base_cost),
        worker:worker(worker_id, worker_name, rating, phone, latitude, longitude)
      `)
      .eq('booking_id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check access permissions
    if (payload.role !== 'admin' && payload.role !== 'owner') {
      if (payload.role === 'customer' && booking.customer_id !== payload.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (payload.role === 'worker' && booking.worker_id !== payload.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Calculate progress percentage based on status
    const statusProgress = {
      pending: 10,
      confirmed: 25,
      assigned: 50,
      started: 75,
      completed: 100,
      cancelled: 0
    };

    const progressPercentage = statusProgress[booking.status as keyof typeof statusProgress] || 0;
    const estimatedTime = (booking.service?.estimated_time || 30) * 60 * 1000; // Convert to milliseconds
    const createdTime = new Date(booking.created_at).getTime();
    const elapsedTime = Date.now() - createdTime;
    const calculatedProgress = Math.min(
      Math.round((elapsedTime / estimatedTime) * 100),
      progressPercentage
    );

    return NextResponse.json({
      success: true,
      booking: {
        booking_id: booking.booking_id,
        status: booking.status,
        bike_model: booking.bike?.model,
        shop_name: booking.shop?.shop_name,
        service_name: booking.service?.service_name,
        estimated_time: booking.service?.estimated_time,
        base_cost: booking.service?.base_cost,
        service_cost: booking.service_cost,
        created_at: booking.created_at,
        started_at: booking.started_at,
        completed_at: booking.completed_at,
        progress_percentage: calculatedProgress,
        assigned_worker: booking.worker ? {
          worker_id: booking.worker.worker_id,
          worker_name: booking.worker.worker_name,
          rating: booking.worker.rating,
          phone: booking.worker.phone_number || 'N/A',
          latitude: booking.worker.latitude,
          longitude: booking.worker.longitude
        } : undefined
      }
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
