import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
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

    // Verify booking belongs to customer
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('booking')
      .select('booking_id, status, customer_id')
      .eq('booking_id', booking_id)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.customer_id !== payload.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot confirm booking with status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Update booking status to confirmed
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('booking')
      .update({ status: 'confirmed' })
      .eq('booking_id', booking_id)
      .select('booking_id')
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Failed to confirm booking' },
        { status: 500 }
      );
    }

    // Log booking confirmation action
    await supabaseAdmin.from('admin_logs').insert({
      admin_id: 'system',
      action: 'booking_confirmed',
      details: {
        booking_id,
        customer_id: payload.id,
        confirmed_at: new Date().toISOString()
      }
    });

    // TODO: Send SMS/Email notification to customer
    console.log(`Booking confirmed: ${booking_id}`);

    return NextResponse.json({
      success: true,
      booking_id: updated.booking_id,
      message: 'Booking confirmed successfully'
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
