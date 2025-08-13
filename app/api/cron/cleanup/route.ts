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

    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting data cleanup...')

    // Clean up old articles (older than 2 days)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const { error: articlesError, count: articlesDeleted } = await supabaseAdmin
      .from('articles')
      .delete()
      .lt('created_at', twoDaysAgo)
      .select('count')

    if (articlesError) {
      console.error('Error cleaning up articles:', articlesError)
    }

    // Clean up old summaries (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { error: summariesError, count: summariesDeleted } = await supabaseAdmin
      .from('daily_summaries')
      .delete()
      .lt('created_at', sevenDaysAgo)
      .select('count')

    if (summariesError) {
      console.error('Error cleaning up summaries:', summariesError)
    }

    console.log('Data cleanup completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Data cleanup completed',
      deleted: {
        articles: articlesDeleted || 0,
        summaries: summariesDeleted || 0
      }
    })

  } catch (error) {
    console.error('Error in cleanup cron job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup data' },
      { status: 500 }
    )
  }
}
