import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getDateRange(range: string) {
  const endDate = new Date();
  const startDate = new Date();

  if (range === '7d') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === '30d') {
    startDate.setDate(startDate.getDate() - 30);
  } else if (range === '90d') {
    startDate.setDate(startDate.getDate() - 90);
  }

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as any;

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Only admin can access' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const dateRange = getDateRange(range);

    // Get all customers
    const { data: allCustomers, count: totalCustomers } = await supabase
      .from('customers')
      .select('id, name, email, total_spent', { count: 'exact' });

    // Get new customers this month
    const monthStart = new Date();
    monthStart.setDate(1);
    const { count: newCustomersCount } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString().split('T')[0]);

    // Get booking history for all customers
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('customer_id, status, created_at')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    const customerBookingMap = new Map<string, number>();
    const returningCustomers = new Set<string>();

    allBookings?.forEach((booking) => {
      customerBookingMap.set(
        booking.customer_id,
        (customerBookingMap.get(booking.customer_id) || 0) + 1
      );
    });

    // Mark returning customers (more than 1 booking)
    customerBookingMap.forEach((count, customerId) => {
      if (count > 1) {
        returningCustomers.add(customerId);
      }
    });

    const averageBookingsPerCustomer =
      totalCustomers && totalCustomers > 0
        ? (allBookings?.length || 0) / totalCustomers
        : 0;

    // Get cancellation rate
    const { count: cancelledBookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'cancelled')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    const cancellationRate =
      allBookings && allBookings.length > 0
        ? ((cancelledBookings || 0) / allBookings.length) * 100
        : 0;

    // Get top customer by spending
    const { data: topSpenders } = await supabase
      .from('customers')
      .select('id, name, total_spent')
      .order('total_spent', { ascending: false })
      .limit(1);

    // Get top customer by bookings
    let topCustomer = null;
    if (topSpenders && topSpenders.length > 0) {
      const { data: topBookings } = await supabase
        .from('bookings')
        .select('id', { count: 'exact' })
        .eq('customer_id', topSpenders[0].id);

      topCustomer = {
        name: topSpenders[0].name,
        total_bookings: topBookings?.length || 0,
        total_spent: topSpenders[0].total_spent || 0
      };
    }

    // Booking frequency distribution
    const frequencyMap = new Map<string, number>();
    customerBookingMap.forEach((count) => {
      if (count === 1) {
        frequencyMap.set('1 booking', (frequencyMap.get('1 booking') || 0) + 1);
      } else if (count <= 5) {
        frequencyMap.set('2-5 bookings', (frequencyMap.get('2-5 bookings') || 0) + 1);
      } else if (count <= 10) {
        frequencyMap.set('6-10 bookings', (frequencyMap.get('6-10 bookings') || 0) + 1);
      } else {
        frequencyMap.set('10+ bookings', (frequencyMap.get('10+ bookings') || 0) + 1);
      }
    });

    const bookingFrequency = Array.from(frequencyMap.entries()).map(([range, customers]) => ({
      range,
      customers
    }));

    // Service preferences
    const { data: serviceBookings } = await supabase
      .from('bookings')
      .select('service:services(name)')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    const serviceMap = new Map<string, number>();
    const customerServiceMap = new Map<string, Set<string>>();

    serviceBookings?.forEach((booking: any) => {
      const serviceName = booking.service?.name || 'Unknown';
      serviceMap.set(serviceName, (serviceMap.get(serviceName) || 0) + 1);
    });

    const totalServiceBookings = serviceBookings?.length || 1;
    const servicePreferences = Array.from(serviceMap.entries())
      .map(([service, count]) => ({
        service,
        customers: count,
        percentage: (count / totalServiceBookings) * 100
      }))
      .sort((a, b) => b.customers - a.customers);

    // Location distribution (based on shop locations)
    const { data: shopBookings } = await supabase
      .from('bookings')
      .select('shop:shops(id, name, location)')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    const locationMap = new Map<string, number>();
    shopBookings?.forEach((booking: any) => {
      const location = booking.shop?.location || 'Unknown';
      locationMap.set(location, (locationMap.get(location) || 0) + 1);
    });

    const totalLocations = shopBookings?.length || 1;
    const locationDistribution = Array.from(locationMap.entries())
      .map(([location, customers]) => ({
        location,
        customers,
        percentage: (customers / totalLocations) * 100
      }))
      .sort((a, b) => b.customers - a.customers);

    const analytics = {
      metrics: {
        total_customers: totalCustomers || 0,
        new_customers_this_month: newCustomersCount || 0,
        returning_customers: returningCustomers.size,
        average_bookings_per_customer: Math.round(averageBookingsPerCustomer * 100) / 100,
        total_spent_average: allCustomers
          ? allCustomers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / allCustomers.length
          : 0,
        cancellation_rate: Math.round(cancellationRate * 100) / 100,
        top_customer: topCustomer
      },
      booking_frequency: bookingFrequency,
      service_preferences: servicePreferences,
      location_distribution: locationDistribution
    };

    return NextResponse.json({ analytics }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
