import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Extract and verify token
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Missing authentication token' }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload || payload.role !== 'worker') {
      return NextResponse.json({ error: 'Unauthorized: Worker access required' }, { status: 403 });
    }

    // Fetch worker availability
    const { data: availability, error: availError } = await supabaseAdmin
      .from('worker_availability')
      .select('*')
      .eq('worker_id', payload.userId)
      .single();

    if (availError) {
      // Return default availability if not found
      return NextResponse.json({
        success: true,
        availability: {
          worker_id: payload.userId,
          is_available: true,
          working_hours_start: '09:00',
          working_hours_end: '18:00',
          total_slots: 8,
          available_slots: 8,
        },
      });
    }

    // Calculate available slots based on current bookings
    const { data: activeBookings } = await supabaseAdmin
      .from('booking')
      .select('booking_id')
      .eq('worker_id', payload.userId)
      .in('status', ['accepted', 'arrived', 'in-progress']);

    const availableSlots = Math.max(0, (availability.total_slots || 8) - (activeBookings?.length || 0));

    return NextResponse.json({
      success: true,
      availability: {
        worker_id: availability.worker_id,
        is_available: availability.is_available,
        working_hours_start: availability.working_hours_start,
        working_hours_end: availability.working_hours_end,
        total_slots: availability.total_slots,
        available_slots: availableSlots,
      },
    });
  } catch (error) {
    console.error('Availability fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Extract and verify token
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Missing authentication token' }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload || payload.role !== 'worker') {
      return NextResponse.json({ error: 'Unauthorized: Worker access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      is_available,
      working_hours_start,
      working_hours_end,
      total_slots,
    } = body;

    // Validate input
    if (typeof is_available !== 'boolean') {
      return NextResponse.json({ error: 'is_available must be a boolean' }, { status: 400 });
    }

    // Check if worker has existing availability record
    const { data: existing } = await supabaseAdmin
      .from('worker_availability')
      .select('worker_id')
      .eq('worker_id', payload.userId)
      .single();

    let result;
    if (existing) {
      // Update existing record
      result = await supabaseAdmin
        .from('worker_availability')
        .update({
          is_available,
          ...(working_hours_start && { working_hours_start }),
          ...(working_hours_end && { working_hours_end }),
          ...(total_slots && { total_slots }),
          updated_at: new Date().toISOString(),
        })
        .eq('worker_id', payload.userId)
        .select()
        .single();
    } else {
      // Create new record
      result = await supabaseAdmin
        .from('worker_availability')
        .insert({
          worker_id: payload.userId,
          is_available,
          working_hours_start: working_hours_start || '09:00',
          working_hours_end: working_hours_end || '18:00',
          total_slots: total_slots || 8,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Update error:', result.error);
      return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully',
      availability: result.data,
    });
  } catch (error) {
    console.error('Availability update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
