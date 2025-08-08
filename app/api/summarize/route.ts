import { NextRequest, NextResponse } from 'next/server'
import { SummaryGenerator } from '@/lib/summaryGenerator'
import { Article } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articles, summaryLength } = body

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const summaryGenerator = new SummaryGenerator(process.env.OPENAI_API_KEY)

    // Generate both types of summaries
    const [dailySummary, top10Summary] = await Promise.all([
      summaryGenerator.generateDailySummary(articles),
      summaryGenerator.generateTop10Summary(articles)
    ])

    return NextResponse.json({
      success: true,
      dailySummary,
      top10Summary,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in summarize API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
