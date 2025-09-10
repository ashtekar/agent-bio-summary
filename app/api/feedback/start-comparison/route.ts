import { NextRequest, NextResponse } from 'next/server'
import { ComparisonService } from '@/lib/comparisonService'

export async function POST(request: NextRequest) {
  try {
    const { recipientId, summaryId, articleId } = await request.json()
    
    if (!recipientId || !summaryId) {
      return NextResponse.json(
        { error: 'Missing required parameters: recipientId and summaryId' },
        { status: 400 }
      )
    }
    
    const comparisonService = new ComparisonService()
    const session = await comparisonService.createSession(recipientId, summaryId, articleId)
    
    // Get the first comparison data
    const firstComparison = await comparisonService.getComparisonData(session.session_id, 1)
    
    return NextResponse.json({
      session,
      firstComparison
    })
    
  } catch (error) {
    console.error('Start comparison error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start comparison session' },
      { status: 500 }
    )
  }
}
