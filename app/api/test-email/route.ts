import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/emailService'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Resend API key not configured' },
        { status: 500 }
      )
    }

    const { recipientEmail, testType = 'basic' } = await request.json()

    const emailService = new EmailService(process.env.RESEND_API_KEY)

    // Get recipients from database or use provided email
    let recipients = []
    if (recipientEmail) {
      recipients = [{ 
        id: 'test', 
        name: 'Test Recipient', 
        email: recipientEmail, 
        is_active: true 
      }]
    } else {
      // Get active recipients from database
      if (!supabaseAdmin) {
        return NextResponse.json(
          { error: 'Database not configured' },
          { status: 500 }
        )
      }

      const { data: dbRecipients, error } = await supabaseAdmin
        .from('email_recipients')
        .select('*')
        .eq('is_active', true)
        .limit(1)

      if (error || !dbRecipients || dbRecipients.length === 0) {
        return NextResponse.json(
          { error: 'No active email recipients found. Please add recipients in Settings first.' },
          { status: 400 }
        )
      }

      recipients = dbRecipients
    }

    let emailSent = false
    let emailContent = ''

    switch (testType) {
      case 'summary':
        // Send a sample daily summary
        const sampleSummary = {
          id: 'test-summary',
          date: new Date().toLocaleDateString(),
          title: 'Test Daily Summary',
          articles: [
            {
              id: 'test-article-1',
              title: 'Sample Synthetic Biology Article',
              url: 'https://example.com/article1',
              source: 'Nature',
              publishedDate: new Date().toISOString(),
              relevanceScore: 0.95,
              content: 'This is a sample article about synthetic biology breakthroughs.',
              summary: 'A breakthrough in synthetic biology research.',
              keywords: ['synthetic biology', 'breakthrough']
            }
          ],
          dailySummary: 'This is a test daily summary showing how the email system works.',
          top10Summary: 'Top 10 synthetic biology articles for today.',
          emailSent: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        emailSent = await emailService.sendDailySummary(recipients, sampleSummary)
        emailContent = 'Daily Summary Test Email'
        break

      case 'error':
        // Send an error notification
        emailSent = await emailService.sendErrorNotification(
          recipients, 
          'This is a test error notification to verify the email system is working properly.'
        )
        emailContent = 'Error Notification Test Email'
        break

      default:
        // Send a basic test email
        emailSent = await emailService.sendTestEmail(recipients)
        emailContent = 'Basic Test Email'
        break
    }

    console.log('Email sent result:', emailSent)
    console.log('Email content type:', emailContent)
    
    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: `${emailContent} sent successfully to ${recipients.length} recipient(s)`,
        recipients: recipients.map(r => ({ name: r.name, email: r.email }))
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send test email' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Failed to send test email', details: error },
      { status: 500 }
    )
  }
}
