import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')

    if (!ownerId) {
      return Response.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      )
    }

    // Fetch shop for this owner
    const { data: shop, error } = await supabaseAdmin
      .from('shop')
      .select('*')
      .eq('owner_id', parseInt(ownerId))
      .single()

    if (error || !shop) {
      console.error('Shop not found:', error)
      return Response.json(
        { error: 'Shop not found' },
        { status: 404 }
      )
    }

    return Response.json({
      success: true,
      shop: {
        shop_id: shop.shop_id,
        owner_id: shop.owner_id,
        name: shop.name || 'My Shop',
        slug: shop.slug || 'my-shop',
        location: shop.location,
        rating: shop.rating,
        revenue: shop.revenue,
      },
    })
  } catch (error: any) {
    console.error('Get shop error:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch shop' },
      { status: 500 }
    )
  }
}
