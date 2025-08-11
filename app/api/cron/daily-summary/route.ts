import { NextRequest, NextResponse } from 'next/server'
import { WebSearchModule } from '@/lib/webSearch'
import { SummaryGenerator } from '@/lib/summaryGenerator'
import { EmailService } from '@/lib/emailService'
import { SearchSettings, DailySummary } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (you can add more security here)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting daily summary generation...')

    // Step 1: Search for articles
    const searchSettings: SearchSettings = {
      timeWindow: 24,
      sources: ['Nature', 'Science', 'Cell', 'PNAS', 'PubMed', 'arXiv'],
      keywords: ['synthetic biology', 'CRISPR', 'gene editing', 'bioengineering'],
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

    // Step 3: Create daily summary object
    const today = new Date().toLocaleDateString()
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

    // Step 4: Send emails (if configured)
    let emailSent = false
    if (process.env.RESEND_API_KEY) {
      // For now, we'll use a default recipient list
      // In a real implementation, this would come from your database
      const defaultRecipients = [
        {
          id: '1',
          email: process.env.DEFAULT_RECIPIENT_EMAIL || 'test@example.com',
          name: 'Test Recipient',
          active: true,
          createdAt: new Date().toISOString()
        }
      ]

      const emailService = new EmailService(process.env.RESEND_API_KEY)
      emailSent = await emailService.sendDailySummary(defaultRecipients, summary)
      
      if (emailSent) {
        summary.emailSent = true
        summary.updatedAt = new Date().toISOString()
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
    if (process.env.RESEND_API_KEY) {
      try {
        const emailService = new EmailService(process.env.RESEND_API_KEY)
        const defaultRecipients = [
          {
            id: '1',
            email: process.env.ADMIN_EMAIL || 'admin@example.com',
            name: 'System Admin',
            active: true,
            createdAt: new Date().toISOString()
          }
        ]
        await emailService.sendErrorNotification(defaultRecipients, error instanceof Error ? error.message : 'Unknown error occurred')
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
