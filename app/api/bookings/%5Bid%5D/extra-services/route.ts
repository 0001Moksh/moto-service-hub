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
    const { extra_services, notes } = body;

    if (!extra_services || !Array.isArray(extra_services)) {
      return NextResponse.json({ error: 'Extra services array is required' }, { status: 400 });
    }

    // Get the booking_id from the URL
    const url = new URL(request.url);
    const bookingId = url.pathname.split('/')[3];

    // Verify booking exists
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('booking')
      .select('booking_id, status, service_cost, shop_id')
      .eq('booking_id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Fetch extra service costs
    const { data: extraServices, error: serviceError } = await supabaseAdmin
      .from('service')
      .select('service_id, base_cost')
      .in('service_id', extra_services)
      .eq('shop_id', booking.shop_id);

    if (serviceError || !extraServices) {
      return NextResponse.json(
        { error: 'Failed to fetch extra services' },
        { status: 500 }
      );
    }

    const totalExtraCharges = extraServices.reduce((sum, s) => sum + (s.base_cost || 0), 0);

    // Update booking with extra charges and notes
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('booking')
      .update({
        extra_charges: totalExtraCharges,
        total_cost: booking.service_cost + totalExtraCharges,
        notes: notes || ''
      })
      .eq('booking_id', bookingId)
      .select('booking_id')
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Failed to add extra services' },
        { status: 500 }
      );
    }

    // Log the extra services addition
    await supabaseAdmin.from('admin_logs').insert({
      admin_id: 'system',
      action: 'extra_services_added',
      details: {
        booking_id: bookingId,
        extra_service_ids: extra_services,
        total_extra_charges: totalExtraCharges
      }
    });

    console.log(`Extra services added to booking: ${bookingId}`);

    return NextResponse.json({
      success: true,
      booking_id: updated.booking_id,
      extra_charges: totalExtraCharges,
      message: `Added ${extra_services.length} extra service(s)`
    });
  } catch (error) {
    console.error('Error adding extra services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
