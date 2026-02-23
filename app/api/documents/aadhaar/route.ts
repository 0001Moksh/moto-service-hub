import { NextRequest, NextResponse } from 'next/server';
import { oneDriveService } from '@/lib/onedrive';
import { verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * API Route: Upload Aadhaar Card
 * POST /api/documents/aadhaar
 * 
 * Body: FormData with:
 * - file: File (image)
 * - userId: number
 * - role: 'owner' | 'worker' | 'customer'
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

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const role = formData.get('role') as string;
    const userId = parseInt(formData.get('userId') as string);

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!['owner', 'worker', 'customer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Verify user owns this resource
    if (payload.userId !== userId && payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to OneDrive
    const result = await oneDriveService.uploadAadhaarCard(
      buffer,
      file.name,
      role as 'owner' | 'worker' | 'customer',
      userId
    );

    // Store metadata in Supabase
    const tableMap: Record<string, string> = {
      owner: 'owner',
      worker: 'worker',
      customer: 'customer',
    };

    const table = tableMap[role];
    const idColumn = `${role}_id`;

    await supabaseAdmin
      .from(table)
      .update({ picture: result.webUrl })
      .eq(idColumn, userId);

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
    console.error('Aadhaar upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload Aadhaar card' },
      { status: 500 }
    );
  }
}
