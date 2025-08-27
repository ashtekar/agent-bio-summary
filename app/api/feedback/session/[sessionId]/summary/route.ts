import { NextRequest, NextResponse } from 'next/server'
import { ComparisonService } from '@/lib/comparisonService'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameter: sessionId' },
        { status: 400 }
      )
    }
    
    const comparisonService = new ComparisonService()
    const sessionSummary = await comparisonService.getSessionSummary(sessionId)
    
    return NextResponse.json(sessionSummary)
    
  } catch (error) {
    console.error('Get session summary error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get session summary' },
      { status: 500 }
    )
  }
}
