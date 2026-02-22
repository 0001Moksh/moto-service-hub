import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload || payload.role !== 'worker') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { started_at } = body;

    if (!started_at) {
      return NextResponse.json({ error: 'Started time is required' }, { status: 400 });
    }

    // Get the booking_id from the URL
    const url = new URL(request.url);
    const bookingId = url.pathname.split('/')[3];

    // Verify booking exists and is assigned to this worker
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('booking')
      .select('booking_id, worker_id, status')
      .eq('booking_id', bookingId)
      .eq('worker_id', payload.id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'assigned') {
      return NextResponse.json(
        { error: `Cannot start service. Booking status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Update booking status to started
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('booking')
      .update({
        status: 'started',
        started_at: new Date(started_at).toISOString(),
        estimated_completion_time: new Date(Date.now() + 30 * 60000).toISOString()
      })
      .eq('booking_id', bookingId)
      .select('booking_id')
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Failed to start service' },
        { status: 500 }
      );
    }

    // Log action
    await supabaseAdmin.from('admin_logs').insert({
      admin_id: 'system',
      action: 'service_started',
      details: {
        booking_id: bookingId,
        worker_id: payload.id,
        started_at
      }
    });

    // TODO: Send SMS/Email to customer that service started
    console.log(`Service started: ${bookingId}`);

    return NextResponse.json({
      success: true,
      booking_id: updated.booking_id,
      message: 'Service started successfully'
    });
  } catch (error) {
    console.error('Error starting service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
