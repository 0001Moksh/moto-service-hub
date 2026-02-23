import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const bookingId = id;

    // First, check if booking exists and is assigned to this worker
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('booking')
      .select('booking_id, status, worker_id')
      .eq('booking_id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify worker assignment
    if (booking.worker_id !== payload.userId) {
      return NextResponse.json({ error: 'Not assigned to this booking' }, { status: 403 });
    }

    // Check if job is still pending
    if (booking.status !== 'pending') {
      return NextResponse.json({ error: `Cannot accept job with status: ${booking.status}` }, { status: 400 });
    }

    // Update booking status to 'accepted'
    const { data, error } = await supabaseAdmin
      .from('booking')
      .update({ status: 'accepted' })
      .eq('booking_id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to accept job' }, { status: 500 });
    }

    // TODO: Send notification to customer
    // await sendCustomerNotification(booking.customer_id, 'Worker accepted your booking');

    return NextResponse.json({
      success: true,
      message: 'Job accepted successfully',
      booking: data,
    });
  } catch (error) {
    console.error('Accept job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
