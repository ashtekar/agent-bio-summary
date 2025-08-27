import { supabaseAdmin } from './supabase'
import { DailySummaryExtractor } from './summaryExtractor'
import { SummaryGenerator } from './summaryGenerator'
import { 
  ComparisonSession, 
  ComparisonData, 
  SessionSummary, 
  ArticleSummary,
  FeedbackComparison 
} from './types'

export class ComparisonService {
  private extractor: DailySummaryExtractor
  private summaryGenerator: SummaryGenerator
  
  constructor() {
    this.extractor = new DailySummaryExtractor()
    this.summaryGenerator = new SummaryGenerator(process.env.OPENAI_API_KEY || '')
  }
  
  /**
   * Creates a new comparison session and returns the first comparison data
   */
  async createSession(recipientId: string, summaryId: string): Promise<ComparisonSession> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin not configured')
    }
    
    // Generate session ID
    const sessionId = crypto.randomUUID()
    
    // Get summary and articles data
    const { data: summaryData, error: summaryError } = await supabaseAdmin
      .from('daily_summaries')
      .select('*')
      .eq('id', summaryId)
      .single()
    
    if (summaryError || !summaryData) {
      throw new Error('Summary not found')
    }
    
    // Get articles for this summary
    const { data: articles, error: articlesError } = await supabaseAdmin
      .from('articles')
      .select('*')
      .in('id', summaryData.article_ids || [])
      .order('relevance_score', { ascending: false })
      .limit(10)
    
    if (articlesError || !articles) {
      throw new Error('Articles not found')
    }
    
    // Try to extract summaries from daily summary first (cost-efficient)
    let articleSummaries: ArticleSummary[] = []
    let extractionMethod: 'extracted' | 'generated' = 'extracted'
    
    try {
      // Check if we have a top_10_summary to extract from
      if (summaryData.top_10_summary && summaryData.top_10_summary.trim().length > 0) {
        const extractedSummaries = await this.extractor.extractSummaries(summaryData.top_10_summary)
        
        if (this.extractor.validateExtraction(extractedSummaries)) {
          articleSummaries = this.extractor.mapToArticles(extractedSummaries, articles)
          console.log(`Successfully extracted ${articleSummaries.length} summaries`)
        } else {
          throw new Error('Extraction validation failed')
        }
      } else {
        throw new Error('No top_10_summary available for extraction')
      }
    } catch (error) {
      console.log('Extraction failed, falling back to generation:', error)
      extractionMethod = 'generated'
      
      // Fallback: Generate individual summaries
      const topArticles = articles.slice(0, 3) // Use top 3 articles
      articleSummaries = await this.generateIndividualSummaries(topArticles)
    }
    
    // Ensure we have at least 3 articles for comparison
    if (articleSummaries.length < 3) {
      throw new Error('Insufficient articles for comparison')
    }
    
    // Create comparison records for the first 3 articles
    const comparisonPromises = articleSummaries.slice(0, 3).map(async (articleSummary, index) => {
      const order = index + 1
      
      // Generate advanced model summary for comparison
      const advancedSummary = await this.generateAdvancedSummary(
        articleSummary.article_id,
        'gpt-5' // Default advanced model
      )
      
      return {
        session_id: sessionId,
        recipient_id: recipientId,
        summary_id: summaryId,
        article_id: articleSummary.article_id,
        current_summary: articleSummary.summary,
        advanced_summary: advancedSummary,
        current_model: 'gpt-4o-mini', // Current model
        advanced_model: 'gpt-5', // Advanced model
        comparison_order: order,
        extraction_method: extractionMethod
      }
    })
    
    const comparisonRecords = await Promise.all(comparisonPromises)
    
    // Insert all comparison records
    const { error: insertError } = await supabaseAdmin
      .from('feedback_comparisons')
      .insert(comparisonRecords)
    
    if (insertError) {
      throw new Error(`Failed to create comparison records: ${insertError.message}`)
    }
    
    return {
      session_id: sessionId,
      recipient_id: recipientId,
      summary_id: summaryId,
      total_comparisons: 3,
      completed_comparisons: 0,
      created_at: new Date().toISOString()
    }
  }
  
  /**
   * Gets comparison data for a specific order
   */
  async getComparisonData(sessionId: string, order: number): Promise<ComparisonData> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin not configured')
    }
    
    const { data: comparison, error } = await supabaseAdmin
      .from('feedback_comparisons')
      .select(`
        *,
        articles!inner(title, source, published_date)
      `)
      .eq('session_id', sessionId)
      .eq('comparison_order', order)
      .single()
    
    if (error || !comparison) {
      throw new Error('Comparison not found')
    }
    
    // Check if this is the last comparison
    const { count } = await supabaseAdmin
      .from('feedback_comparisons')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
    
    const isComplete = order >= (count || 0)
    
    return {
      session_id: sessionId,
      comparison_order: order,
      article: {
        id: comparison.article_id,
        title: comparison.articles.title,
        source: comparison.articles.source,
        published_date: comparison.articles.published_date
      },
      summary_a: {
        content: comparison.current_summary,
        model: comparison.current_model,
        label: 'Current Model'
      },
      summary_b: {
        content: comparison.advanced_summary,
        model: comparison.advanced_model,
        label: 'Advanced Model'
      },
      is_complete: isComplete
    }
  }
  
  /**
   * Records user preference and returns next comparison or completion status
   */
  async recordPreference(sessionId: string, order: number, preference: 'A' | 'B'): Promise<{ nextOrder?: number; isComplete: boolean }> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin not configured')
    }
    
    // Update the comparison record with user preference
    const { error: updateError } = await supabaseAdmin
      .from('feedback_comparisons')
      .update({ user_preference: preference })
      .eq('session_id', sessionId)
      .eq('comparison_order', order)
    
    if (updateError) {
      throw new Error(`Failed to record preference: ${updateError.message}`)
    }
    
    // Check if there are more comparisons
    const { count } = await supabaseAdmin
      .from('feedback_comparisons')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
    
    const totalComparisons = count || 0
    const nextOrder = order < totalComparisons ? order + 1 : undefined
    const isComplete = order >= totalComparisons
    
    return {
      nextOrder,
      isComplete
    }
  }
  
  /**
   * Gets summary of all comparisons in a session
   */
  async getSessionSummary(sessionId: string): Promise<SessionSummary> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin not configured')
    }
    
    const { data: comparisons, error } = await supabaseAdmin
      .from('feedback_comparisons')
      .select(`
        *,
        articles!inner(title)
      `)
      .eq('session_id', sessionId)
      .order('comparison_order')
    
    if (error || !comparisons) {
      throw new Error('Failed to fetch session summary')
    }
    
    const completedComparisons = comparisons.filter(c => c.user_preference)
    
    return {
      session_id: sessionId,
      recipient_id: comparisons[0]?.recipient_id || '',
      summary_id: comparisons[0]?.summary_id || '',
      comparisons: comparisons.map(c => ({
        comparison_order: c.comparison_order,
        article_title: c.articles.title,
        user_preference: c.user_preference as 'A' | 'B',
        selected_model: c.user_preference === 'A' ? c.current_model : c.advanced_model
      })),
      total_comparisons: comparisons.length,
      completed_comparisons: completedComparisons.length,
      created_at: comparisons[0]?.created_at || new Date().toISOString()
    }
  }
  
  /**
   * Generates individual summaries for articles (fallback method)
   */
  private async generateIndividualSummaries(articles: any[]): Promise<ArticleSummary[]> {
    const summaries: ArticleSummary[] = []
    
    for (const article of articles) {
      try {
        // Generate individual summary for this article
        const summary = await this.summaryGenerator.generateArticleSummary(article)
        
        summaries.push({
          article_id: article.id,
          title: article.title,
          source: article.source,
          published_date: article.published_date,
          summary: summary
        })
      } catch (error) {
        console.error(`Failed to generate summary for article ${article.id}:`, error)
      }
    }
    
    return summaries
  }
  
  /**
   * Generates advanced model summary for comparison
   */
  private async generateAdvancedSummary(articleId: string, model: string): Promise<string> {
    // Get article content
    const { data: article, error } = await supabaseAdmin!
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single()
    
    if (error || !article) {
      throw new Error('Article not found')
    }
    
    // Generate advanced summary using specified model
    const advancedSummary = await this.summaryGenerator.generateDailySummary([article])
    
    return advancedSummary
  }
}
