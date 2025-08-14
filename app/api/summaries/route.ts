import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Get all daily summaries ordered by date (newest first)
    const { data: summaries, error: summariesError } = await supabaseAdmin
      .from('daily_summaries')
      .select('*')
      .order('date', { ascending: false })

    if (summariesError) {
      console.error('Error fetching summaries:', summariesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch summaries' },
        { status: 500 }
      )
    }

    // For each summary, get the associated articles
    const summariesWithArticles = await Promise.all(
      summaries.map(async (summary) => {
        // Get articles for this date (articles created on the same date as the summary)
        const { data: articles, error: articlesError } = await supabaseAdmin
          .from('articles')
          .select('*')
          .gte('created_at', `${summary.date}T00:00:00Z`)
          .lt('created_at', `${summary.date}T23:59:59Z`)
          .order('relevance_score', { ascending: false })
          .limit(10)

        if (articlesError) {
          console.error('Error fetching articles for summary:', summary.date, articlesError)
        }

        // Transform the data to match the component's expected format
        return {
          id: summary.id,
          date: summary.date,
          title: `Daily Summary - ${summary.date}`,
          dailySummary: summary.daily_overview,
          top10Summary: summary.top_10_summary,
          emailSent: true, // We'll assume email was sent if summary exists
          articles: articles?.map(article => ({
            id: article.id,
            title: article.title,
            url: article.url,
            source: article.source,
            publishedDate: article.published_date,
            summary: article.content?.substring(0, 200) + '...' || 'No summary available',
            relevanceScore: article.relevance_score
          })) || []
        }
      })
    )

    return NextResponse.json({
      success: true,
      summaries: summariesWithArticles
    })

  } catch (error) {
    console.error('Error in summaries API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
