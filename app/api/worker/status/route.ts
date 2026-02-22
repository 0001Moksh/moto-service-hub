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

    if (payload.role !== 'worker') {
      return NextResponse.json({ error: 'Only workers can access this' }, { status: 403 });
    }

    // Fetch worker details
    const { data: worker, error } = await supabase
      .from('workers')
      .select('id, name, is_available, unavailable_reason, rating, phone')
      .eq('id', payload.id)
      .single();

    if (error || !worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Count active bookings
    const { count: activeBookingsCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('worker_id', payload.id)
      .in('status', ['pending', 'confirmed', 'assigned', 'started']);

    return NextResponse.json(
      {
        worker: {
          worker_id: worker.id,
          worker_name: worker.name,
          is_available: worker.is_available,
          unavailable_reason: worker.unavailable_reason,
          rating: worker.rating,
          phone: worker.phone,
          active_bookings_count: activeBookingsCount || 0
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as any;

    if (payload.role !== 'worker') {
      return NextResponse.json({ error: 'Only workers can update status' }, { status: 403 });
    }

    const { is_available, unavailable_reason } = await request.json();

    // Update worker status
    const { error: updateError } = await supabase
      .from('workers')
      .update({
        is_available: is_available,
        unavailable_reason: unavailable_reason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    // If marking unavailable, trigger reassignments
    if (!is_available) {
      const { data: pendingBookings } = await supabase
        .from('bookings')
        .select('id, shop_id, assigned_at')
        .eq('worker_id', payload.id)
        .in('status', ['pending', 'confirmed', 'assigned', 'started'])
        .order('created_at', { ascending: true });

      let reassignedCount = 0;
      let queuedCount = 0;

      if (pendingBookings && pendingBookings.length > 0) {
        for (const booking of pendingBookings) {
          // Find alternative worker
          const { data: altWorkers } = await supabase
            .from('workers')
            .select('id, name, rating')
            .eq('shop_id', booking.shop_id)
            .eq('is_available', true)
            .neq('id', payload.id)
            .gte('rating', 3.5)
            .order('rating', { ascending: false })
            .limit(1);

          if (altWorkers && altWorkers.length > 0) {
            // Reassign
            const { error: reassignError } = await supabase
              .from('bookings')
              .update({ worker_id: altWorkers[0].id })
              .eq('id', booking.id);

            if (!reassignError) {
              reassignedCount++;

              // Log reassignment
              await supabase.from('worker_reassignments').insert({
                booking_id: booking.id,
                old_worker_id: payload.id,
                new_worker_id: altWorkers[0].id,
                reason: 'Worker unavailable: ' + (unavailable_reason || 'Unknown'),
                reassigned_at: new Date().toISOString(),
                reassigned_by: payload.id
              });
            }
          } else {
            // Queue for manual assignment
            await supabase
              .from('bookings')
              .update({ status: 'pending_manual_assignment' })
              .eq('id', booking.id);

            queuedCount++;
          }
        }
      }

      // Log worker unavailability
      await supabase.from('admin_logs').insert({
        action: 'WORKER_MARKED_UNAVAILABLE',
        resource_type: 'worker',
        resource_id: payload.id,
        details: {
          reason: unavailable_reason,
          bookings_reassigned: reassignedCount,
          bookings_queued: queuedCount
        },
        performed_by: payload.id,
        created_at: new Date().toISOString()
      });
    } else {
      // Log worker back to available
      await supabase.from('admin_logs').insert({
        action: 'WORKER_MARKED_AVAILABLE',
        resource_type: 'worker',
        resource_id: payload.id,
        details: {
          previous_reason: unavailable_reason
        },
        performed_by: payload.id,
        created_at: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { message: 'Status updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
