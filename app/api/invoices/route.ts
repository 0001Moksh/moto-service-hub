import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Fetch booking with related data
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('booking')
      .select(`
        booking_id,
        customer_id,
        shop_id,
        service_cost,
        extra_charges,
        total_cost,
        status,
        created_at,
        completed_at,
        customer:customer(customer_email, customer_name),
        shop:shop(name)
      `)
      .eq('booking_id', booking_id)
      .eq('status', 'completed')
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found or not completed' }, { status: 404 });
    }

    // Check if invoice already exists
    const { data: existingInvoice } = await supabaseAdmin
      .from('invoice')
      .select('invoice_id')
      .eq('booking_id', booking_id)
      .single();

    if (existingInvoice) {
      return NextResponse.json({
        success: true,
        invoice_id: existingInvoice.invoice_id,
        message: 'Invoice already exists'
      });
    }

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoice')
      .insert([
        {
          booking_id: booking_id,
          customer_id: booking.customer_id,
          shop_id: booking.shop_id,
          base_cost: booking.service_cost,
          extra_charges: booking.extra_charges || 0,
          total_amount: booking.total_cost,
          platform_commission: Math.round(booking.total_cost * 0.30),
          shop_commission: Math.round(booking.total_cost * 0.70),
          status: 'issued',
          issued_date: new Date().toISOString()
        }
      ])
      .select('invoice_id')
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Failed to create invoice' },
        { status: 500 }
      );
    }

    // Log invoice creation
    await supabaseAdmin.from('admin_logs').insert({
      admin_id: 'system',
      action: 'invoice_generated',
      details: {
        booking_id,
        invoice_id: invoice.invoice_id,
        total_amount: booking.total_cost
      }
    });

    console.log(`Invoice generated: ${invoice.invoice_id}`);

    return NextResponse.json({
      success: true,
      invoice_id: invoice.invoice_id,
      message: 'Invoice generated successfully'
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const bookingId = url.searchParams.get('booking_id');

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    // Fetch invoice with booking details
    const { data: invoice, error } = await supabaseAdmin
      .from('invoice')
      .select(`
        invoice_id,
        booking_id,
        base_cost,
        extra_charges,
        total_amount,
        platform_commission,
        shop_commission,
        status,
        issued_date,
        paid_date,
        payment_method,
        booking:booking(
          customer_id,
          shop_id,
          customer:customer(customer_email, customer_name),
          shop:shop(name)
        )
      `)
      .eq('booking_id', bookingId)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check access permissions
    if (payload.role === 'customer') {
      const booking = invoice.booking as any;
      if (booking.customer_id !== payload.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      invoice: {
        invoice_id: invoice.invoice_id,
        booking_id: invoice.booking_id,
        customer_name: (invoice.booking as any)?.customer?.customer_name,
        customer_email: (invoice.booking as any)?.customer?.customer_email,
        shop_name: (invoice.booking as any)?.shop?.name,
        service_name: (invoice.booking as any)?.service?.service_name,
        base_cost: invoice.base_cost,
        extra_charges: invoice.extra_charges,
        total_amount: invoice.total_amount,
        platform_commission: invoice.platform_commission,
        shop_commission: invoice.shop_commission,
        issued_date: invoice.issued_date,
        status: invoice.status,
        payment_method: invoice.payment_method,
        paid_date: invoice.paid_date,
        line_items: [
          {
            description: (invoice.booking as any)?.service?.service_name || 'Service',
            quantity: 1,
            rate: invoice.base_cost,
            amount: invoice.base_cost
          },
          ...(invoice.extra_charges > 0 ? [{
            description: 'Additional Services',
            quantity: 1,
            rate: invoice.extra_charges,
            amount: invoice.extra_charges
          }] : [])
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
