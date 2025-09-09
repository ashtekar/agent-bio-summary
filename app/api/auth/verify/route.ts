import { NextRequest, NextResponse } from 'next/server'
import { MagicLinkService } from '@/lib/magicLinkService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/auth/error?message=Missing token', request.url))
    }

    const magicLinkService = new MagicLinkService()

    try {
      const result = await magicLinkService.verifyMagicLinkToken(token)
      
      if (result.success && result.sessionToken) {
        // Redirect to summary page with session token
        const redirectUrl = new URL('/', request.url)
        redirectUrl.searchParams.set('session', result.sessionToken)
        
        if (result.isNewUser) {
          redirectUrl.searchParams.set('welcome', 'true')
        }
        
        return NextResponse.redirect(redirectUrl)
      } else {
        // Redirect to error page
        const errorMessage = result.error || 'Invalid or expired token'
        return NextResponse.redirect(new URL(`/auth/error?message=${encodeURIComponent(errorMessage)}`, request.url))
      }
    } catch (error) {
      console.error('Error verifying magic link token:', error)
      return NextResponse.redirect(new URL('/auth/error?message=Verification failed', request.url))
    }
  } catch (error) {
    console.error('Error in verify API:', error)
    return NextResponse.redirect(new URL('/auth/error?message=Internal server error', request.url))
  }
}
