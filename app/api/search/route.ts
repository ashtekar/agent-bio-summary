import { NextRequest, NextResponse } from 'next/server'
import { WebSearchModule } from '@/lib/webSearch'
import { SearchSettings } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keywords, timeWindow, maxArticles } = body

    const searchSettings: SearchSettings = {
      timeWindow: timeWindow || 24,
      sources: ['Nature', 'Science', 'Cell', 'PNAS', 'PubMed', 'arXiv'],
      keywords: keywords || ['synthetic biology', 'CRISPR', 'gene editing'],
      maxArticles: maxArticles || 50
    }

    const webSearch = new WebSearchModule(searchSettings)
    const articles = await webSearch.searchArticles()

    return NextResponse.json({
      success: true,
      articles,
      totalFound: articles.length,
      searchTime: new Date().toISOString(),
      keywords: searchSettings.keywords
    })

  } catch (error) {
    console.error('Error in search API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search articles' },
      { status: 500 }
    )
  }
}
