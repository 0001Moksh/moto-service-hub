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
    const { bike_id, shop_id, service_id, customer_id } = body;

    if (!bike_id || !shop_id || !service_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify bike belongs to customer
    const { data: bikeData, error: bikeError } = await supabaseAdmin
      .from('bike')
      .select('bike_id')
      .eq('bike_id', bike_id)
      .eq('customer_id', customer_id)
      .single();

    if (bikeError || !bikeData) {
      return NextResponse.json({ error: 'Bike not found' }, { status: 404 });
    }

    // Verify service exists at shop
    const { data: serviceData, error: serviceError } = await supabaseAdmin
      .from('service')
      .select('service_id, service_name, base_cost, estimated_time')
      .eq('service_id', service_id)
      .eq('shop_id', shop_id)
      .single();

    if (serviceError || !serviceData) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Create booking
    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from('booking')
      .insert([
        {
          customer_id,
          bike_id,
          shop_id,
          service_id,
          status: 'pending',
          service_cost: serviceData.base_cost,
          created_at: new Date().toISOString()
        }
      ])
      .select('booking_id')
      .single();

    if (bookingError || !bookingData) {
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Send notification (SMS/Email) - TODO: Implement notification system
    console.log(`Booking created: ${bookingData.booking_id}`);

    return NextResponse.json({
      success: true,
      booking_id: bookingData.booking_id,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
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

    if (!payload || payload.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: bookings, error } = await supabaseAdmin
      .from('booking')
      .select(`
        booking_id,
        customer_id,
        bike_id,
        shop_id,
        service_id,
        status,
        service_cost,
        created_at,
        started_at,
        completed_at,
        bike:bike(model),
        shop:shop(name)
      `)
      .eq('customer_id', payload.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookings: bookings || [],
      totalBookings: bookings?.length || 0
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
