import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/emailService'
import { EmailRecipient, DailySummary } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipients, summary, isTest = false } = body

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Resend API key not configured' },
        { status: 500 }
      )
    }

    const emailService = new EmailService(process.env.RESEND_API_KEY)

    if (isTest && recipients.length > 0) {
      // Send test email to first recipient
      const success = await emailService.sendTestEmail(recipients[0])
      return NextResponse.json({
        success,
        message: success ? 'Test email sent successfully' : 'Failed to send test email'
      })
    } else {
      // Send actual summary emails
      const success = await emailService.sendDailySummary(recipients, summary)
      return NextResponse.json({
        success,
        message: success ? 'Summary emails sent successfully' : 'Failed to send summary emails'
      })
    }

  } catch (error) {
    console.error('Error in email API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send emails' },
      { status: 500 }
    )
  }
}
