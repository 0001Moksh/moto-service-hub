import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://brnsimoaoxuhpxzrfpcg.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybnNpbW9hb3h1aHB4enJmcGNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTczMzE1OSwiZXhwIjoyMDg3MzA5MTU5fQ.UVS9HFyC2gQM6kR7u3-Whwn7u3cq2UJeFF2Yu_n0QhA'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const workerId = (await params).id

    const { error } = await supabase
      .from('worker')
      .delete()
      .eq('worker_id', parseInt(workerId))

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Worker deleted successfully',
    })
  } catch (error) {
    console.error('Delete worker error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
