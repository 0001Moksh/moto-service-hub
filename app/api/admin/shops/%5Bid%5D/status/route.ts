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

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id: shopId } = await params;
    const { status: newStatus } = await request.json();

    // Validate status
    const validStatuses = ['active', 'paused', 'suspended'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check if shop exists
    const { data: shop, error: fetchError } = await supabaseAdmin
      .from('shop')
      .select('shop_id, name')
      .eq('shop_id', shopId)
      .single();

    if (fetchError || !shop) {
      console.error('Shop fetch error:', fetchError);
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Note: The shop table doesn't currently have a status column.
    // Storing status in admin_logs for audit trail instead.
    // To permanently support status, add status column to shop table migration.
    
    const { data, error } = await supabaseAdmin
      .from('admin_logs')
      .insert({
        admin_id: payload.userId,
        action: 'shop_status_change',
        shop_id: shopId,
        details: {
          shop_name: shop.name,
          new_status: newStatus,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Log error:', error);
      return NextResponse.json({ error: 'Failed to update shop status' }, { status: 500 });
    }

    // TODO: Send notification to shop owner
    // await sendShopOwnerNotification(shop.owner_id, `Your shop has been ${newStatus}`);

    return NextResponse.json({
      success: true,
      message: `Shop status updated to ${newStatus}`,
      shop: data,
    });
  } catch (error) {
    console.error('Shop status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
