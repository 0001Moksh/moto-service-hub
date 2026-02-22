import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload || payload.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Fetch booking with related data
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('booking')
      .select(`
        booking_id,
        shop_id,
        customer_id,
        status,
        service_cost
      `)
      .eq('booking_id', booking_id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.customer_id !== payload.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: `Cannot assign worker. Booking status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Find available workers for the shop
    const { data: workers, error: workerError } = await supabaseAdmin
      .from('worker')
      .select(`
        worker_id,
        worker_name,
        rating,
        phone,
        latitude,
        longitude,
        is_available,
        shop_id
      `)
      .eq('shop_id', booking.shop_id)
      .eq('is_available', true)
      .order('rating', { ascending: false })
      .limit(5);

    if (workerError || !workers || workers.length === 0) {
      // No workers available, keep booking as confirmed
      return NextResponse.json({
        success: true,
        booking_id,
        message: 'Booking confirmed but no workers available yet. Will auto-assign when available.',
        worker_assigned: false
      });
    }

    // Select the first available worker (highest rated)
    const selectedWorker = workers[0];

    // Update booking with assigned worker and status
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('booking')
      .update({
        worker_id: selectedWorker.worker_id,
        status: 'assigned',
        estimated_completion_time: new Date(Date.now() + 30 * 60000).toISOString() // 30 min estimate
      })
      .eq('booking_id', booking_id)
      .select('booking_id')
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Failed to assign worker' },
        { status: 500 }
      );
    }

    // Log assignment action
    await supabaseAdmin.from('admin_logs').insert({
      admin_id: 'system',
      action: 'worker_assigned',
      details: {
        booking_id,
        worker_id: selectedWorker.worker_id,
        shop_id: booking.shop_id,
        assigned_at: new Date().toISOString()
      }
    });

    // TODO: Send SMS/Email to customer about assigned worker
    // TODO: Send SMS/Email to worker about new booking
    console.log(`Worker assigned to booking: ${booking_id} -> ${selectedWorker.worker_id}`);

    return NextResponse.json({
      success: true,
      booking_id: updated.booking_id,
      worker_assigned: true,
      worker: {
        worker_id: selectedWorker.worker_id,
        worker_name: selectedWorker.worker_name,
        rating: selectedWorker.rating,
        phone: selectedWorker.phone
      },
      message: 'Worker assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning worker:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
