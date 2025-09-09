import { NextRequest, NextResponse } from 'next/server'
import { MagicLinkService } from '@/lib/magicLinkService'

export async function POST(request: NextRequest) {
  try {
    const { email, feedbackContext } = await request.json()

    // Validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const magicLinkService = new MagicLinkService()

    try {
      await magicLinkService.sendMagicLinkEmail(email, feedbackContext)
      
      return NextResponse.json({
        success: true,
        message: 'Magic link sent to your email'
      })
    } catch (error) {
      console.error('Error sending magic link:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('Too many magic link requests')) {
          return NextResponse.json(
            { error: 'Too many requests. Please wait 1 hour before requesting another magic link.' },
            { status: 429 }
          )
        }
      }

      return NextResponse.json(
        { error: 'Failed to send magic link. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in send-magic-link API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
