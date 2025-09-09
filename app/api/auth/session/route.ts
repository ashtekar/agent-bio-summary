import { NextRequest, NextResponse } from 'next/server'
import { MagicLinkService } from '@/lib/magicLinkService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionToken = searchParams.get('token')

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 400 }
      )
    }

    const magicLinkService = new MagicLinkService()

    try {
      const result = await magicLinkService.validateSession(sessionToken)
      
      if (result.valid) {
        return NextResponse.json({
          success: true,
          valid: true,
          recipientId: result.recipientId
        })
      } else {
        return NextResponse.json({
          success: true,
          valid: false,
          error: result.error || 'Invalid session'
        })
      }
    } catch (error) {
      console.error('Error validating session:', error)
      return NextResponse.json(
        { error: 'Failed to validate session' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in session API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionToken = searchParams.get('token')

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 400 }
      )
    }

    const magicLinkService = new MagicLinkService()

    try {
      const result = await magicLinkService.logout(sessionToken)
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Logged out successfully'
        })
      } else {
        return NextResponse.json(
          { error: result.error || 'Failed to logout' },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('Error logging out:', error)
      return NextResponse.json(
        { error: 'Failed to logout' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in logout API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
