import { NextRequest, NextResponse } from 'next/server';
import { oneDriveService } from '@/lib/onedrive';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * API Route: Upload Bike Image
 * POST /api/documents/bike-images
 * 
 * Body: FormData with:
 * - file: File (image)
 * - bikeId: number
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

    if (!payload || payload.role !== 'customer') {
      return NextResponse.json(
        { error: 'Only customers can upload bike images' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bikeId = parseInt(formData.get('bikeId') as string);

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Verify bike ownership
    const { data: bike } = await supabaseAdmin
      .from('bike')
      .select('owner_id')
      .eq('bike_id', bikeId)
      .single();

    if (!bike || bike.owner_id !== payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to OneDrive
    const result = await oneDriveService.uploadBikeImage(
      buffer,
      file.name,
      bikeId,
      payload.userId
    );

    // Get current picture array
    const { data: currentBike } = await supabaseAdmin
      .from('bike')
      .select('picture_array')
      .eq('bike_id', bikeId)
      .single();

    const pictureArray = currentBike?.picture_array || [];
    const updatedArray = [...pictureArray, result.webUrl];

    // Update bike in Supabase
    await supabaseAdmin
      .from('bike')
      .update({ picture_array: updatedArray })
      .eq('bike_id', bikeId);

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
    console.error('Bike image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload bike image' },
      { status: 500 }
    );
  }
}

/**
 * API Route: Get Bike Images
 * GET /api/documents/bike-images?bikeId=123
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const bikeId = parseInt(searchParams.get('bikeId') || '0');

    if (!bikeId) {
      return NextResponse.json(
        { error: 'bikeId parameter required' },
        { status: 400 }
      );
    }

    // Verify bike access
    const { data: bike } = await supabaseAdmin
      .from('bike')
      .select('owner_id')
      .eq('bike_id', bikeId)
      .single();

    if (!bike || (bike.owner_id !== payload.userId && payload.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const files = await oneDriveService.listFolderContents(
      `moto-service-hub/bike_img/${payload.userId}/${bikeId}`
    );

    return NextResponse.json({
      success: true,
      images: files,
    });
  } catch (error) {
    console.error('Error listing bike images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bike images' },
      { status: 500 }
    );
  }
}
