'use client'

import React from 'react'
import { SessionSummary } from '@/lib/types'

interface FeedbackSuccessProps {
  summary: SessionSummary
  onClose: () => void
}

export default function FeedbackSuccess({ summary, onClose }: FeedbackSuccessProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            All feedback completed!
          </h2>
          <p className="text-gray-300">
            Thank you for helping us improve our AI-powered summaries!
          </p>
        </div>

        {/* Feedback Summary */}
        <div className="p-6">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-lg text-white mb-3">
              📊 Your Feedback Summary
            </h3>
            
            <div className="space-y-3">
              {(summary.comparisons || []).map((comparison, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded border border-gray-600">
                  <div className="flex-1">
                    <div className="font-medium text-white">
                      ✅ Comparison {comparison.comparison_order}: "{comparison.article_title}"
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      Your Choice: Summary {comparison.user_preference} ({comparison.selected_model})
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      comparison.user_preference === 'A' 
                        ? 'bg-blue-600 text-blue-100' 
                        : 'bg-green-600 text-green-100'
                    }`}>
                      {comparison.user_preference === 'A' ? 'Model A' : 'Model B'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-600 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {summary.completed_comparisons}
              </div>
              <div className="text-sm text-blue-100">
                Comparisons Completed
              </div>
            </div>
            <div className="bg-green-600 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {Math.round((summary.completed_comparisons / summary.total_comparisons) * 100)}%
              </div>
              <div className="text-sm text-green-100">
                Completion Rate
              </div>
            </div>
          </div>

          {/* Model Preferences */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-white mb-2">
              🤖 Model Preference Analysis
            </h4>
            <div className="text-sm text-gray-300">
              {(() => {
                const comparisons = summary.comparisons || []
                const modelACount = comparisons.filter(c => c.user_preference === 'A').length
                const modelBCount = comparisons.filter(c => c.user_preference === 'B').length
                
                if (modelACount > modelBCount) {
                  return `You preferred the Current Model (${modelACount} vs ${modelBCount} selections)`
                } else if (modelBCount > modelACount) {
                  return `You preferred the Advanced Model (${modelBCount} vs ${modelACount} selections)`
                } else {
                  return 'You showed equal preference for both models'
                }
              })()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
