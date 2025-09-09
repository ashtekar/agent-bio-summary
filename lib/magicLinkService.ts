import { supabaseAdmin } from './supabase'
import { EmailService } from './emailService'
import crypto from 'crypto'

export interface MagicLinkToken {
  id: string
  email: string
  token: string
  expires_at: string
  used_at?: string
  created_at: string
  feedback_context?: any
}

export interface UserSession {
  id: string
  recipient_id: string
  session_token: string
  created_at: string
  expires_at: string
  last_activity: string
}

export class MagicLinkService {
  private emailService: EmailService

  constructor() {
    this.emailService = new EmailService()
  }

  /**
   * Generate a secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Create a magic link token for email verification
   */
  async createMagicLinkToken(
    email: string, 
    feedbackContext?: any,
    expirationHours: number = 1
  ): Promise<{ token: string; expiresAt: Date }> {
    if (!supabaseAdmin) {
      throw new Error('Database not configured')
    }

    // Generate secure token
    const token = this.generateSecureToken()
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000)

    // Clean up any existing tokens for this email
    await this.cleanupExpiredTokens(email)

    // Check rate limiting (max 3 tokens per email per hour)
    const { data: recentTokens } = await supabaseAdmin
      .from('magic_link_tokens')
      .select('id')
      .eq('email', email)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

    if (recentTokens && recentTokens.length >= 3) {
      throw new Error('Too many magic link requests. Please wait 1 hour before requesting another.')
    }

    // Insert new token
    const { error } = await supabaseAdmin
      .from('magic_link_tokens')
      .insert({
        email,
        token,
        expires_at: expiresAt.toISOString(),
        feedback_context: feedbackContext || null
      })

    if (error) {
      console.error('Error creating magic link token:', error)
      throw new Error('Failed to create magic link token')
    }

