import { NextRequest, NextResponse } from 'next/server'
import { MagicLinkService } from '@/lib/magicLinkService'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

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
      const result = await magicLinkService.createSessionForExistingUser(email)
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Welcome back!',
          recipientId: result.recipientId,
          sessionToken: result.sessionToken
        })
      } else {
        return NextResponse.json(
          { error: result.error || 'User not found' },
          { status: 404 }
        )
      }
    } catch (error) {
      console.error('Error looking up user:', error)
      return NextResponse.json(
        { error: 'Failed to lookup user. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in lookup-user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
