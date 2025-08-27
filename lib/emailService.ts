import { Resend } from 'resend'
import { EmailRecipient, DailySummary } from './types'
import { marked } from 'marked'

export class EmailService {
  private resend: Resend

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey)
  }

  async sendDailySummary(recipients: EmailRecipient[], summary: DailySummary): Promise<boolean> {
    try {
      const emailPromises = recipients
        .filter(recipient => recipient.active || recipient.is_active)
        .map(recipient => this.sendEmailToRecipient(recipient, summary))

      const results = await Promise.allSettled(emailPromises)
      const successCount = results.filter(result => result.status === 'fulfilled').length

      console.log(`Email sent successfully to ${successCount}/${recipients.length} recipients`)
      return successCount > 0
    } catch (error) {
      console.error('Error sending daily summary emails:', error)
      return false
    }
  }

  private async sendEmailToRecipient(recipient: EmailRecipient, summary: DailySummary): Promise<void> {
    const emailHtml = this.generateEmailHTML(summary, recipient.name, recipient.id)
    const emailText = this.generateEmailText(summary, recipient.name)

    await this.resend.emails.send({
      from: 'AgentBioSummary <noreply@news.ashtekar.net>',
      to: recipient.email,
      subject: `Synthetic Biology Daily Digest - ${summary.date}`,
      html: emailHtml,
      text: emailText
    })
  }

  private generateEmailHTML(summary: DailySummary, recipientName: string, recipientId?: string): string {
    // Clean up the HTML content to remove any markdown artifacts
    const top10SummaryHtml = this.cleanHtmlContent(summary.top10Summary || '')
    // Feedback links for Top 10 Articles Summary
    const top10Feedback = `
      <div style="margin-top:10px;">
        <span style="font-size:14px;">Was the Top 10 Articles Summary helpful?</span>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}/feedback?recipientId=${recipientId || ''}&summaryId=${summary.id}&feedbackType=top10&feedbackValue=up" style="margin-left:10px; font-size:20px; text-decoration:none;" target="_blank">👍</a>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}/feedback?recipientId=${recipientId || ''}&summaryId=${summary.id}&feedbackType=top10&feedbackValue=down" style="margin-left:5px; font-size:20px; text-decoration:none;" target="_blank">👎</a>
      </div>
    `
    

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Synthetic Biology Daily Digest</title>
        <style>
          body { 
            background: #0a0a0a !important; 
            color: #ffffff !important; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
            line-height: 1.6; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .header { 
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important; 
            color: #ffffff !important; 
            padding: 35px; 
            border-radius: 12px; 
            text-align: center; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            border: 1px solid #2a2a3e;
          }
          .content { 
            background: #1a1a1a !important; 
            padding: 35px; 
            border-radius: 12px; 
            margin-top: 25px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            border: 1px solid #2a2a2a;
            color: #ffffff !important;
          }
          .section { 
            margin-bottom: 35px; 
            color: #ffffff !important;
          }
          .section h2 { 
            color: #ffffff !important; 
            border-bottom: 3px solid #4a9eff; 
            padding-bottom: 12px; 
            font-size: 1.4em;
            font-weight: 600;
            margin-bottom: 20px;
          }
          .footer { 
            text-align: center; 
            margin-top: 35px; 
            padding: 25px; 
            color: #cccccc !important; 
            font-size: 13px; 
            background: #1a1a1a !important;
            border-radius: 8px;
            border: 1px solid #2a2a2a;
          }
          .highlight { 
            background: linear-gradient(135deg, #1e2a3a 0%, #2a3a4a 100%) !important; 
            color: #ffffff !important; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #4a9eff; 
            margin: 20px 0; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          }
          /* Inline markdown styles */
          h1, h2, h3, h4, h5, h6 { 
            color: #ffffff !important; 
            margin-top: 1.2em; 
            margin-bottom: 0.6em; 
            font-weight: 600;
          }
          h1 { font-size: 1.8em; }
          h2 { font-size: 1.5em; }
          h3 { font-size: 1.3em; }
          ul, ol { 
            margin: 0 0 1em 1.8em; 
            color: #ffffff !important;
          }
          li { 
            margin-bottom: 0.6em; 
            color: #ffffff !important; 
          }
          strong { 
            color: #ffffff !important; 
            font-weight: 600;
          }
          em { 
            color: #e0e0e0 !important; 
            font-style: italic;
          }
          a { 
            color: #4a9eff !important; 
            text-decoration: none; 
            border-bottom: 1px solid #4a9eff;
            transition: color 0.2s ease;
          }
          a:hover {
            color: #6bb6ff !important;
          }
          blockquote { 
            border-left: 4px solid #4a9eff; 
            margin: 1.2em 0; 
            padding: 0.8em 1.2em; 
            color: #e0e0e0 !important; 
            background: #1e2a3a !important; 
            border-radius: 0 6px 6px 0;
            font-style: italic;
          }
          code { 
            background: #2a2a2a !important; 
            color: #ffffff !important; 
            padding: 3px 6px; 
            border-radius: 4px; 
            font-size: 90%; 
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            border: 1px solid #3a3a3a;
          }
          p {
            margin-bottom: 1em;
            color: #ffffff !important;
          }
          /* Force dark mode for email clients */
          * {
            background-color: inherit !important;
          }
          .email-container {
            background: #0a0a0a !important;
            color: #ffffff !important;
          }
        </style>
      </head>
      <body class="email-container">
        <div class="header">
          <h1>🧬 Synthetic Biology Daily Digest</h1>
          <p>Your daily summary of the latest developments in synthetic biology</p>
          <p><strong>${summary.date}</strong></p>
        </div>
        <div class="content">
          <p>Hello ${recipientName},</p>

          <div class="section">
            <h2>🏆 Top 10 Articles Summary</h2>
            <div class="highlight">
              ${top10SummaryHtml}
            </div>
            ${top10Feedback}
          </div>
          <div class="section">
            <h2>🎯 Why This Matters</h2>
            <p>Synthetic biology is revolutionizing how we understand and manipulate living systems. Today's discoveries bring us closer to solving some of humanity's biggest challenges, from sustainable energy to medical breakthroughs.</p>
            <p>As a student interested in biology, these developments show you the exciting future of science and the incredible potential of genetic engineering.</p>
          </div>
        </div>
        <div class="footer">
          <p>This digest is automatically generated by AgentBioSummary</p>
          <p>Designed for high school students with an interest in synthetic biology</p>
          <p>To unsubscribe or change settings, please contact your administrator</p>
        </div>
      </body>
      </html>
    `
  }

  private cleanHtmlContent(content: string): string {
    if (!content) return ''
    
    // Remove markdown code block markers
    let cleaned = content
      .replace(/^\s*```html\s*/i, '') // Remove opening ```html with optional leading whitespace
      .replace(/^\s*```\s*/i, '') // Remove opening ``` with optional leading whitespace
      .replace(/\s*```\s*$/i, '') // Remove closing ``` with optional whitespace
      .replace(/^\s*```html\s*$/i, '') // Remove standalone ```html
      .replace(/^\s*```\s*$/i, '') // Remove standalone ```
      .trim()
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim()
    
    // Debug logging
    console.log('🔍 HTML Content Cleaning:')
    console.log('Original length:', content.length)
    console.log('Cleaned length:', cleaned.length)
    console.log('Original preview:', content.substring(0, 100))
    console.log('Cleaned preview:', cleaned.substring(0, 100))
    
    return cleaned
  }

  private generateEmailText(summary: DailySummary, recipientName: string): string {
    return `
Synthetic Biology Daily Digest - ${summary.date}

Hello ${recipientName}, 

TOP 10 ARTICLES SUMMARY:
${summary.top10Summary}



WHY THIS MATTERS:
Synthetic biology is revolutionizing how we understand and manipulate living systems. Today's discoveries bring us closer to solving some of humanity's biggest challenges, from sustainable energy to medical breakthroughs.

As a student interested in biology, these developments show you the exciting future of science and the incredible potential of genetic engineering.

---
This digest is automatically generated by AgentBioSummary
Designed for high school students with an interest in synthetic biology
    `
  }

  async sendTestEmail(recipients: EmailRecipient[]): Promise<boolean> {
    try {
      const emailPromises = recipients
        .filter(recipient => recipient.active || recipient.is_active)
        .map(recipient => this.sendBasicTestEmail(recipient))

      const results = await Promise.allSettled(emailPromises)
      const successCount = results.filter(result => result.status === 'fulfilled').length

      console.log(`Test email sent successfully to ${successCount}/${recipients.length} recipients`)
      return successCount > 0
    } catch (error) {
      console.error('Error sending test emails:', error)
      return false
    }
  }

  private async sendBasicTestEmail(recipient: EmailRecipient): Promise<void> {
    const emailHtml = this.generateBasicTestEmailHTML(recipient.name)
    const emailText = this.generateBasicTestEmailText(recipient.name)

    console.log('Attempting to send email to:', recipient.email)
    console.log('Using Resend API key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing')

    try {
      const result = await this.resend.emails.send({
        from: 'noreply@news.ashtekar.net',
        to: recipient.email,
        subject: 'AgentBioSummary - Test Email',
        html: emailHtml,
        text: emailText
      })
      
      console.log('Resend API response:', result)
    } catch (error) {
      console.error('Resend API error:', error)
      throw error
    }
  }

  private generateBasicTestEmailHTML(recipientName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AgentBioSummary Test Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; }
          .content { background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; margin: 15px 0; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🧬 AgentBioSummary</h1>
          <p>Test Email - Email System Verification</p>
        </div>
        
        <div class="content">
          <p>Hello ${recipientName},</p>
          
          <div class="success">
            <h2>✅ Email System Test Successful!</h2>
            <p>This is a test email to verify that the AgentBioSummary email system is working correctly.</p>
          </div>
          
          <p>If you received this email, it means:</p>
          <ul>
            <li>✅ The Resend email service is properly configured</li>
            <li>✅ Your email address is correctly set up in the system</li>
            <li>✅ The email templates are working</li>
            <li>✅ Daily summaries will be delivered successfully</li>
          </ul>
          
          <p><strong>What's Next?</strong></p>
          <p>The system will now automatically send you daily synthetic biology summaries at the scheduled time. You can manage your preferences in the AgentBioSummary dashboard.</p>
        </div>
        
        <div class="footer">
          <p>This is a test email from AgentBioSummary</p>
          <p>Designed for high school students with an interest in synthetic biology</p>
        </div>
      </body>
      </html>
    `
  }

  private generateBasicTestEmailText(recipientName: string): string {
    return `
AgentBioSummary - Test Email

Hello ${recipientName},

✅ EMAIL SYSTEM TEST SUCCESSFUL!

This is a test email to verify that the AgentBioSummary email system is working correctly.

If you received this email, it means:
✅ The Resend email service is properly configured
✅ Your email address is correctly set up in the system
✅ The email templates are working
✅ Daily summaries will be delivered successfully

What's Next?
The system will now automatically send you daily synthetic biology summaries at the scheduled time. You can manage your preferences in the AgentBioSummary dashboard.

---
This is a test email from AgentBioSummary
Designed for high school students with an interest in synthetic biology
    `
  }

  async sendErrorNotification(recipients: EmailRecipient[], error: string): Promise<void> {
    try {
      const errorEmailPromises = recipients
        .filter(recipient => recipient.active || recipient.is_active)
        .map(recipient => this.resend.emails.send({
          from: 'AgentBioSummary <noreply@news.ashtekar.net>',
          to: recipient.email,
          subject: 'AgentBioSummary - System Error',
          html: `
            <h2>System Error Notification</h2>
            <p>The AgentBioSummary system encountered an error:</p>
            <pre>${error}</pre>
            <p>Please check the system logs for more details.</p>
          `
        }))

      await Promise.allSettled(errorEmailPromises)
    } catch (error) {
      console.error('Error sending error notification:', error)
    }
  }
}
