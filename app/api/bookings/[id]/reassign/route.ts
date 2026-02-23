import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as any;

    const { id } = await params;
    const bookingId = id;

    // Fetch booking with all related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(*),
        service:services(*),
        shop:shops(*),
        worker:workers(*)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if user has access (customer, worker, or admin)
    if (payload.role === 'customer' && booking.customer_id !== payload.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check previous worker status
    let previousWorker = null;
    if (booking.worker_id) {
      const { data: worker } = await supabase
        .from('workers')
        .select('id, name, is_available, unavailable_reason')
        .eq('id', booking.worker_id)
        .single();

      previousWorker = {
        worker_id: worker?.id,
        worker_name: worker?.name,
        reason_unavailable: worker?.unavailable_reason || 'Unknown reason'
      };
    }

    // Find available workers for reassignment
    const { data: availableWorkers, error: workersError } = await supabase
      .from('workers')
      .select('id, name, rating, phone, response_time_minutes, distance_from_shop')
      .eq('shop_id', booking.shop_id)
      .eq('is_available', true)
      .neq('id', booking.worker_id || '')
      .gte('rating', 3.5)
      .order('rating', { ascending: false })
      .order('response_time_minutes', { ascending: true })
      .limit(1);

    let newWorker = null;
    if (availableWorkers && availableWorkers.length > 0) {
      const worker = availableWorkers[0];
      newWorker = {
        worker_id: worker.id,
        worker_name: worker.name,
        rating: worker.rating,
        phone: worker.phone_number || 'N/A',
        response_time_minutes: worker.response_time_minutes
      };
    }

    const reassignmentData = {
      booking_id: bookingId,
      customer_name: booking.customer?.name,
      customer_phone: booking.customer?.location || 'N/A',
      service_name: booking.service?.name,
      shop_name: booking.shop?.name,
      previous_worker: previousWorker,
      new_worker: newWorker,
      status_message: newWorker
        ? `We've found ${newWorker.worker_name} as your replacement. They have a ${newWorker.rating.toFixed(1)}⭐ rating and will arrive in approximately ${newWorker.response_time_minutes} minutes.`
        : `We're currently searching for an available worker. Please wait...`,
      estimated_arrival_minutes: newWorker?.response_time_minutes
    };

    return NextResponse.json({ reassignment: reassignmentData }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as any;

    const { id } = await params;
    const bookingId = id;
    const { new_worker_id } = await request.json();

    if (!new_worker_id) {
      return NextResponse.json({ error: 'New worker ID required' }, { status: 400 });
    }

    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify access
    if (payload.role === 'customer' && booking.customer_id !== payload.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const oldWorkerId = booking.worker_id;

    // Update booking with new worker
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        worker_id: new_worker_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // Create reassignment record
    const { error: reassignError } = await supabase
      .from('worker_reassignments')
      .insert({
        booking_id: bookingId,
        old_worker_id: oldWorkerId,
        new_worker_id: new_worker_id,
        reason: 'Worker unavailable',
        reassigned_at: new Date().toISOString(),
        reassigned_by: payload.id
      });

    if (reassignError) {
      console.error('Reassignment record error:', reassignError);
    }

    // Log to admin logs
    await supabase.from('admin_logs').insert({
      action: 'BOOKING_REASSIGNED',
      resource_type: 'booking',
      resource_id: bookingId,
      details: {
        old_worker_id: oldWorkerId,
        new_worker_id: new_worker_id
      },
      performed_by: payload.id,
      created_at: new Date().toISOString()
    });

    // Get new worker and customer details for notifications
    const { data: newWorker } = await supabase
      .from('workers')
      .select('phone, email, name')
      .eq('id', new_worker_id)
      .single();

    const { data: customer } = await supabase
      .from('customers')
      .select('phone, email, name')
      .eq('id', booking.customer_id)
      .single();

    // TODO: Send SMS/Email notifications
    // - Notify customer of new worker assignment
    // - Notify new worker of booking assignment
    // - Notify old worker of cancellation

    return NextResponse.json(
      { 
        message: 'Booking reassigned successfully',
        booking_id: bookingId,
        new_worker_id: new_worker_id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
