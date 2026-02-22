import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { shop_id, category_id, name, description, base_price, estimated_duration_minutes } = body

    if (!shop_id || !category_id || !name || !base_price) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify shop and category exist and belong to shop
    const { data: category } = await supabaseAdmin
      .from('service_categories')
      .select('id')
      .eq('id', category_id)
      .eq('shop_id', shop_id)
      .single()

    if (!category) {
      return Response.json(
        { error: 'Invalid category for this shop' },
        { status: 400 }
      )
    }

    // Create service
    const { data, error } = await supabaseAdmin
      .from('services')
      .insert({
        shop_id,
        category_id,
        name,
        description: description || '',
        base_price,
        estimated_duration_minutes: estimated_duration_minutes || 30,
        is_available: true,
      })
      .select()

    if (error) throw error

    return Response.json(
      {
        message: 'Service created successfully',
        service: data?.[0],
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Service creation error:', error)
    return Response.json(
      { error: error.message || 'Failed to create service' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const shopId = searchParams.get('shop_id')
    const categoryId = searchParams.get('category_id')

    if (!shopId) {
      return Response.json(
        { error: 'shop_id is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('services')
      .select(`
        *,
        service_categories(name, description)
      `)
      .eq('shop_id', shopId)
      .eq('is_available', true)

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error) throw error

    return Response.json({ data })
  } catch (error: any) {
    console.error('Fetch services error:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return Response.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('services')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) throw error

    return Response.json({
      message: 'Service updated successfully',
      service: data?.[0],
    })
  } catch (error: any) {
    console.error('Service update error:', error)
    return Response.json(
      { error: error.message || 'Failed to update service' },
      { status: 500 }
    )
  }
}
