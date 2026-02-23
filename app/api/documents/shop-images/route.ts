import { NextRequest, NextResponse } from 'next/server';
import { oneDriveService } from '@/lib/onedrive';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * API Route: Upload Shop Image
 * POST /api/documents/shop-images
 * 
 * Body: FormData with:
 * - file: File (image)
 * - shopId: number
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload || payload.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only shop owners can upload images' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const shopId = parseInt(formData.get('shopId') as string);

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: shop } = await supabaseAdmin
      .from('shop')
      .select('owner_id')
      .eq('shop_id', shopId)
      .single();

    if (!shop || shop.owner_id !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to OneDrive
    const result = await oneDriveService.uploadShopImage(
      buffer,
      file.name,
      shopId
    );

    // Get current picture array
    const { data: currentShop } = await supabaseAdmin
      .from('shop')
      .select('picture_array')
      .eq('shop_id', shopId)
      .single();

    const pictureArray = currentShop?.picture_array || [];
    const updatedArray = [...pictureArray, result.webUrl];

    // Update shop in Supabase
    await supabaseAdmin
      .from('shop')
      .update({ picture_array: updatedArray })
      .eq('shop_id', shopId);

    return NextResponse.json({
      success: true,
      file: {
        id: result.id,
        name: result.name,
        url: result.webUrl,
        size: result.size,
      },
    });
  } catch (error) {
    console.error('Shop image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload shop image' },
      { status: 500 }
    );
  }
}

/**
 * API Route: Get Shop Images
 * GET /api/documents/shop-images?shopId=123
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shopId = parseInt(searchParams.get('shopId') || '0');

    if (!shopId) {
      return NextResponse.json(
        { error: 'shopId parameter required' },
        { status: 400 }
      );
    }

    const files = await oneDriveService.listFolderContents(
      `moto-service-hub/shop_profiles/${shopId}`
    );

    return NextResponse.json({
      success: true,
      images: files,
    });
  } catch (error) {
    console.error('Error listing shop images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop images' },
      { status: 500 }
    );
  }
}
