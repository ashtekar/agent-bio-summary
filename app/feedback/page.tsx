'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import FeedbackThankYou from '@/components/FeedbackThankYou'
import FeedbackComparison from '@/components/FeedbackComparison'
import FeedbackSuccess from '@/components/FeedbackSuccess'
import toast from 'react-hot-toast'

interface FeedbackData {
  recipientId: string
  summaryId: string
  feedbackType: string
  feedbackValue: string
}

export default function FeedbackPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null)
  
  // Modal states
  const [showThankYou, setShowThankYou] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [feedbackSessionId, setFeedbackSessionId] = useState<string | null>(null)
  const [feedbackRecipientId, setFeedbackRecipientId] = useState<string | null>(null)
  const [feedbackSummaryId, setFeedbackSummaryId] = useState<string | null>(null)
  const [sessionSummary, setSessionSummary] = useState<any>(null)

  useEffect(() => {
    const initializeFeedback = async () => {
      try {
        const recipientId = searchParams.get('recipientId')
        const summaryId = searchParams.get('summaryId')
        const feedbackType = searchParams.get('feedbackType')
        const feedbackValue = searchParams.get('feedbackValue')

        if (!recipientId || !summaryId || !feedbackType || !feedbackValue) {
          setError('Missing required parameters')
          setLoading(false)
          return
        }

        setFeedbackData({
          recipientId,
          summaryId,
          feedbackType,
          feedbackValue
        })

        // Submit the initial feedback
        const response = await fetch(`/api/feedback?recipientId=${recipientId}&summaryId=${summaryId}&feedbackType=${feedbackType}&feedbackValue=${feedbackValue}`)
        
        if (!response.ok) {
          throw new Error('Failed to submit feedback')
        }

        const result = await response.json()
        
        if (result.success) {
          toast.success('Thank you for your feedback!')
          
          if (result.showComparison) {
            // Show the thank you page which will lead to comparison
            setFeedbackRecipientId(result.recipientId)
            setFeedbackSummaryId(result.summaryId)
            setShowThankYou(true)
          } else {
            // Just show success message
            toast.success('Feedback submitted successfully!')
          }
        } else {
          throw new Error('Failed to submit feedback')
        }

      } catch (err) {
        console.error('Error initializing feedback:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
        toast.error('Failed to submit feedback')
      } finally {
        setLoading(false)
      }
    }

    initializeFeedback()
  }, [searchParams])

  const handleStartComparison = async (sessionId: string) => {
    try {
      setFeedbackSessionId(sessionId)
      setShowThankYou(false)
      setShowComparison(true)
    } catch (err) {
      console.error('Error starting comparison:', err)
      toast.error('Failed to start comparison')
    }
  }

  const handleComparisonComplete = async () => {
    try {
      if (!feedbackSessionId) {
        throw new Error('No session ID found')
      }

      const response = await fetch(`/api/feedback/session/${feedbackSessionId}/summary`)
      
      if (!response.ok) {
        throw new Error('Failed to get session summary')
      }

      const result = await response.json()
      
      if (result.success) {
        setSessionSummary(result.data)
        setShowComparison(false)
        setShowSuccess(true)
      } else {
        throw new Error('Failed to get session summary')
      }
    } catch (err) {
      console.error('Error completing comparison:', err)
      toast.error('Failed to complete comparison')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feedback form...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <p className="text-gray-600">Please check the link and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                AgentBioSummary
              </h1>
              <span className="ml-2 text-sm text-gray-500">
                Feedback System
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showThankYou && feedbackRecipientId && feedbackSummaryId && (
          <FeedbackThankYou
            recipientId={feedbackRecipientId}
            summaryId={feedbackSummaryId}
            onStartComparison={handleStartComparison}
            onClose={() => setShowThankYou(false)}
          />
        )}

        {showComparison && feedbackSessionId && feedbackRecipientId && feedbackSummaryId && (
          <FeedbackComparison
            sessionId={feedbackSessionId}
            recipientId={feedbackRecipientId}
            summaryId={feedbackSummaryId}
            onComplete={handleComparisonComplete}
            onClose={() => setShowComparison(false)}
          />
        )}

        {showSuccess && sessionSummary && (
          <FeedbackSuccess
            sessionSummary={sessionSummary}
            onClose={() => setShowSuccess(false)}
          />
        )}

        {!showThankYou && !showComparison && !showSuccess && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Thank you for your feedback!
            </h2>
            <p className="text-gray-600 mb-6">
              Your feedback has been recorded successfully.
            </p>
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <strong className="font-bold">Success: </strong>
              <span className="block sm:inline">
                Feedback submitted for {feedbackData?.feedbackType === 'top10' ? 'Top 10 Articles Summary' : 'Daily Summary'}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
