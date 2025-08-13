import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Get search settings
    const { data: searchSettings, error: searchError } = await supabaseAdmin
      .from('search_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (searchError && searchError.code !== 'PGRST116') throw searchError

    // Get system settings
    const { data: systemSettings, error: systemError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (systemError && systemError.code !== 'PGRST116') throw systemError

    return NextResponse.json({
      search: searchSettings || {
        time_window_hours: 24,
        sources: ['pubmed', 'arxiv', 'sciencedaily'],
        keywords: ['synthetic biology', 'biotechnology', 'genetic engineering'],
        max_articles: 50
      },
      system: systemSettings || {
        schedule_time: '08:00',
        summary_length: 'medium',
        include_images: false
      }
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { search, system } = await request.json()

    const updates = []

    // Update search settings
    if (search) {
      const { error: searchError } = await supabaseAdmin
        .from('search_settings')
        .upsert([{
          ...search,
          updated_at: new Date().toISOString()
        }])

      if (searchError) throw searchError
    }

    // Update system settings
    if (system) {
      const { error: systemError } = await supabaseAdmin
        .from('system_settings')
        .upsert([{
          ...system,
          updated_at: new Date().toISOString()
        }])

      if (systemError) throw systemError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
