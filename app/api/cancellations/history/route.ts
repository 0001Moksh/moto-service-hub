import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload || payload.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch cancellation history
    const { data: cancellations, error } = await supabaseAdmin
      .from('cancellation_record')
      .select(`
        cancellation_id,
        booking_id,
        cancelled_at,
        tokens_deducted,
        refund_amount,
        reason,
        booking:booking_id (
          booking_id
        )
      `)
      .eq('customer_id', payload.id)
      .order('cancelled_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch cancellation history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cancellations: cancellations || [],
      totalCancellations: cancellations?.length || 0
    });
  } catch (error) {
    console.error('Error fetching cancellation history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
