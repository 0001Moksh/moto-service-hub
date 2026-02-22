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

    const url = new URL(request.url);
    const bookingId = url.pathname.split('/')[3];

    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 });
    }

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('booking')
      .select('booking_id, status, service_cost, scheduled_at, started_at')
      .eq('booking_id', bookingId)
      .eq('customer_id', payload.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking already cancelled' }, { status: 400 });
    }

    // Get customer token balance
    let { data: tokenRecord } = await supabaseAdmin
      .from('customer_cancellation_tokens')
      .select('tokens_available')
      .eq('customer_id', payload.id)
      .single();

    if (!tokenRecord) {
      // Initialize tokens
      const { data: newRecord } = await supabaseAdmin
        .from('customer_cancellation_tokens')
        .insert([
          {
            customer_id: payload.id,
            tokens_available: 3,
            tokens_used: 0,
            last_reset_date: new Date().toISOString()
          }
        ])
        .select('tokens_available')
        .single();
      tokenRecord = newRecord;
    }

    // Get number of cancellations this month
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const { data: cancellations } = await supabaseAdmin
      .from('cancellation_record')
      .select('cancellation_id')
      .eq('customer_id', payload.id)
      .gte('cancelled_at', startOfMonth.toISOString());

    const consecutiveCancellations = cancellations?.length || 0;
    const tokenPenalty = consecutiveCancellations >= 1 ? 2 : 1;

    // Check if customer has enough tokens
    if (tokenRecord.tokens_available < tokenPenalty) {
      return NextResponse.json(
        { error: `Not enough tokens. Need ${tokenPenalty}, have ${tokenRecord.tokens_available}` },
        { status: 400 }
      );
    }

    // Calculate refund based on timing and status
    let refundPercentage = 100;
    if (booking.scheduled_at) {
      const minutesToService = (new Date(booking.scheduled_at).getTime() - Date.now()) / 60000;
      if (minutesToService > 60) refundPercentage = 100;
      else if (minutesToService > 30) refundPercentage = 75;
      else if (minutesToService > 0) refundPercentage = 50;
    } else if (booking.status === 'assigned') {
      refundPercentage = 50;
    } else if (booking.status === 'started') {
      refundPercentage = 0;
    }

    const refundAmount = Math.round(booking.service_cost * (refundPercentage / 100));

    // Create cancellation record
    const { data: cancellation, error: cancelError } = await supabaseAdmin
      .from('cancellation_record')
      .insert([
        {
          customer_id: payload.id,
          booking_id: bookingId,
          cancelled_at: new Date().toISOString(),
          tokens_deducted: tokenPenalty,
          refund_amount: refundAmount,
          refund_percentage: refundPercentage,
          reason
        }
      ])
      .select('cancellation_id')
      .single();

    if (cancelError || !cancellation) {
      return NextResponse.json(
        { error: 'Failed to process cancellation' },
        { status: 500 }
      );
    }

    // Update booking status
    await supabaseAdmin
      .from('booking')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_id: cancellation.cancellation_id
      })
      .eq('booking_id', bookingId);

    // Deduct tokens
    await supabaseAdmin
      .from('customer_cancellation_tokens')
      .update({
        tokens_available: tokenRecord.tokens_available - tokenPenalty,
        tokens_used: (await supabaseAdmin
          .from('customer_cancellation_tokens')
          .select('tokens_used')
          .eq('customer_id', payload.id)
          .single()).data?.tokens_used || 0 + tokenPenalty
      })
      .eq('customer_id', payload.id);

    // Log action
    await supabaseAdmin.from('admin_logs').insert({
      admin_id: 'system',
      action: 'booking_cancelled',
      details: {
        booking_id: bookingId,
        customer_id: payload.id,
        tokens_deducted: tokenPenalty,
        refund_amount: refundAmount,
        reason
      }
    });

    // TODO: Send SMS/Email with cancellation and refund details
    console.log(`Booking cancelled: ${bookingId}, Refund: ₹${refundAmount}`);

    return NextResponse.json({
      success: true,
      cancellation_id: cancellation.cancellation_id,
      booking_id: bookingId,
      tokens_deducted: tokenPenalty,
      refund_amount: refundAmount,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error processing cancellation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
