export const dynamic = 'force-dynamic'
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

    // Vercel handles cron job authentication automatically
    // No need for additional authentication checks

    // Check if this is a manual run (from the Run Now button)
    const { searchParams } = new URL(request.url)
    const isManualRun = searchParams.get('manual') === 'true'

    console.log(`Starting daily summary generation... ${isManualRun ? '(Manual Run)' : '(Scheduled Run)'}`)

    // Step 0: Check if summary already exists for today (skip for manual runs)
    const today = new Date().toISOString().split('T')[0]
    
    if (!isManualRun) {
      const { data: existingSummary } = await supabaseAdmin
        .from('daily_summaries')
        .select('id')
        .eq('date', today)
        .single()

      if (existingSummary) {
        console.log(`Daily summary for ${today} already exists, skipping generation`)
        return NextResponse.json({
          success: true,
          message: 'Daily summary already exists for today',
          summary: {
            date: today,
            articlesCount: 0,
            emailSent: false
          }
        })
      }
    } else {
      console.log('Manual run detected - proceeding with generation even if summary exists')
    }

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

    const searchSettings: SearchSettings = {
      timeWindow: searchSettingsData?.time_window_hours || 24,
      sources: searchSettingsData?.sources || ['pubmed', 'arxiv', 'sciencedaily'],
      keywords: searchSettingsData?.keywords || ['synthetic biology', 'biotechnology', 'genetic engineering'],
      maxArticles: searchSettingsData?.max_articles || 50,
      relevance_threshold: searchSettingsData?.relevance_threshold ?? 6.0
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

    // Step 2: Get system settings for model selection
    const { data: systemSettings, error: systemError } = await supabaseAdmin
      .from('system_settings')
      .select('openai_model')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (systemError && systemError.code !== 'PGRST116') {
      console.error('Error fetching system settings:', systemError)
    }

    const selectedModel = systemSettings?.openai_model || 'gpt-4o-mini'
    console.log('Using OpenAI model:', selectedModel)

    // Step 3: Generate summaries
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('Starting summary generation with OpenAI...')
    console.log('Number of articles to summarize:', articles.length)
    console.log('Sample article:', articles[0] ? {
      title: articles[0].title,
      summary: articles[0].summary?.substring(0, 100),
      content: articles[0].content?.substring(0, 100)
    } : 'No articles')
    
    const summaryGenerator = new SummaryGenerator(process.env.OPENAI_API_KEY, selectedModel)
    
    let top10Summary: string
    
    try {
      top10Summary = await summaryGenerator.generateTop10Summary(articles)

      console.log('Top 10 summary generated successfully')
      console.log('Top 10 summary length:', top10Summary.length)
      console.log('Top 10 summary preview:', top10Summary.substring(0, 100))
    } catch (summaryError) {
      console.error('Error generating top 10 summary:', summaryError)
      throw new Error(`Summary generation failed: ${summaryError instanceof Error ? summaryError.message : 'Unknown error'}`)
    }

    // Step 3: Store articles in database (upsert to handle duplicates)
    if (articles.length > 0) {
      const { error: articlesError } = await supabaseAdmin
        .from('articles')
        .upsert(articles.map(article => ({
          title: article.title,
          url: article.url,
          source: article.source,
          published_date: article.publishedDate,
          relevance_score: article.relevanceScore,
          content: article.content
        })), {
          onConflict: 'url',
          ignoreDuplicates: false
        })

      if (articlesError) {
        console.error('Error storing articles:', articlesError)
      } else {
        console.log(`Successfully stored/updated ${articles.length} articles`)
      }
    }

    // Step 3.5: Fetch the real article UUIDs for the top 10 articles
    const top10Articles = articles.slice(0, 10)
    const top10Urls = top10Articles.map(a => a.url)
    
    const { data: storedArticles, error: fetchArticlesError } = await supabaseAdmin
      .from('articles')
      .select('id, url')
      .in('url', top10Urls)
    
    if (fetchArticlesError) {
      console.error('Error fetching stored article UUIDs:', fetchArticlesError)
    } else {
      console.log(`Successfully fetched ${storedArticles?.length || 0} article UUIDs`)
    }

    // Create a map of URL to UUID for easy lookup
    const urlToUuidMap = new Map()
    if (storedArticles) {
      storedArticles.forEach(article => {
        urlToUuidMap.set(article.url, article.id)
      })
    }

    // Get the real UUIDs for the top 10 articles in the same order
    const top10ArticleIds = top10Articles
      .map(article => urlToUuidMap.get(article.url))
      .filter(id => id) // Remove any undefined values

    console.log(`Mapped ${top10ArticleIds.length} article UUIDs for summary`)

    // Step 4: Create and store daily summary
    // Upsert summary in database (get real UUID)
    await supabaseAdmin
      .from('daily_summaries')
      .upsert([
        {
          date: today,
          top_10_summary: top10Summary,
          featured_articles: articles.slice(0, 10).map(a => a.title),
          article_ids: top10ArticleIds
        }
      ], {
        onConflict: 'date',
        ignoreDuplicates: false
      })

    // Fetch the real summary UUID
    const { data: summaryRow, error: fetchSummaryError } = await supabaseAdmin
      .from('daily_summaries')
      .select('id')
      .eq('date', today)
      .single()
    if (fetchSummaryError) {
      console.error('Error fetching summary UUID:', fetchSummaryError)
      throw new Error('Failed to fetch summary UUID')
    }

    const summary: DailySummary = {
      id: summaryRow.id,
      date: today,
      title: `Daily Summary - ${today}`,
      articles: [], // No per-article summaries in email
      dailySummary: '', // No daily summary in email
      top10Summary,
      emailSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Step 5: Send emails (if configured)
    let emailSent = false
    if (process.env.RESEND_API_KEY) {
      console.log('Resend API key is configured, attempting to send emails...')
      
      // Get recipients from database
      const { data: recipients, error: recipientsError } = await supabaseAdmin
        .from('email_recipients')
        .select('*')
        .eq('is_active', true)

      if (recipientsError) {
        console.error('Error fetching recipients:', recipientsError)
      } else if (recipients && recipients.length > 0) {
        console.log(`Found ${recipients.length} active recipients:`, recipients.map(r => r.email))
        
        const emailService = new EmailService(process.env.RESEND_API_KEY)
        emailSent = await emailService.sendDailySummary(recipients, summary)
        
        console.log(`Email sending result: ${emailSent}`)
        
        if (emailSent) {
          summary.emailSent = true
          summary.updatedAt = new Date().toISOString()
        }
      } else {
        console.log('No active recipients found')
      }
    } else {
      console.log('Resend API key not configured, skipping email sending')
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
