/**
 * Detects if content contains HTML markup
 */
export function isHtmlContent(content: string): boolean {
  if (!content || typeof content !== 'string') return false
  
  // Check for HTML tags
  const htmlTagRegex = /<[^>]*>/
  if (htmlTagRegex.test(content)) return true
  
  // Check for HTML entities
  const htmlEntityRegex = /&[a-zA-Z0-9#]+;/
  if (htmlEntityRegex.test(content)) return true
  
  return false
}

/**
 * Analyzes content and returns content type information
 */
export function analyzeContent(content: string): {
  isHtml: boolean
  confidence: number
  detectedTags: string[]
} {
  if (!content || typeof content !== 'string') {
    return { isHtml: false, confidence: 0, detectedTags: [] }
  }

  const detectedTags: string[] = []
  const htmlTagRegex = /<(\/?)([a-zA-Z0-9]+)[^>]*>/g
  let match

  while ((match = htmlTagRegex.exec(content)) !== null) {
    const tagName = match[2].toLowerCase()
    if (!detectedTags.includes(tagName)) {
      detectedTags.push(tagName)
    }
  }

  const isHtml = detectedTags.length > 0
  const confidence = isHtml ? Math.min(100, detectedTags.length * 20) : 0

  return { isHtml, confidence, detectedTags }
}

/**
 * Truncates content for preview while preserving HTML structure
 */
export function truncateHtmlContent(content: string, maxLength: number = 200): string {
  if (!isHtmlContent(content)) {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
  }

  // For HTML content, we'll do a simple truncation
  // In a more sophisticated implementation, you might want to parse and truncate properly
  const textContent = content.replace(/<[^>]*>/g, '')
  if (textContent.length <= maxLength) return content

  return textContent.substring(0, maxLength) + '...'
}
