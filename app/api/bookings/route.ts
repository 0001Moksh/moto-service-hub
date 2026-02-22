import { supabaseAdmin } from '@/lib/supabase'
import { logAuditEvent } from '@/lib/supabase-helpers'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      shop_id,
      customer_id,
      vehicle_id,
      booking_date,
      booking_time,
      description,
      service_ids, // Array of service IDs to add to booking
    } = body

    if (!shop_id || !customer_id || !vehicle_id || !booking_date || !booking_time) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify shop, customer, and vehicle exist
    const { data: shop } = await supabaseAdmin
      .from('shops')
      .select('id')
      .eq('id', shop_id)
      .single()

    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .single()

    const { data: vehicle } = await supabaseAdmin
      .from('vehicles')
      .select('id')
      .eq('id', vehicle_id)
      .eq('customer_id', customer_id)
      .single()

    if (!shop || !customer || !vehicle) {
      return Response.json(
        { error: 'Invalid shop, customer, or vehicle' },
        { status: 400 }
      )
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        shop_id,
        customer_id,
        vehicle_id,
        booking_date,
        booking_time,
        description: description || '',
        status: 'pending',
      })
      .select()

    if (bookingError) throw bookingError

    if (!booking?.[0]) {
      throw new Error('Failed to create booking')
    }

    const bookingId = booking[0].id

    // Add services to booking
    if (service_ids && Array.isArray(service_ids)) {
      const bookingServices = await Promise.all(
        service_ids.map(async (serviceId: string) => {
          const { data: service } = await supabaseAdmin
            .from('services')
            .select('base_price')
            .eq('id', serviceId)
            .single()

          return {
            booking_id: bookingId,
            service_id: serviceId,
            price_charged: service?.base_price || 0,
            quantity: 1,
          }
        })
      )

      const { error: servicesError } = await supabaseAdmin
        .from('booking_services')
        .insert(bookingServices)

      if (servicesError) throw servicesError
    }

    // Calculate estimated cost
    let estimatedCost = 0
    if (service_ids && Array.isArray(service_ids)) {
      const { data: services } = await supabaseAdmin
        .from('services')
        .select('base_price')
        .in('id', service_ids)

      estimatedCost = services?.reduce((sum, s) => sum + (s.base_price || 0), 0) || 0
    }

    // Update booking with estimated cost
    await supabaseAdmin
      .from('bookings')
      .update({ estimated_cost: estimatedCost })
      .eq('id', bookingId)

    // Log audit event
    await logAuditEvent(
      'booking',
      bookingId,
      shop_id,
      'CREATE_BOOKING',
      null,
      { customer_id, vehicle_id, booking_date, status: 'pending' }
    )

    return Response.json(
      {
        message: 'Booking created successfully',
        booking: {
          id: bookingId,
          shop_id,
          customer_id,
          vehicle_id,
          booking_date,
          booking_time,
          status: 'pending',
          estimated_cost: estimatedCost,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Booking creation error:', error)
    return Response.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('id')
    const shopId = searchParams.get('shop_id')
    const customerId = searchParams.get('customer_id')

    if (!bookingId && !shopId && !customerId) {
      return Response.json(
        { error: 'Provide id, shop_id, or customer_id' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin.from('bookings').select(`
      *,
      shops(name, address, phone_number),
      customers(name, phone_number, email),
      vehicles(registration_number, make, model),
      workers(name, phone_number),
      booking_services(
        *,
        services(name, base_price)
      )
    `)

    if (bookingId) {
      query = query.eq('id', bookingId).single()
    } else if (shopId) {
      query = query.eq('shop_id', shopId).order('booking_date', { ascending: false })
    } else if (customerId) {
      query = query.eq('customer_id', customerId).order('booking_date', { ascending: false })
    }

    const { data, error } = await query

    if (error) throw error

    return Response.json({ data })
  } catch (error: any) {
    console.error('Fetch bookings error:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}
