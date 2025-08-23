import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SearchSiteUpdateRequest } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PUT /api/search-sites/[id] - Update search site
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body: SearchSiteUpdateRequest = await request.json()
    const { is_active } = body

    // Validation
    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'is_active must be a boolean' },
        { status: 400 }
      )
    }

    // Check if site exists
    const { data: existingSite } = await supabase
      .from('search_sites')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingSite) {
      return NextResponse.json(
        { error: 'Search site not found' },
        { status: 404 }
      )
    }

    // Update site
    const { data: updatedSite, error } = await supabase
      .from('search_sites')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating search site:', error)
      return NextResponse.json({ error: 'Failed to update search site' }, { status: 500 })
    }

    return NextResponse.json(updatedSite)
  } catch (error) {
    console.error('Error in PUT /api/search-sites/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/search-sites/[id] - Delete search site
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if site exists
    const { data: existingSite } = await supabase
      .from('search_sites')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingSite) {
      return NextResponse.json(
        { error: 'Search site not found' },
        { status: 404 }
      )
    }

    // Delete site
    const { error } = await supabase
      .from('search_sites')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting search site:', error)
      return NextResponse.json({ error: 'Failed to delete search site' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Search site deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/search-sites/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
