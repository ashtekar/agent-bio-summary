import { NextRequest, NextResponse } from 'next/server'
import { WebSearchModule } from '@/lib/webSearch'
import { SearchSettings } from '@/lib/types'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { keywords, timeWindow, maxArticles } = body

    // Get active search sites
    const { data: activeSites, error: sitesError } = await supabase
      .from('search_sites')
      .select('domain, display_name')
      .eq('is_active', true)

    if (sitesError) {
      console.error('Error fetching active search sites:', sitesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch search sites' },
        { status: 500 }
      )
    }

    // Check if any sites are active
    if (!activeSites || activeSites.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No search sites selected',
        message: 'Please enable at least one search site in settings'
      }, { status: 400 })
    }

    const searchSettings: SearchSettings = {
      timeWindow: timeWindow || 24,
      sources: [], // No longer needed since we get sites from database
      keywords: keywords || ['synthetic biology', 'CRISPR', 'gene editing'],
      maxArticles: maxArticles || 50
    }

    const webSearch = new WebSearchModule(searchSettings)
    const articles = await webSearch.searchArticles()

    return NextResponse.json({
      success: true,
      articles,
      totalFound: articles.length,
      searchTime: new Date().toISOString(),
      keywords: searchSettings.keywords,
      activeSites: activeSites.map(site => site.display_name)
    })

  } catch (error) {
    console.error('Error in search API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search articles' },
      { status: 500 }
    )
  }
}
