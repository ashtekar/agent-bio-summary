'use client'

import { useState, useEffect } from 'react'

interface Article {
  id: string
  title: string
  url: string
  source: string
  publishedDate: string
  summary: string
  relevanceScore: number
}

interface DailySummary {
  id: string
  date: string
  title: string
  articles: Article[]
  top10Summary: string
  dailySummary: string
  emailSent: boolean
}

export function SummaryViewer() {
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [selectedSummary, setSelectedSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading summaries
    setTimeout(() => {
      const mockSummaries: DailySummary[] = [
        {
          id: '1',
          date: '2024-01-15',
          title: 'Daily Summary - January 15, 2024',
          emailSent: true,
          top10Summary: 'Today\'s top 10 synthetic biology articles include breakthroughs in CRISPR gene editing, new biofuel production methods, and advances in synthetic cell development. Key highlights include a novel approach to genome engineering and promising results in sustainable biomanufacturing.',
          dailySummary: 'The synthetic biology field saw significant progress today with 23 new articles published. Major themes include gene editing technologies, sustainable bioproduction, and synthetic cell engineering. Researchers are making strides in making complex biological systems more accessible and controllable.',
          articles: [
            {
              id: '1',
              title: 'Novel CRISPR-Cas9 System Shows Improved Precision in Gene Editing',
              url: 'https://example.com/article1',
              source: 'Nature Biotechnology',
              publishedDate: '2024-01-15',
              summary: 'Researchers developed a new CRISPR-Cas9 variant that reduces off-target effects by 90% while maintaining high editing efficiency.',
              relevanceScore: 9.5
            },
            {
              id: '2',
              title: 'Synthetic Biology Approach to Biofuel Production from Algae',
              url: 'https://example.com/article2',
              source: 'Science',
              publishedDate: '2024-01-15',
              summary: 'A team engineered algae to produce biofuels more efficiently, potentially making renewable energy more cost-effective.',
              relevanceScore: 8.8
            }
          ]
        }
      ]
      
      setSummaries(mockSummaries)
      setSelectedSummary(mockSummaries[0])
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Summaries</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaries.map((summary) => (
            <div
              key={summary.id}
              onClick={() => setSelectedSummary(summary)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedSummary?.id === summary.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-medium text-gray-900">{summary.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{summary.articles.length} articles</p>
              <div className="flex items-center mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  summary.emailSent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {summary.emailSent ? 'Email Sent' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Summary Details */}
      {selectedSummary && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{selectedSummary.title}</h2>
              <p className="text-gray-500 mt-1">{selectedSummary.date}</p>
            </div>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
              Export PDF
            </button>
          </div>

          {/* Summary Content */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Daily Overview</h3>
              <p className="text-gray-700 leading-relaxed">{selectedSummary.dailySummary}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Top 10 Articles Summary</h3>
              <p className="text-gray-700 leading-relaxed">{selectedSummary.top10Summary}</p>
            </div>

            {/* Articles List */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Articles ({selectedSummary.articles.length})</h3>
              <div className="space-y-4">
                {selectedSummary.articles.map((article) => (
                  <div key={article.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{article.title}</h4>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Score: {article.relevanceScore}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{article.summary}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{article.source}</span>
                      <span>{article.publishedDate}</span>
                    </div>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block"
                    >
                      Read Full Article →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
