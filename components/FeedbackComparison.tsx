'use client'

import React, { useState, useEffect } from 'react'
import { ComparisonData, SessionSummary } from '@/lib/types'
import { toast } from 'react-hot-toast'

interface FeedbackComparisonProps {
  sessionId: string
  recipientId: string
  summaryId: string
  onComplete: (summary: SessionSummary) => void
  onClose: () => void
}

export default function FeedbackComparison({
  sessionId,
  recipientId,
  summaryId,
  onComplete,
  onClose
}: FeedbackComparisonProps) {
  const [currentComparison, setCurrentComparison] = useState<ComparisonData | null>(null)
  const [currentOrder, setCurrentOrder] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Load initial comparison data
  useEffect(() => {
    loadComparisonData(1)
  }, [])

  const loadComparisonData = async (order: number) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/feedback/comparison/${sessionId}/${order}`)
      
      if (!response.ok) {
        throw new Error('Failed to load comparison data')
      }
      
      const data: ComparisonData = await response.json()
      setCurrentComparison(data)
      setCurrentOrder(order)
    } catch (error) {
      console.error('Error loading comparison data:', error)
      toast.error('Failed to load comparison data')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferenceSelect = async (preference: 'A' | 'B') => {
    if (!currentComparison || isSubmitting) return

    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/feedback/submit-comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          comparisonOrder: currentOrder,
          userPreference: preference
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit preference')
      }

      const result = await response.json()
      
      // Show success toast
      toast.success('Feedback recorded! Moving to next comparison...')
      
      if (result.isComplete) {
        // Get session summary and complete
        const summaryResponse = await fetch(`/api/feedback/session/${sessionId}/summary`)
        if (summaryResponse.ok) {
          const summary: SessionSummary = await summaryResponse.json()
          setIsComplete(true)
          onComplete(summary)
        }
      } else if (result.nextComparison) {
        // Load next comparison
        setCurrentComparison(result.nextComparison)
        setCurrentOrder(result.nextOrder)
      }
      
    } catch (error) {
      console.error('Error submitting preference:', error)
      toast.error('Failed to submit preference')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Loading Comparison</h2>
            <p className="text-gray-600">Preparing your A/B comparison...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentComparison) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
            <p className="text-gray-600 mb-4">Failed to load comparison data</p>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Which summary do you prefer? ({currentOrder} of 3)
              </h2>
              <p className="text-gray-600 mt-1">
                Help us improve our AI-powered summaries by comparing two versions
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Article Info */}
        <div className="px-6 py-4 bg-gray-50">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">
            {currentComparison.article.title}
          </h3>
          <p className="text-gray-600">
            {currentComparison.article.source} • Published: {new Date(currentComparison.article.published_date).toLocaleDateString()}
          </p>
        </div>

        {/* Comparison Interface */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary A */}
            <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-lg text-gray-900">
                  📄 Summary A
                </h4>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {currentComparison.summary_a.label}
                </span>
              </div>
              <div className="prose prose-sm max-w-none mb-4">
                <div 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: currentComparison.summary_a.content }}
                />
              </div>
              <button
                onClick={() => handlePreferenceSelect('A')}
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Recording...' : 'Select A'}
              </button>
            </div>

            {/* Summary B */}
            <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-lg text-gray-900">
                  📄 Summary B
                </h4>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {currentComparison.summary_b.label}
                </span>
              </div>
              <div className="prose prose-sm max-w-none mb-4">
                <div 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: currentComparison.summary_b.content }}
                />
              </div>
              <button
                onClick={() => handlePreferenceSelect('B')}
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Recording...' : 'Select B'}
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <span className="text-blue-600 text-lg mr-2">💡</span>
              <div>
                <h5 className="font-semibold text-blue-900 mb-1">Tips for Comparison</h5>
                <p className="text-blue-800 text-sm">
                  Consider which summary is more informative, engaging, and accurate. 
                  Think about clarity, completeness, and how well it captures the key points.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
