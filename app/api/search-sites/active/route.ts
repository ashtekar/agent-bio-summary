import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/search-sites/active - Get only active search sites
export async function GET(request: NextRequest) {
  try {
    const { data: activeSites, error } = await supabase
      .from('search_sites')
      .select('*')
      .eq('is_active', true)
      .order('display_name')

    if (error) {
      console.error('Error fetching active search sites:', error)
      return NextResponse.json({ error: 'Failed to fetch active search sites' }, { status: 500 })
    }

    return NextResponse.json(activeSites)
  } catch (error) {
    console.error('Error in GET /api/search-sites/active:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
