import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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

    if (!payload || payload.role !== 'customer') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch customer's bikes
    const { data: bikes, error } = await supabaseAdmin
      .from('bike')
      .select('*')
      .eq('owner_id', payload.userId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bikes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      bikes: bikes || [],
    })
  } catch (error) {
    console.error('Error fetching bikes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    if (!payload || payload.role !== 'customer') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      reg_number,
      color,
      fuel,
      vehicle_class,
      body_type,
      manufacturer,
      model_no,
    } = body

    if (!reg_number) {
      return NextResponse.json(
        { error: 'Registration number is required' },
        { status: 400 }
      )
    }

    // Create new bike
    const { data: newBike, error } = await supabaseAdmin
      .from('bike')
      .insert({
        owner_id: payload.userId,
        reg_number,
        regn_number: reg_number,
        color: color || null,
        fuel: fuel || null,
        vehicle_class: vehicle_class || null,
        body_type: body_type || null,
        manufacturer: manufacturer || null,
        model_no: model_no || null,
        picture_array: [],
      })
      .select('*')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create bike' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        bike: newBike,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating bike:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
