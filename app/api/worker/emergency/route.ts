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

    if (payload.role !== 'worker') {
      return NextResponse.json({ error: 'Only workers can report emergency' }, { status: 403 });
    }

    const { booking_id, emergency_reason, worker_id } = await request.json();

    if (!booking_id || !emergency_reason) {
      return NextResponse.json(
        { error: 'booking_id and emergency_reason required' },
        { status: 400 }
      );
    }

    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify worker is assigned to this booking
    if (booking.worker_id !== worker_id) {
      return NextResponse.json(
        { error: 'Worker not assigned to this booking' },
        { status: 403 }
      );
    }

    // Mark worker as unavailable
    const { error: updateWorkerError } = await supabase
      .from('workers')
      .update({
        is_available: false,
        unavailable_reason: emergency_reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', worker_id);

    if (updateWorkerError) {
      return NextResponse.json(
        { error: 'Failed to update worker status' },
        { status: 500 }
      );
    }

    // Create emergency record
    const { error: emergencyError } = await supabase
      .from('worker_emergencies')
      .insert({
        worker_id: worker_id,
        booking_id: booking_id,
        reason: emergency_reason,
        emergency_at: new Date().toISOString()
      });

    if (emergencyError) {
      console.error('Emergency record error:', emergencyError);
    }

    // Find alternative workers
    const { data: availableWorkers } = await supabase
      .from('workers')
      .select('id, name, rating, phone, response_time_minutes')
      .eq('shop_id', booking.shop_id)
      .eq('is_available', true)
      .neq('id', worker_id)
      .gte('rating', 3.5)
      .order('rating', { ascending: false })
      .order('response_time_minutes', { ascending: true })
      .limit(1);

    let newWorkerId = null;
    if (availableWorkers && availableWorkers.length > 0) {
      newWorkerId = availableWorkers[0].id;

      // Auto-reassign to best available worker
      const { error: reassignError } = await supabase
        .from('bookings')
        .update({
          worker_id: newWorkerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking_id);

      if (!reassignError) {
        // Log reassignment
        await supabase.from('worker_reassignments').insert({
          booking_id: booking_id,
          old_worker_id: worker_id,
          new_worker_id: newWorkerId,
          reason: 'Worker emergency: ' + emergency_reason,
          reassigned_at: new Date().toISOString(),
          reassigned_by: null
        });

        // Log to admin logs
        await supabase.from('admin_logs').insert({
          action: 'WORKER_EMERGENCY',
          resource_type: 'booking',
          resource_id: booking_id,
          details: {
            old_worker_id: worker_id,
            new_worker_id: newWorkerId,
            emergency_reason: emergency_reason
          },
          performed_by: worker_id,
          created_at: new Date().toISOString()
        });
      }
    } else {
      // No workers available - queue for manual assignment
      await supabase.from('bookings').update({
        status: 'pending_manual_assignment',
        updated_at: new Date().toISOString()
      }).eq('id', booking_id);

      // Create urgent admin notification
      await supabase.from('admin_logs').insert({
        action: 'URGENT_REASSIGNMENT_NEEDED',
        resource_type: 'booking',
        resource_id: booking_id,
        details: {
          reason: 'No workers available for emergency reassignment',
          worker_emergency: emergency_reason
        },
        performed_by: null,
        created_at: new Date().toISOString()
      });
    }

    // Get customer details for notification
    const { data: customer } = await supabase
      .from('customers')
      .select('phone, email, name')
      .eq('id', booking.customer_id)
      .single();

    // TODO: Send notifications
    // - Notify customer of worker emergency and reassignment
    // - Notify new worker if reassigned
    // - Alert admin for manual review

    return NextResponse.json(
      {
        message: 'Emergency reported successfully',
        booking_id: booking_id,
        new_worker_id: newWorkerId,
        action_taken: newWorkerId ? 'auto_reassigned' : 'queued_for_manual_assignment'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
