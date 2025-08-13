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

    // Get system status
    const { data: latestSummary, error: summaryError } = await supabaseAdmin
      .from('daily_summaries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get recent summaries
    const { data: recentSummaries, error: recentError } = await supabaseAdmin
      .from('daily_summaries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get article count from today
    const today = new Date().toISOString().split('T')[0]
    const { data: todayArticles, error: articlesError } = await supabaseAdmin
      .from('articles')
      .select('*', { count: 'exact' })
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    // Get total summaries count
    const { data: totalSummaries, error: totalError } = await supabaseAdmin
      .from('daily_summaries')
      .select('*', { count: 'exact' })

    if (summaryError && summaryError.code !== 'PGRST116') {
      console.error('Error fetching latest summary:', summaryError)
    }

    if (recentError) {
      console.error('Error fetching recent summaries:', recentError)
    }

    if (articlesError) {
      console.error('Error fetching today articles:', articlesError)
    }

    if (totalError) {
      console.error('Error fetching total summaries:', totalError)
    }

    // Calculate next scheduled run (8 AM UTC tomorrow)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(8, 0, 0, 0)
    const nextScheduledRun = tomorrow.toISOString()

    const systemStatus = {
      lastRun: latestSummary?.created_at || 'Never',
      articlesFound: todayArticles?.length || 0,
      summariesGenerated: totalSummaries?.length || 0,
      emailSent: latestSummary ? true : false,
      nextScheduledRun: nextScheduledRun
    }

    const formattedSummaries = recentSummaries?.map(summary => ({
      id: summary.id,
      date: summary.date,
      title: `Daily Summary - ${summary.date}`,
      articleCount: summary.featured_articles?.length || 0,
      status: 'completed' as const
    })) || []

    return NextResponse.json({
      systemStatus,
      recentSummaries: formattedSummaries
    })

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
