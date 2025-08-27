import { NextRequest, NextResponse } from 'next/server'
import { ComparisonService } from '@/lib/comparisonService'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    
    console.log(`Getting session summary for sessionId: ${sessionId}`)
    
    if (!sessionId) {
      console.error('Missing sessionId parameter')
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: sessionId' },
        { status: 400 }
      )
    }
    
    const comparisonService = new ComparisonService()
    const sessionSummary = await comparisonService.getSessionSummary(sessionId)
    
    console.log(`Session summary retrieved successfully:`, {
      session_id: sessionSummary.session_id,
      total_comparisons: sessionSummary.total_comparisons,
      completed_comparisons: sessionSummary.completed_comparisons
    })
    
    return NextResponse.json({ success: true, data: sessionSummary })
    
  } catch (error) {
    console.error('Get session summary error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get session summary' 
      },
      { status: 500 }
    )
  }
}
