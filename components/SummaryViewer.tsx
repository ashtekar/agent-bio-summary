'use client'

import { useState, useEffect } from 'react'
import { SmartContentRenderer } from './SmartContentRenderer'
import FeedbackThankYou from './FeedbackThankYou'
import FeedbackComparison from './FeedbackComparison'
import FeedbackSuccess from './FeedbackSuccess'
import UserIdentificationModal from './UserIdentificationModal'
import { SessionSummary } from '@/lib/types'
import { useUserSession } from '@/lib/contexts/UserSessionContext'
import { toast } from 'react-hot-toast'

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
  const { session, validateSession } = useUserSession()
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [selectedSummary, setSelectedSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Feedback comparison state
  const [showThankYou, setShowThankYou] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [feedbackSessionId, setFeedbackSessionId] = useState<string>('')
  const [feedbackRecipientId, setFeedbackRecipientId] = useState<string>('')
  const [feedbackSummaryId, setFeedbackSummaryId] = useState<string>('')
  const [feedbackArticleId, setFeedbackArticleId] = useState<string>('')
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null)
  
  // User identification modal state
  const [showUserIdentification, setShowUserIdentification] = useState(false)
  const [pendingFeedback, setPendingFeedback] = useState<{
    type: 'summary' | 'article' | 'top10'
    value: 'up' | 'down'
    summaryId?: string
    articleId?: string
  } | null>(null)

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

  const handleFeedback = async (feedbackType: 'summary' | 'article' | 'top10', feedbackValue: 'up' | 'down', articleId?: string) => {
    if (!selectedSummary) return

    // Check if user is authenticated
    if (!session?.sessionToken) {
      // Store pending feedback and show identification modal
      setPendingFeedback({
        type: feedbackType,
        value: feedbackValue,
        summaryId: selectedSummary.id,
        articleId
      })
      setShowUserIdentification(true)
      return
    }

    // Validate session before submitting feedback
    const isValidSession = await validateSession()
    if (!isValidSession) {
      // Session invalid, show identification modal
      setPendingFeedback({
        type: feedbackType,
        value: feedbackValue,
        summaryId: selectedSummary.id,
        articleId
      })
      setShowUserIdentification(true)
      return
    }

    await submitFeedback(feedbackType, feedbackValue, selectedSummary.id, articleId)
  }

  const submitFeedback = async (feedbackType: 'summary' | 'article' | 'top10', feedbackValue: 'up' | 'down', summaryId: string, articleId?: string) => {
    if (!session?.sessionToken) return

    try {
      const params = new URLSearchParams({
        sessionToken: session.sessionToken,
        summaryId,
        feedbackType,
        feedbackValue,
        articleId: articleId || 'null'
      })

      const response = await fetch(`/api/feedback?${params}`)
      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Feedback recorded!')
        
        // Show comparison flow if applicable
        if (result.showComparison) {
          setFeedbackRecipientId(result.recipientId)
          setFeedbackSummaryId(result.summaryId)
          // Store article ID for article-level comparisons
          if (feedbackType === 'article' && articleId) {
            setFeedbackArticleId(articleId)
          } else {
            setFeedbackArticleId('')
          }
          setShowThankYou(true)
        }
      } else {
        toast.error(result.error || 'Failed to record feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to record feedback')
    }
  }

  const submitFeedbackDirect = async (feedbackType: 'summary' | 'article' | 'top10', feedbackValue: 'up' | 'down', summaryId: string, articleId?: string) => {
    if (!selectedSummary) return

    try {
      const response = await fetch(`/api/feedback?sessionToken=${session?.sessionToken}&feedbackType=${feedbackType}&feedbackValue=${feedbackValue}&summaryId=${summaryId}${articleId ? `&articleId=${articleId}` : ''}`)
      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Feedback recorded!')
        
        // Show comparison flow if applicable
        if (result.showComparison) {
          setFeedbackRecipientId(result.recipientId)
          setFeedbackSummaryId(result.summaryId)
          // Store article ID for article-level comparisons
          if (feedbackType === 'article' && articleId) {
            setFeedbackArticleId(articleId)
          } else {
            setFeedbackArticleId('')
          }
          setShowThankYou(true)
        }
      } else {
        toast.error(result.error || 'Failed to record feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to record feedback')
    }
  }

  const handleUserIdentificationSuccess = async () => {
    if (pendingFeedback) {
      // Submit the feedback directly without session validation since we just authenticated
      await submitFeedbackDirect(
        pendingFeedback.type,
        pendingFeedback.value,
        pendingFeedback.summaryId || '',
        pendingFeedback.articleId
      )
      setPendingFeedback(null)
    }
  }

  const handleStartComparison = (sessionId: string) => {
    setFeedbackSessionId(sessionId)
    setShowThankYou(false)
    setShowComparison(true)
  }

  const handleComparisonComplete = (summary: SessionSummary) => {
    setSessionSummary(summary)
    setShowComparison(false)
    setShowSuccess(true)
  }

  const handleCloseFeedback = () => {
    setShowThankYou(false)
    setShowComparison(false)
    setShowSuccess(false)
    setFeedbackSessionId('')
    setFeedbackRecipientId('')
    setFeedbackSummaryId('')
    setFeedbackArticleId('')
    setSessionSummary(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
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
      <div className="bg-white/10 backdrop-blur-md rounded-lg card-shadow p-6 fade-in">
        <h2 className="text-lg font-semibold text-white mb-4">Daily Summaries</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaries.map((summary) => (
            <div
              key={summary.id}
              onClick={() => setSelectedSummary(summary)}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-300 btn-hover ${
                selectedSummary?.id === summary.id
                  ? 'border-blue-400 bg-blue-500/20 text-white'
                  : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10 text-white'
              }`}
            >
              <h3 className="font-medium">{summary.title}</h3>
              <p className="text-sm text-white/70 mt-1">{summary.articles.length} articles</p>
              <div className="flex items-center mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  summary.emailSent ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
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
        <div className="bg-white/10 backdrop-blur-md rounded-lg card-shadow p-6 fade-in">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">{selectedSummary.title}</h2>
              <p className="text-white/70 mt-1">{selectedSummary.date}</p>
            </div>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
              Export PDF
            </button>
          </div>

          {/* Summary Content */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-white">Daily Overview</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFeedback('summary', 'up')}
                    className="text-green-400 hover:text-green-300 p-1 btn-hover"
                    title="Thumbs up"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => handleFeedback('summary', 'down')}
                    className="text-red-400 hover:text-red-300 p-1 btn-hover"
                    title="Thumbs down"
                  >
                    👎
                  </button>
                </div>
              </div>
              <SmartContentRenderer 
                content={selectedSummary.dailySummary || ''} 
                showFormatToggle={true}
                className="text-white/90"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-white">Top 10 Articles Summary</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFeedback('top10', 'up')}
                    className="text-green-400 hover:text-green-300 p-1 btn-hover"
                    title="Thumbs up"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => handleFeedback('top10', 'down')}
                    className="text-red-400 hover:text-red-300 p-1 btn-hover"
                    title="Thumbs down"
                  >
                    👎
                  </button>
                </div>
              </div>
              <SmartContentRenderer 
                content={selectedSummary.top10Summary || ''} 
                showFormatToggle={true}
                className="text-white/90"
              />
            </div>

            {/* Articles List */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Articles ({selectedSummary.articles.length})</h3>
              <div className="space-y-4">
                {selectedSummary.articles.map((article) => (
                  <div key={article.id} className="border border-white/20 bg-white/5 rounded-lg p-4 fade-in">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-white">{article.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-white/70 bg-white/10 px-2 py-1 rounded border border-white/20">
                          Score: {article.relevanceScore}
                        </span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleFeedback('article', 'up', article.id)}
                            className="text-green-400 hover:text-green-300 p-1 btn-hover"
                            title="Thumbs up"
                          >
                            👍
                          </button>
                          <button
                            onClick={() => handleFeedback('article', 'down', article.id)}
                            className="text-red-400 hover:text-red-300 p-1 btn-hover"
                            title="Thumbs down"
                          >
                            👎
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-white/80 mb-2">
                      <SmartContentRenderer 
                        content={article.summary || ''} 
                        showFormatToggle={false}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-white/60">
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

      {/* Feedback Modals */}
      {showThankYou && (
        <FeedbackThankYou
          recipientId={feedbackRecipientId}
          summaryId={feedbackSummaryId}
          articleId={feedbackArticleId}
          onStartComparison={handleStartComparison}
          onClose={handleCloseFeedback}
        />
      )}

      {showComparison && (
        <FeedbackComparison
          sessionId={feedbackSessionId}
          recipientId={feedbackRecipientId}
          summaryId={feedbackSummaryId}
          onComplete={handleComparisonComplete}
          onClose={handleCloseFeedback}
        />
      )}

      {showSuccess && sessionSummary && (
        <FeedbackSuccess
          summary={sessionSummary}
          onClose={handleCloseFeedback}
        />
      )}

      {/* User Identification Modal */}
      <UserIdentificationModal
        isOpen={showUserIdentification}
        onClose={() => {
          setShowUserIdentification(false)
          setPendingFeedback(null)
        }}
        onSuccess={handleUserIdentificationSuccess}
        feedbackContext={pendingFeedback || undefined}
      />
    </div>
  )
}
