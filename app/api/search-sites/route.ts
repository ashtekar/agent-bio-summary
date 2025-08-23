import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SearchSite, SearchSiteRequest, SearchSiteUpdateRequest } from '@/lib/types'
import { isValidDomain } from '@/lib/utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/search-sites - Get all search sites
export async function GET(request: NextRequest) {
  try {
    const { data: searchSites, error } = await supabase
      .from('search_sites')
      .select('*')
      .order('display_name')

    if (error) {
      console.error('Error fetching search sites:', error)
      return NextResponse.json({ error: 'Failed to fetch search sites' }, { status: 500 })
    }

    return NextResponse.json(searchSites)
  } catch (error) {
    console.error('Error in GET /api/search-sites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/search-sites - Add new search site
export async function POST(request: NextRequest) {
  try {
    const body: SearchSiteRequest = await request.json()
    const { domain, display_name } = body

    // Validation
    if (!domain || !display_name) {
      return NextResponse.json(
        { error: 'Domain and display name are required' },
        { status: 400 }
      )
    }

    // Enhanced domain validation - supports subdomains
    if (!isValidDomain(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format. Please use a valid domain like "example.com" or "news.mit.edu"' },
        { status: 400 }
      )
    }

    // Check if domain already exists
    const { data: existingSite } = await supabase
      .from('search_sites')
      .select('id')
      .eq('domain', domain)
      .single()

    if (existingSite) {
      return NextResponse.json(
        { error: 'Site already exists' },
        { status: 409 }
      )
    }

    // Insert new site
    const { data: newSite, error } = await supabase
      .from('search_sites')
      .insert({
        domain,
        display_name,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating search site:', error)
      return NextResponse.json({ error: 'Failed to create search site' }, { status: 500 })
    }

    return NextResponse.json(newSite, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/search-sites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
