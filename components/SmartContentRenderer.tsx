'use client'

import { useState } from 'react'
import { HTMLContentRenderer } from './HTMLContentRenderer'
import { isHtmlContent } from '@/lib/contentUtils'

interface SmartContentRendererProps {
  content: string
  className?: string
  showFormatToggle?: boolean
  defaultFormat?: 'auto' | 'html' | 'text'
}

export function SmartContentRenderer({ 
  content, 
  className = '', 
  showFormatToggle = false,
  defaultFormat = 'auto'
}: SmartContentRendererProps) {
  const [format, setFormat] = useState<'auto' | 'html' | 'text'>(defaultFormat)
  
  const isHtml = isHtmlContent(content)
  const shouldRenderAsHtml = format === 'html' || (format === 'auto' && isHtml)

  const handleCopyContent = async (asHtml: boolean = false) => {
    try {
      const textToCopy = asHtml ? content : content.replace(/<[^>]*>/g, '')
      await navigator.clipboard.writeText(textToCopy)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy content:', error)
    }
  }

  return (
    <div className="space-y-2">
      {/* Format Controls */}
      {showFormatToggle && (
        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Format:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setFormat('auto')}
                className={`px-2 py-1 text-xs rounded ${
                  format === 'auto' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Auto
              </button>
              <button
                onClick={() => setFormat('html')}
                className={`px-2 py-1 text-xs rounded ${
                  format === 'html' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                HTML
              </button>
              <button
                onClick={() => setFormat('text')}
                className={`px-2 py-1 text-xs rounded ${
                  format === 'text' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Text
              </button>
            </div>
          </div>
          
          {/* Copy Options */}
          <div className="flex space-x-1">
            <button
              onClick={() => handleCopyContent(true)}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              title="Copy as HTML"
            >
              Copy HTML
            </button>
            <button
              onClick={() => handleCopyContent(false)}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              title="Copy as Text"
            >
              Copy Text
            </button>
          </div>
        </div>
      )}

      {/* Format Indicator */}
      {showFormatToggle && (
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            shouldRenderAsHtml 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {shouldRenderAsHtml ? 'HTML' : 'Text'}
          </span>
          {format === 'auto' && (
            <span className="text-xs text-gray-500">
              {isHtml ? 'Auto-detected HTML' : 'Auto-detected Text'}
            </span>
          )}
        </div>
      )}

      {/* Content Rendering */}
      <div className={className}>
        {shouldRenderAsHtml ? (
          <HTMLContentRenderer content={content} />
        ) : (
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        )}
      </div>
    </div>
  )
}
