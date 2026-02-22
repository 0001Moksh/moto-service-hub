import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { completed_at, notes } = body;

    if (!completed_at) {
      return NextResponse.json({ error: 'Completion time is required' }, { status: 400 });
    }

    // Get the booking_id from the URL
    const url = new URL(request.url);
    const bookingId = url.pathname.split('/')[3];

    // Verify booking exists
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('booking')
      .select(`
        booking_id,
        status,
        service_cost,
        extra_charges,
        customer_id,
        shop_id,
        started_at,
        service:service(service_name)
      `)
      .eq('booking_id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'started') {
      return NextResponse.json(
        { error: `Cannot complete service. Status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Calculate service duration
    const startTime = new Date(booking.started_at).getTime();
    const endTime = new Date(completed_at).getTime();
    const durationMinutes = Math.round((endTime - startTime) / 60000);

    // Calculate total cost
    const totalCost = (booking.service_cost || 0) + (booking.extra_charges || 0);

    // Update booking status to completed
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('booking')
      .update({
        status: 'completed',
        completed_at: new Date(completed_at).toISOString(),
        service_duration_minutes: durationMinutes,
        total_cost: totalCost,
        notes: notes || ''
      })
      .eq('booking_id', bookingId)
      .select('booking_id')
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Failed to complete service' },
        { status: 500 }
      );
    }

    // Generate invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoice')
      .insert([
        {
          booking_id: bookingId,
          customer_id: booking.customer_id,
          shop_id: booking.shop_id,
          base_cost: booking.service_cost,
          extra_charges: booking.extra_charges || 0,
          total_amount: totalCost,
          platform_commission: Math.round(totalCost * 0.30),
          shop_commission: Math.round(totalCost * 0.70),
          status: 'issued',
          issued_date: new Date().toISOString()
        }
      ])
      .select('invoice_id')
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
    }

    // Log completion
    await supabaseAdmin.from('admin_logs').insert({
      admin_id: 'system',
      action: 'service_completed',
      details: {
        booking_id: bookingId,
        total_cost: totalCost,
        duration_minutes: durationMinutes,
        invoice_id: invoice?.invoice_id
      }
    });

    // TODO: Send SMS/Email with invoice to customer
    console.log(`Service completed: ${bookingId}, Invoice: ${invoice?.invoice_id}`);

    return NextResponse.json({
      success: true,
      booking_id: updated.booking_id,
      invoice_id: invoice?.invoice_id,
      total_cost: totalCost,
      message: 'Service completed successfully'
    });
  } catch (error) {
    console.error('Error completing service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
