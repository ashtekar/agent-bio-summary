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
  sources?: string[] // Optional since we now get sites from database
  keywords: string[]
  maxArticles: number
  relevance_threshold?: number
}

export interface SystemSettings {
  scheduleTime: string
  emailTemplate: string
  summaryLength: 'short' | 'medium' | 'long'
  includeImages: boolean
  comparisonModel?: string
  comparisonTemperature?: number
  comparisonMaxTokens?: number
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

export interface SearchSite {
  id: string
  domain: string
  display_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SearchSiteRequest {
  domain: string
  display_name: string
}

export interface SearchSiteUpdateRequest {
  is_active: boolean
}

// Feedback Comparison System Types
export interface FeedbackComparison {
  id: string
  session_id: string
  recipient_id: string
  summary_id: string
  article_id: string
  current_summary: string
  advanced_summary: string
  current_model: string
  advanced_model: string
  user_preference: 'A' | 'B'
  comparison_order: number
  extraction_method: 'extracted' | 'generated'
  created_at: string
}

export interface ComparisonSession {
  session_id: string
  recipient_id: string
  summary_id: string
  total_comparisons: number
  completed_comparisons: number
  created_at: string
}

export interface ComparisonData {
  session_id: string
  comparison_order: number
  article: {
    id: string
    title: string
    source: string
    published_date: string
  }
  summary_a: {
    content: string
    model: string
    label: string
  }
  summary_b: {
    content: string
    model: string
    label: string
  }
  is_complete: boolean
}

export interface SessionSummary {
  session_id: string
  recipient_id: string
  summary_id: string
  comparisons: Array<{
    comparison_order: number
    article_title: string
    user_preference: 'A' | 'B'
    selected_model: string
  }>
  total_comparisons: number
  completed_comparisons: number
  created_at: string
}

export interface ArticleSummary {
  article_id: string
  title: string
  source: string
  published_date: string
  summary: string
}
