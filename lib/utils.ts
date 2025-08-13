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
