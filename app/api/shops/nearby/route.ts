import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
    const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
    const radiusKm = parseFloat(searchParams.get('radius') || '20') // Default 20km

    // Fetch all shops
    const { data: shops, error } = await supabaseAdmin
      .from('shop')
      .select('shop_id, name, location, rating, picture_array, owner_id')

    if (error || !shops) {
      return NextResponse.json(
        { error: 'Failed to fetch shops' },
        { status: 500 }
      )
    }

    // Filter by distance if location provided
    let filteredShops = shops

    if (userLat && userLng) {
      // For now, return all shops since we don't have lat/lng in shop table
      // In production, you'd parse location or have separate location fields
      filteredShops = shops
    }

    // Sort by rating
    filteredShops.sort((a, b) => (b.rating || 0) - (a.rating || 0))

    return NextResponse.json({
      success: true,
      shops: filteredShops,
      totalShops: filteredShops.length,
    })
  } catch (error) {
    console.error('Error fetching nearby shops:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
