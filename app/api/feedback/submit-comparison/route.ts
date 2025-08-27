import { NextRequest, NextResponse } from 'next/server'
import { ComparisonService } from '@/lib/comparisonService'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, comparisonOrder, userPreference } = await request.json()
    
    if (!sessionId || !comparisonOrder || !userPreference) {
      return NextResponse.json(
        { error: 'Missing required parameters: sessionId, comparisonOrder, and userPreference' },
        { status: 400 }
      )
    }
    
    if (!['A', 'B'].includes(userPreference)) {
      return NextResponse.json(
        { error: 'Invalid userPreference. Must be "A" or "B"' },
        { status: 400 }
      )
    }
    
    const orderNumber = parseInt(comparisonOrder, 10)
    if (isNaN(orderNumber) || orderNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid comparison order number' },
        { status: 400 }
      )
    }
    
    const comparisonService = new ComparisonService()
    const result = await comparisonService.recordPreference(sessionId, orderNumber, userPreference)
    
    // If there's a next comparison, get its data
    let nextComparison = null
    if (result.nextOrder) {
      nextComparison = await comparisonService.getComparisonData(sessionId, result.nextOrder)
    }
    
    return NextResponse.json({
      success: true,
      nextOrder: result.nextOrder,
      isComplete: result.isComplete,
      nextComparison
    })
    
  } catch (error) {
    console.error('Submit comparison error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit comparison' },
      { status: 500 }
    )
  }
}
