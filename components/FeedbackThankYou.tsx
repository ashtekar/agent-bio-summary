'use client'

import React, { useState } from 'react'
import { toast } from 'react-hot-toast'

interface FeedbackThankYouProps {
  recipientId: string
  summaryId: string
  articleId?: string
  onStartComparison: (sessionId: string) => void
  onClose: () => void
}

export default function FeedbackThankYou({
  recipientId,
  summaryId,
  articleId,
  onStartComparison,
  onClose
}: FeedbackThankYouProps) {
  const [isStarting, setIsStarting] = useState(false)

  const handleStartComparison = async () => {
    try {
      setIsStarting(true)
      
      const response = await fetch('/api/feedback/start-comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          summaryId,
          articleId: articleId || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start comparison session')
      }

      const result = await response.json()
      onStartComparison(result.session.session_id)
      
    } catch (error) {
      console.error('Error starting comparison:', error)
      toast.error('Failed to start comparison session')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Thank you for your feedback!
          </h2>
          <p className="text-gray-300">
            Your thumbs up/down helps us improve our summaries.
          </p>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <p className="text-gray-300 mb-6">
            Now, help us make our summaries even better by comparing two versions:
          </p>

          {/* A/B Comparison Introduction */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <h3 className="font-semibold text-lg text-white mb-2">
                  A/B Comparison Survey
                </h3>
                <p className="text-gray-300 mb-4">
                  We'll show you between 1-3 summaries and ask which you prefer!
                </p>
                
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Compare current vs advanced AI models
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Takes about 3-5 minutes to complete. Be patient with the AI models as they may take a while to generate the summaries.
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Helps us train better AI models
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStartComparison}
              disabled={isStarting}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isStarting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Starting...
                </div>
              ) : (
                'Start Comparison'
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Maybe Later
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-gray-800 border border-gray-600 rounded-lg">
            <div className="flex items-start">
              <span className="text-gray-400 text-lg mr-2">ℹ️</span>
              <div className="text-sm text-gray-300">
                <p className="font-medium mb-1 text-white">Why A/B comparisons?</p>
                <p>
                  Direct preference data helps us fine-tune our AI models using advanced techniques 
                  like Direct Preference Optimization (DPO), leading to better summary quality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
