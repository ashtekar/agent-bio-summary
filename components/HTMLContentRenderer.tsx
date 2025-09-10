'use client'

import DOMPurify from 'dompurify'

interface HTMLContentRendererProps {
  content: string
  className?: string
}

export function HTMLContentRenderer({ content, className = '' }: HTMLContentRendererProps) {
  // Sanitize HTML content
  const sanitizedHtml = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false
  })

  return (
    <div 
      className={`prose prose-sm max-w-none prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
