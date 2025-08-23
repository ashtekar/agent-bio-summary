export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  
  // Get day with ordinal suffix
  const day = date.getDate()
  const daySuffix = getDaySuffix(day)
  
  // Get month name
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  
  // Get year
  const year = date.getFullYear()
  
  // Get time in 12-hour format
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  
  return `${day}${daySuffix} ${month} ${year} at ${time}`
}

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th'
  }
  
  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

export function formatLastRun(dateString: string): string {
  if (dateString === 'Never') {
    return 'Never'
  }
  
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }
}

/**
 * Validates if a domain string is in a valid format
 * Supports subdomains like news.mit.edu, www.example.com, etc.
 */
export function isValidDomain(domain: string): boolean {
  // Enhanced domain validation regex that supports subdomains
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/
  return domainRegex.test(domain)
}

/**
 * Test cases for domain validation
 * Uncomment to test:
 * 
 * Valid domains:
 * - example.com
 * - news.mit.edu
 * - www.google.com
 * - sub.domain.example.co.uk
 * - api-v1.example.com
 * 
 * Invalid domains:
 * - .example.com (starts with dot)
 * - example. (ends with dot)
 * - example (no TLD)
 * - example..com (double dots)
 * - -example.com (starts with hyphen)
 * - example-.com (ends with hyphen)
 */
