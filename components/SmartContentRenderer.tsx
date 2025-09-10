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
        <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/20">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-white/80">Format:</span>
            <div className="flex space-x-1">
              <button
                onClick={() => setFormat('auto')}
                className={`px-2 py-1 text-xs rounded transition-all duration-300 ${
                  format === 'auto' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20 btn-hover'
                }`}
              >
                Auto
              </button>
              <button
                onClick={() => setFormat('html')}
                className={`px-2 py-1 text-xs rounded transition-all duration-300 ${
                  format === 'html' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20 btn-hover'
                }`}
              >
                HTML
              </button>
              <button
                onClick={() => setFormat('text')}
                className={`px-2 py-1 text-xs rounded transition-all duration-300 ${
                  format === 'text' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20 btn-hover'
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
              className="px-2 py-1 text-xs bg-white/10 text-white/80 rounded hover:bg-white/20 btn-hover transition-all duration-300"
              title="Copy as HTML"
            >
              Copy HTML
            </button>
            <button
              onClick={() => handleCopyContent(false)}
              className="px-2 py-1 text-xs bg-white/10 text-white/80 rounded hover:bg-white/20 btn-hover transition-all duration-300"
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
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
            shouldRenderAsHtml 
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
              : 'bg-white/10 text-white/80 border-white/20'
          }`}>
            {shouldRenderAsHtml ? 'HTML' : 'Text'}
          </span>
          {format === 'auto' && (
            <span className="text-xs text-white/60">
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
