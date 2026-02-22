import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as any;

    if (!['admin', 'system', 'owner'].includes(payload.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { booking_id, original_worker_id, emergency_type } = await request.json();

    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id is required' }, { status: 400 });
    }

    // Fetch booking with shop info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, shop_id, customer_id, service_id, worker_id')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Step 1: Try to find any available worker (even with lower rating)
    const { data: anyWorker } = await supabase
      .from('workers')
      .select('id, name, rating, response_time_minutes')
      .eq('shop_id', booking.shop_id)
      .eq('is_available', true)
      .neq('id', original_worker_id || '')
      .order('rating', { ascending: false })
      .limit(1);

    if (anyWorker && anyWorker.length > 0) {
      const fallbackWorkerId = anyWorker[0].id;

      // Assign to fallback worker
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          worker_id: fallbackWorkerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking_id);

      if (!updateError) {
        // Log fallback assignment
        await supabase.from('worker_reassignments').insert({
          booking_id: booking_id,
          old_worker_id: original_worker_id || null,
          new_worker_id: fallbackWorkerId,
          reason: 'Fallback assignment: ' + (emergency_type || 'Worker unavailable'),
          reassigned_at: new Date().toISOString(),
          reassigned_by: payload.id
        });

        return NextResponse.json(
          {
            message: 'Fallback worker assigned',
            booking_id: booking_id,
            new_worker_id: fallbackWorkerId,
            worker_name: anyWorker[0].name,
            worker_rating: anyWorker[0].rating,
            status: 'assigned'
          },
          { status: 200 }
        );
      }
    }

    // Step 2: No workers available - mark for manual assignment
    const { error: manualError } = await supabase
      .from('bookings')
      .update({
        status: 'pending_manual_assignment',
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id);

    if (!manualError) {
      // Create urgent admin notification
      const { error: logError } = await supabase.from('admin_logs').insert({
        action: 'URGENT_MANUAL_ASSIGNMENT_REQUIRED',
        resource_type: 'booking',
        resource_id: booking_id,
        details: {
          reason: 'No available workers for reassignment',
          original_worker_id: original_worker_id,
          emergency_type: emergency_type,
          shop_id: booking.shop_id
        },
        performed_by: payload.id,
        created_at: new Date().toISOString()
      });

      return NextResponse.json(
        {
          message: 'Booking queued for manual assignment',
          booking_id: booking_id,
          status: 'pending_manual_assignment',
          action: 'admin_manual_assignment_required'
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process fallback assignment' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all bookings pending manual assignment
    const { data: pendingBookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        created_at,
        customer:customers(name, phone),
        shop:shops(name),
        service:services(name),
        worker:workers(name)
      `)
      .eq('status', 'pending_manual_assignment')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch pending bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        pending_assignments: pendingBookings || [],
        total_pending: pendingBookings?.length || 0
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
