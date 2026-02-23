import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const invoiceId = id;

    // Fetch invoice details
    const { data: invoice, error } = await supabaseAdmin
      .from('invoice')
      .select(`
        invoice_id,
        booking_id,
        customer_id,
        shop_id,
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
          shop:shop(name),
          service:service(service_name)
        )
      `)
      .eq('invoice_id', invoiceId)
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
