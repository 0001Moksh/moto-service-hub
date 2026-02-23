import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AvailableWorker {
  id: string;
  name: string;
  rating: number;
  phone: string;
  response_time_minutes: number;
  distance_from_shop?: number;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as any;

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');
    const excludeWorkerId = searchParams.get('exclude_worker_id');
    const minRating = parseFloat(searchParams.get('min_rating') || '3.5');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!shopId) {
      return NextResponse.json({ error: 'shop_id is required' }, { status: 400 });
    }

    // Build query with all filters
    let query = supabase
      .from('workers')
      .select('id, name, rating, phone, response_time_minutes, distance_from_shop, is_available')
      .eq('shop_id', shopId)
      .eq('is_available', true)
      .gte('rating', minRating);

    // Exclude specific worker if provided
    if (excludeWorkerId) {
      query = query.neq('id', excludeWorkerId);
    }

    // Sort by rating (highest first), then response time (lowest first)
    const { data: workers, error } = await query
      .order('rating', { ascending: false })
      .order('response_time_minutes', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching workers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch available workers' },
        { status: 500 }
      );
    }

    // Transform response
    const availableWorkers: AvailableWorker[] = workers.map((w: any) => ({
      id: w.id,
      name: w.name,
      rating: w.rating,
      phone: w.phone_number || 'N/A',
      response_time_minutes: w.response_time_minutes,
      distance_from_shop: w.distance_from_shop
    }));

    return NextResponse.json(
      {
        workers: availableWorkers,
        total_available: availableWorkers.length,
        best_worker_id: availableWorkers.length > 0 ? availableWorkers[0].id : null
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as any;

    // Only admin or system can use POST to update worker availability
    if (payload.role !== 'admin' && payload.role !== 'system') {
      return NextResponse.json(
        { error: 'Only admin can update worker availability' },
        { status: 403 }
      );
    }

    const { worker_id, is_available, unavailable_reason } = await request.json();

    if (!worker_id) {
      return NextResponse.json({ error: 'worker_id is required' }, { status: 400 });
    }

    // Update worker availability
    const { error } = await supabase
      .from('workers')
      .update({
        is_available: is_available,
        unavailable_reason: unavailable_reason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', worker_id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update worker availability' },
        { status: 500 }
      );
    }

    // If marking unavailable, find and trigger reassignments for pending bookings
    if (!is_available) {
      const { data: pendingBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('worker_id', worker_id)
        .in('status', ['pending', 'confirmed', 'assigned']);

      for (const booking of pendingBookings || []) {
        // Find alternative worker
        const { data: altWorkers } = await supabase
          .from('workers')
          .select('id, name, rating')
          .eq('shop_id', booking.shop_id)
          .eq('is_available', true)
          .neq('id', worker_id)
          .gte('rating', 3.5)
          .order('rating', { ascending: false })
          .limit(1);

        if (altWorkers && altWorkers.length > 0) {
          // Reassign to alternative
          await supabase
            .from('bookings')
            .update({ worker_id: altWorkers[0].id })
            .eq('id', booking.id);

          // Log reassignment
          await supabase.from('worker_reassignments').insert({
            booking_id: booking.id,
            old_worker_id: worker_id,
            new_worker_id: altWorkers[0].id,
            reason: 'Worker became unavailable: ' + (unavailable_reason || 'Unknown'),
            reassigned_at: new Date().toISOString(),
            reassigned_by: payload.id
          });
        } else {
          // Queue for manual assignment
          await supabase
            .from('bookings')
            .update({ status: 'pending_manual_assignment' })
            .eq('id', booking.id);
        }
      }
    }

    return NextResponse.json(
      { message: 'Worker availability updated' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
