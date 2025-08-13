import { NextRequest, NextResponse } from 'next/server'
import { WebSearchModule } from '@/lib/webSearch'
import { SummaryGenerator } from '@/lib/summaryGenerator'
import { EmailService } from '@/lib/emailService'
import { supabaseAdmin } from '@/lib/supabase'
import { SearchSettings, DailySummary } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Verify this is a legitimate cron request (you can add more security here)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting daily summary generation...')

    // Step 1: Get settings from database
    const { data: searchSettingsData, error: searchError } = await supabaseAdmin
      .from('search_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (searchError && searchError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch search settings: ${searchError.message}`)
    }

    const searchSettings: SearchSettings = searchSettingsData || {
      timeWindow: 24,
      sources: ['pubmed', 'arxiv', 'sciencedaily'],
      keywords: ['synthetic biology', 'biotechnology', 'genetic engineering'],
      maxArticles: 50
    }

    const webSearch = new WebSearchModule(searchSettings)
    const articles = await webSearch.searchArticles()

    console.log(`Found ${articles.length} articles`)

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No articles found for today'
      })
    }

    // Step 2: Generate summaries
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const summaryGenerator = new SummaryGenerator(process.env.OPENAI_API_KEY)
    
    const [dailySummary, top10Summary] = await Promise.all([
      summaryGenerator.generateDailySummary(articles),
      summaryGenerator.generateTop10Summary(articles)
    ])

    console.log('Summaries generated successfully')

    // Step 3: Store articles in database
    if (articles.length > 0) {
      const { error: articlesError } = await supabaseAdmin
        .from('articles')
        .insert(articles.map(article => ({
          title: article.title,
          url: article.url,
          source: article.source,
          published_date: article.publishedDate,
          relevance_score: article.relevanceScore,
          content: article.content
        })))

      if (articlesError) {
        console.error('Error storing articles:', articlesError)
      }
    }

    // Step 4: Create and store daily summary
    const today = new Date().toISOString().split('T')[0]
    const summary: DailySummary = {
      id: `summary-${Date.now()}`,
      date: today,
      title: `Daily Summary - ${today}`,
      articles: articles.slice(0, 10), // Top 10 articles
      dailySummary,
      top10Summary,
      emailSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Store summary in database
    const { error: summaryError } = await supabaseAdmin
      .from('daily_summaries')
      .insert([{
        date: today,
        daily_overview: dailySummary,
        top_10_summary: top10Summary,
        featured_articles: articles.slice(0, 10).map(a => a.title)
      }])

    if (summaryError) {
      console.error('Error storing summary:', summaryError)
    }

    // Step 5: Send emails (if configured)
    let emailSent = false
    if (process.env.RESEND_API_KEY) {
      // Get recipients from database
      const { data: recipients, error: recipientsError } = await supabaseAdmin
        .from('email_recipients')
        .select('*')
        .eq('is_active', true)

      if (recipientsError) {
        console.error('Error fetching recipients:', recipientsError)
      } else if (recipients && recipients.length > 0) {
        const emailService = new EmailService(process.env.RESEND_API_KEY)
        emailSent = await emailService.sendDailySummary(recipients, summary)
        
        if (emailSent) {
          summary.emailSent = true
          summary.updatedAt = new Date().toISOString()
        }
      }
    }

    console.log('Daily summary process completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Daily summary generated successfully',
      summary: {
        id: summary.id,
        date: summary.date,
        articlesCount: summary.articles.length,
        emailSent
      }
    })

  } catch (error) {
    console.error('Error in daily summary cron job:', error)
    
    // Send error notification if email service is available
    if (process.env.RESEND_API_KEY && supabaseAdmin) {
      try {
        const emailService = new EmailService(process.env.RESEND_API_KEY)
        const { data: recipients } = await supabaseAdmin
          .from('email_recipients')
          .select('*')
          .eq('is_active', true)
          .limit(1)

        if (recipients && recipients.length > 0) {
          await emailService.sendErrorNotification(recipients, error instanceof Error ? error.message : 'Unknown error occurred')
        }
      } catch (emailError) {
        console.error('Failed to send error notification:', emailError)
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate daily summary' },
      { status: 500 }
    )
  }
}
