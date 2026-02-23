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

    if (!payload || payload.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const bookingId = id;

    // Fetch cancellation record
    const { data: cancellation, error } = await supabaseAdmin
      .from('cancellation_record')
      .select(`
        cancellation_id,
        booking_id,
        cancelled_at,
        tokens_deducted,
        refund_amount,
        reason
      `)
      .eq('booking_id', bookingId)
      .eq('customer_id', payload.id)
      .single();

    if (error || !cancellation) {
      return NextResponse.json({ error: 'Cancellation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      cancellation: {
        cancellation_id: cancellation.cancellation_id,
        booking_id: cancellation.booking_id,
        cancelled_at: cancellation.cancelled_at,
        tokens_deducted: cancellation.tokens_deducted,
        refund_amount: cancellation.refund_amount,
        reason: cancellation.reason
      }
    });
  } catch (error) {
    console.error('Error fetching cancellation details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
