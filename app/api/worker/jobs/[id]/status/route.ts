import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyToken } from '@/lib/auth';

export async function PUT(
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
    const { status: newStatus } = await request.json();

    // Validate status
    const validStatuses = ['accepted', 'arrived', 'in-progress', 'completed'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

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

    // Validate status transition
    const statusFlow = {
      'pending': ['accepted'],
      'accepted': ['arrived', 'pending'],
      'arrived': ['in-progress', 'accepted'],
      'in-progress': ['completed', 'arrived'],
      'completed': []
    };

    const currentStatus = booking.status as keyof typeof statusFlow;
    if (!statusFlow[currentStatus]?.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${booking.status} to ${newStatus}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = { status: newStatus };
    
    // Add timestamps for status changes
    if (newStatus === 'arrived') {
      updateData.arrived_at = new Date().toISOString();
    } else if (newStatus === 'in-progress') {
      updateData.started_at = new Date().toISOString();
    } else if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    // Update booking status
    const { data, error } = await supabaseAdmin
      .from('booking')
      .update(updateData)
      .eq('booking_id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to update job status' }, { status: 500 });
    }

    // Update worker performance metrics
    if (newStatus === 'completed') {
      await updateWorkerMetrics(payload.userId, bookingId);
    }

    // TODO: Send notifications to customer based on status
    // const notifications = {
    //   'arrived': 'Worker has arrived at the shop',
    //   'in-progress': 'Service is now in progress',
    //   'completed': 'Service completed! Please rate your experience'
    // };
    // if (notifications[newStatus]) {
    //   await sendCustomerNotification(booking.customer_id, notifications[newStatus]);
    // }

    return NextResponse.json({
      success: true,
      message: `Job status updated to ${newStatus}`,
      booking: data,
    });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updateWorkerMetrics(workerId: string, bookingId: string) {
  try {
    // Get job details for this booking
    const { data: booking } = await supabaseAdmin
      .from('booking')
      .select('started_at, completed_at, estimated_duration, customer_rating')
      .eq('booking_id', bookingId)
      .single();

    if (!booking) return;

    // Calculate actual duration
    const actualDuration = booking.started_at && booking.completed_at
      ? Math.round((new Date(booking.completed_at).getTime() - new Date(booking.started_at).getTime()) / 60000)
      : booking.estimated_duration;

    // Get current worker metrics
    const { data: worker } = await supabaseAdmin
      .from('worker')
      .select('total_jobs, completed_jobs, total_service_time, revenue')
      .eq('worker_id', workerId)
      .single();

    if (!worker) return;

    // Update worker metrics
    const newCompletedJobs = (worker.completed_jobs || 0) + 1;
    const newTotalServiceTime = (worker.total_service_time || 0) + actualDuration;
    const averageServiceTime = newTotalServiceTime / newCompletedJobs;

    // Update performance score based on rating (if provided)
    let performanceScore = 0;
    if (booking.customer_rating) {
      // Simple formula: rating * 20 + completion time bonus
      const timeBonus = actualDuration <= booking.estimated_duration ? 20 : 0;
      performanceScore = (booking.customer_rating * 20) + timeBonus;
    }

    await supabaseAdmin
      .from('worker')
      .update({
        completed_jobs: newCompletedJobs,
        total_service_time: newTotalServiceTime,
        performance_score: performanceScore,
        updated_at: new Date().toISOString(),
      })
      .eq('worker_id', workerId);
  } catch (error) {
    console.error('Error updating worker metrics:', error);
    // Don't throw - this is non-critical
  }
}
