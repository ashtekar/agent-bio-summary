export interface Article {
  id: string
  title: string
  url: string
  source: string
  publishedDate: string
  content: string
  summary: string
  relevanceScore: number
  keywords: string[]
}

export interface DailySummary {
  id: string
  date: string
  title: string
  articles: Article[]
  top10Summary: string
  dailySummary: string
  emailSent: boolean
  createdAt: string
  updatedAt: string
}

export interface EmailRecipient {
  id: string
  email: string
  name: string
  active?: boolean
  is_active?: boolean
  createdAt?: string
  created_at?: string
}

export interface SearchSettings {
  timeWindow: number
  sources: string[]
  keywords: string[]
  maxArticles: number
}

export interface SystemSettings {
  scheduleTime: string
  emailTemplate: string
  summaryLength: 'short' | 'medium' | 'long'
  includeImages: boolean
}

export interface SystemStatus {
  lastRun: string
  articlesFound: number
  summariesGenerated: number
  emailSent: boolean
  nextScheduledRun: string
  isRunning: boolean
}

export interface SearchResult {
  articles: Article[]
  totalFound: number
  searchTime: string
  keywords: string[]
}

export interface SummaryGenerationRequest {
  articles: Article[]
  targetAudience: string
  summaryLength: 'short' | 'medium' | 'long'
}

export interface EmailRequest {
  recipients: EmailRecipient[]
  summary: DailySummary
  template: string
}
