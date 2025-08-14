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
    const fetchSummaries = async () => {
      try {
        setLoading(true)
        
        const response = await fetch('/api/summaries')
        const result = await response.json()
        
        if (response.ok && result.success) {
          setSummaries(result.summaries)
          // Select the most recent summary if available
          if (result.summaries.length > 0) {
            setSelectedSummary(result.summaries[0])
          }
        } else {
          console.error('Failed to fetch summaries:', result.error)
          // Fallback to empty array if API fails
          setSummaries([])
        }
      } catch (error) {
        console.error('Error fetching summaries:', error)
        setSummaries([])
      } finally {
        setLoading(false)
      }
    }

    fetchSummaries()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (summaries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Summaries</h2>
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Summaries Available</h3>
            <p className="text-gray-500 mb-4">
              No daily summaries have been generated yet. Use the "Run Now" button on the Dashboard to generate your first summary.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
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
