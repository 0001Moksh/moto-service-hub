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

    // Get or create customer token record
    let { data: tokenRecord, error: fetchError } = await supabaseAdmin
      .from('customer_cancellation_tokens')
      .select('tokens_available, tokens_used, last_reset_date')
      .eq('customer_id', payload.id)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // Record doesn't exist, create it
      const { data: newRecord, error: createError } = await supabaseAdmin
        .from('customer_cancellation_tokens')
        .insert([
          {
            customer_id: payload.id,
            tokens_available: 3,
            tokens_used: 0,
            last_reset_date: new Date().toISOString()
          }
        ])
        .select('tokens_available, tokens_used, last_reset_date')
        .single();

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to initialize tokens' },
          { status: 500 }
        );
      }
      tokenRecord = newRecord;
    }

    // Check if month has changed and reset tokens
    const lastReset = new Date(tokenRecord.last_reset_date);
    const today = new Date();
    if (lastReset.getMonth() !== today.getMonth() || lastReset.getFullYear() !== today.getFullYear()) {
      // Reset tokens
      const { data: updated } = await supabaseAdmin
        .from('customer_cancellation_tokens')
        .update({
          tokens_available: 3,
          tokens_used: 0,
          last_reset_date: new Date().toISOString()
        })
        .eq('customer_id', payload.id)
        .select('tokens_available, tokens_used')
        .single();

      if (updated) {
        tokenRecord = updated;
      }
    }

    // Get consecutive cancellations count
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const { data: cancellations, error: cancelError } = await supabaseAdmin
      .from('cancellation_record')
      .select('cancellation_id')
      .eq('customer_id', payload.id)
      .gte('cancelled_at', startOfMonth.toISOString())
      .order('cancelled_at', { ascending: false });

    const consecutiveCancellations = cancellations?.length || 0;

    return NextResponse.json({
      success: true,
      tokens: {
        tokens_available: tokenRecord.tokens_available,
        tokens_used: tokenRecord.tokens_used,
        consecutive_cancellations: consecutiveCancellations
      }
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
