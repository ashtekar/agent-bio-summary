import { NextRequest, NextResponse } from 'next/server'
import { ComparisonService } from '@/lib/comparisonService'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string; order: string } }
) {
  try {
    const { sessionId, order } = params
    
    if (!sessionId || !order) {
      return NextResponse.json(
        { error: 'Missing required parameters: sessionId and order' },
        { status: 400 }
      )
    }
    
    const orderNumber = parseInt(order, 10)
    if (isNaN(orderNumber) || orderNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid order number' },
        { status: 400 }
      )
    }
    
    const comparisonService = new ComparisonService()
    const comparisonData = await comparisonService.getComparisonData(sessionId, orderNumber)
    
    return NextResponse.json(comparisonData)
    
  } catch (error) {
    console.error('Get comparison data error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get comparison data' },
      { status: 500 }
    )
  }
}