    return { token, expiresAt }
  }

  /**
   * Send magic link email
   */
  async sendMagicLinkEmail(email: string, feedbackContext?: any): Promise<void> {
    try {
      const { token, expiresAt } = await this.createMagicLinkToken(email, feedbackContext)
      
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://agent-bio-summary.vercel.app'}/auth/verify?token=${token}`
      
      const emailContent = {
        to: email,
        subject: 'Verify your email to provide feedback',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify your email to provide feedback</h2>
            <p>Hi there!</p>
            <p>You requested to provide feedback on our daily synthetic biology summaries.</p>
            <p>Click this link to verify your email and start providing feedback:</p>
            <p><a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email & Provide Feedback</a></p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>Thanks for helping us improve!</p>
            <p>Best regards,<br>The Agent Bio Summary Team</p>
          </div>
        `,
        text: `
          Verify your email to provide feedback
          
          Hi there!
          
          You requested to provide feedback on our daily synthetic biology summaries.
          
          Click this link to verify your email and start providing feedback:
          ${verificationUrl}
          
          This link expires in 1 hour.
          
          If you didn't request this, you can safely ignore this email.
          
          Thanks for helping us improve!
          
          Best regards,
          The Agent Bio Summary Team
        `
      }

      await this.emailService.sendEmail(emailContent)
      console.log(`Magic link email sent to ${email}`)
    } catch (error) {
      console.error('Error sending magic link email:', error)
      throw error
    }
  }

  /**
   * Verify magic link token and create user session
   */
  async verifyMagicLinkToken(token: string): Promise<{ 
    success: boolean; 
    recipientId?: string; 
    sessionToken?: string; 
    isNewUser?: boolean;
    error?: string 
  }> {
    if (!supabaseAdmin) {
      return { success: false, error: 'Database not configured' }
    }

    try {
      // Find and validate token
      const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('magic_link_tokens')
        .select('*')
        .eq('token', token)
        .eq('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (tokenError || !tokenData) {
        return { success: false, error: 'Invalid or expired token' }
      }

      // Mark token as used
      await supabaseAdmin
        .from('magic_link_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', tokenData.id)

      // Find or create recipient
      const { data: recipientData, error: recipientError } = await supabaseAdmin
        .rpc('find_or_create_recipient', {
          user_email: tokenData.email,
          user_name: null
        })

      if (recipientError) {
        console.error('Error finding/creating recipient:', recipientError)
        return { success: false, error: 'Failed to create user account' }
      }

      const recipientId = recipientData as string
      const isNewUser = !await this.recipientExists(tokenData.email)

      // Create user session
      const { data: sessionData, error: sessionError } = await supabaseAdmin
        .rpc('create_user_session', {
          recipient_uuid: recipientId,
          session_duration_hours: 720 // 30 days
        })

      if (sessionError) {
        console.error('Error creating session:', sessionError)
        return { success: false, error: 'Failed to create user session' }
      }

      const sessionToken = sessionData as string

      // Send welcome email for new users
      if (isNewUser) {
        await this.sendWelcomeEmail(tokenData.email)
      }

      return {
        success: true,
        recipientId,
        sessionToken,
        isNewUser
      }
    } catch (error) {
      console.error('Error verifying magic link token:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  /**
   * Create user session for existing users
   */
  async createSessionForExistingUser(email: string): Promise<{ 
    success: boolean; 
    recipientId?: string; 
    sessionToken?: string; 
    error?: string 
  }> {
    if (!supabaseAdmin) {
      return { success: false, error: 'Database not configured' }
    }

    try {
      // Find existing recipient
      const { data: recipient, error: recipientError } = await supabaseAdmin
        .from('email_recipients')
        .select('id')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (recipientError || !recipient) {
        return { success: false, error: 'Email not found in our system' }
      }

      // Create user session
      const { data: sessionData, error: sessionError } = await supabaseAdmin
        .rpc('create_user_session', {
          recipient_uuid: recipient.id,
          session_duration_hours: 720 // 30 days
        })

      if (sessionError) {
        console.error('Error creating session:', sessionError)
        return { success: false, error: 'Failed to create user session' }
      }

      const sessionToken = sessionData as string

      return {
        success: true,
        recipientId: recipient.id,
        sessionToken
      }
    } catch (error) {
      console.error('Error creating session for existing user:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  /**
   * Validate user session
   */
  async validateSession(sessionToken: string): Promise<{ 
    valid: boolean; 
    recipientId?: string; 
    error?: string 
  }> {
    if (!supabaseAdmin) {
      return { valid: false, error: 'Database not configured' }
    }

    try {
      const { data, error } = await supabaseAdmin
        .rpc('validate_session', { session_tok: sessionToken })

      if (error || !data || data.length === 0) {
        return { valid: false, error: 'Invalid session' }
      }

      const sessionResult = data[0]
      return {
        valid: sessionResult.is_valid,
        recipientId: sessionResult.recipient_id
      }
    } catch (error) {
      console.error('Error validating session:', error)
      return { valid: false, error: 'Internal server error' }
    }
  }

  /**
   * Clean up expired tokens for an email
   */
  private async cleanupExpiredTokens(email: string): Promise<void> {
    if (!supabaseAdmin) return

    try {
      await supabaseAdmin
        .from('magic_link_tokens')
        .delete()
        .eq('email', email)
        .or('expires_at.lt.' + new Date().toISOString() + ',used_at.not.is.null')
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error)
    }
  }

  /**
   * Check if recipient exists
   */
  private async recipientExists(email: string): Promise<boolean> {
    if (!supabaseAdmin) return false

    try {
      const { data, error } = await supabaseAdmin
        .from('email_recipients')
        .select('id')
        .eq('email', email)
        .single()

      return !error && !!data
    } catch (error) {
      return false
    }
  }

  /**
   * Send welcome email for new users
   */
  private async sendWelcomeEmail(email: string): Promise<void> {
    try {
      const emailContent = {
        to: email,
        subject: 'Welcome to Agent Bio Summary feedback!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to our feedback community!</h2>
            <p>Hi there!</p>
            <p>Welcome to our feedback community! You can now provide feedback on our daily synthetic biology summaries.</p>
            <p>Your feedback helps us improve the quality and relevance of our content.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://agent-bio-summary.vercel.app'}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Visit Our Site</a></p>
            <p>Thanks for joining us!</p>
            <p>Best regards,<br>The Agent Bio Summary Team</p>
          </div>
        `,
        text: `
          Welcome to our feedback community!
          
          Hi there!
          
          Welcome to our feedback community! You can now provide feedback on our daily synthetic biology summaries.
          
          Your feedback helps us improve the quality and relevance of our content.
          
          Visit: ${process.env.NEXT_PUBLIC_APP_URL || 'https://agent-bio-summary.vercel.app'}
          
          Thanks for joining us!
          
          Best regards,
          The Agent Bio Summary Team
        `
      }

      await this.emailService.sendEmail(emailContent)
      console.log(`Welcome email sent to ${email}`)
    } catch (error) {
      console.error('Error sending welcome email:', error)
      // Don't throw error for welcome email failure
    }
  }

  /**
   * Logout user (invalidate session)
   */
  async logout(sessionToken: string): Promise<{ success: boolean; error?: string }> {
    if (!supabaseAdmin) {
      return { success: false, error: 'Database not configured' }
    }

    try {
      const { error } = await supabaseAdmin
        .from('user_sessions')
        .delete()
        .eq('session_token', sessionToken)

      if (error) {
        console.error('Error logging out user:', error)
        return { success: false, error: 'Failed to logout' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error logging out user:', error)
      return { success: false, error: 'Internal server error' }
    }
  }
}
