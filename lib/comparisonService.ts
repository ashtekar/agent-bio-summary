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
    console.log(`Starting createSession for recipientId: ${recipientId}, summaryId: ${summaryId}`)
    
    if (!supabaseAdmin) {
      console.error('Supabase admin not configured')
      throw new Error('Supabase admin not configured')
    }
    
    // Generate session ID
    const sessionId = crypto.randomUUID()
    console.log(`Generated session ID: ${sessionId}`)
    
    // Get system settings for comparison models
    console.log('Fetching system settings for comparison models')
    const { data: systemSettings, error: settingsError } = await supabaseAdmin
      .from('system_settings')
      .select('comparison_model, comparison_temperature, comparison_max_tokens, openai_model')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (settingsError) {
      console.error('Error fetching system settings:', settingsError)
      // Use defaults if settings fetch fails
      const defaultSettings = {
        comparison_model: 'gpt-4o',
        comparison_temperature: 0.5,
        comparison_max_tokens: 300,
        openai_model: 'gpt-4o-mini'
      }
      console.log('Using default settings:', defaultSettings)
    } else {
      console.log('Using system settings:', systemSettings)
    }
    
    const settings = systemSettings || {
      comparison_model: 'gpt-4o',
      comparison_temperature: 0.5,
      comparison_max_tokens: 300,
      openai_model: 'gpt-4o-mini'
    }
    
    // Get summary and articles data
    console.log(`Fetching summary data for summaryId: ${summaryId}`)
    const { data: summaryData, error: summaryError } = await supabaseAdmin
      .from('daily_summaries')
      .select('*')
      .eq('id', summaryId)
      .single()
    
    if (summaryError || !summaryData) {
      console.error('Summary fetch error:', summaryError)
      console.error('Summary data:', summaryData)
      throw new Error('Summary not found')
    }
    
    console.log(`Found summary data: ${summaryData.title || 'No title'}`)
    
    // Get articles for this summary
    console.log(`Fetching articles for article_ids: ${JSON.stringify(summaryData.article_ids || [])}`)
    const { data: articles, error: articlesError } = await supabaseAdmin
      .from('articles')
      .select('*')
      .in('id', summaryData.article_ids || [])
      .order('relevance_score', { ascending: false })
      .limit(10)
    
    if (articlesError || !articles) {
      console.error('Articles fetch error:', articlesError)
      console.error('Articles data:', articles)
      throw new Error('Articles not found')
    }
    
    console.log(`Found ${articles.length} articles`)
    
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
      const topArticles = articles.slice(0, Math.min(articles.length, 3)) // Use available articles (1-3)
      articleSummaries = await this.generateIndividualSummaries(topArticles)
    }
    
    // Ensure we have at least 1 article for comparison
    if (articleSummaries.length < 1) {
      throw new Error('Insufficient articles for comparison')
    }
    
    // Use all available articles (1-3) for comparison
    const articlesToCompare = articleSummaries.slice(0, Math.min(articleSummaries.length, 3))
    console.log(`Generating comparisons for ${articlesToCompare.length} articles`)
    
    const comparisonPromises = articlesToCompare.map(async (articleSummary, index) => {
      const order = index + 1
      console.log(`Generating comparison ${order} for article: ${articleSummary.title}`)
      
      // Generate advanced model summary for comparison
      const advancedSummary = await this.generateAdvancedSummary(
        articleSummary.article_id,
        settings.comparison_model, // Use model from database settings
        settings.comparison_temperature, // Use temperature from settings
        settings.comparison_max_tokens // Use max tokens from settings
      )
      
      return {
        session_id: sessionId,
        recipient_id: recipientId,
        summary_id: summaryId,
        article_id: articleSummary.article_id,
        current_summary: articleSummary.summary,
        advanced_summary: advancedSummary,
        current_model: settings.openai_model, // Current model from settings
        advanced_model: settings.comparison_model, // Advanced model from settings
        comparison_order: order,
        extraction_method: extractionMethod
      }
    })
    
    console.log('Waiting for all comparison promises to resolve...')
    const comparisonRecords = await Promise.all(comparisonPromises)
    console.log(`All comparison promises resolved. Created ${comparisonRecords.length} records`)
    
    console.log(`Creating ${comparisonRecords.length} comparison records for session ${sessionId}`)
    console.log('Comparison records to insert:', JSON.stringify(comparisonRecords, null, 2))
    
    // Insert all comparison records
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('feedback_comparisons')
      .insert(comparisonRecords)
      .select()
    
    if (insertError) {
      console.error('Failed to insert comparison records:', insertError)
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
      throw new Error(`Failed to create comparison records: ${insertError.message}`)
    }
    
    console.log(`Successfully inserted ${insertData?.length || 0} comparison records`)
    console.log('Inserted records:', JSON.stringify(insertData, null, 2))
    
    console.log('Session creation completed successfully')
    return {
      session_id: sessionId,
      recipient_id: recipientId,
      summary_id: summaryId,
      total_comparisons: articlesToCompare.length,
      completed_comparisons: 0,
      created_at: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('Error in createSession:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    throw error
  }
  
  /**
   * Gets comparison data for a specific order
   */
  async getComparisonData(sessionId: string, order: number): Promise<ComparisonData> {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin not configured')
    }
    
    console.log(`Getting comparison data for session ${sessionId}, order ${order}`)
    
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
      console.error('Failed to get comparison data:', error)
      console.error('Comparison error details:', {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint
      })
      throw new Error('Comparison not found')
    }
    
    console.log(`Found comparison data for session ${sessionId}, order ${order}`)
    console.log('Comparison data:', JSON.stringify({
      session_id: comparison.session_id,
      comparison_order: comparison.comparison_order,
      article_id: comparison.article_id,
      user_preference: comparison.user_preference,
      current_summary_length: comparison.current_summary?.length || 0,
      advanced_summary_length: comparison.advanced_summary?.length || 0
    }, null, 2))
    
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
    
    console.log(`Recording preference for session ${sessionId}, order ${order}, preference: ${preference}`)
    
    // Update the comparison record with user preference
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('feedback_comparisons')
      .update({ user_preference: preference })
      .eq('session_id', sessionId)
      .eq('comparison_order', order)
      .select()
    
    if (updateError) {
      console.error('Failed to update preference:', updateError)
      console.error('Update error details:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      })
      throw new Error(`Failed to record preference: ${updateError.message}`)
    }
    
    console.log(`Successfully updated preference for ${updateData?.length || 0} records`)
    console.log('Updated records:', JSON.stringify(updateData, null, 2))
    
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
    console.log(`Getting session summary for sessionId: ${sessionId}`)
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin not configured')
    }
    
    console.log(`Querying feedback_comparisons for session: ${sessionId}`)
    const { data: comparisons, error } = await supabaseAdmin
      .from('feedback_comparisons')
      .select(`
        *,
        articles!inner(title)
      `)
      .eq('session_id', sessionId)
      .order('comparison_order')
    
    console.log(`Query result:`, {
      comparisons_count: comparisons?.length || 0,
      error: error?.message || null
    })
    
    if (error) {
      console.error('Database error in getSessionSummary:', error)
      throw new Error(`Failed to fetch session summary: ${error.message}`)
    }
    
    if (!comparisons || comparisons.length === 0) {
      console.error(`No comparisons found for session: ${sessionId}`)
      throw new Error('No comparisons found for this session')
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
  private async generateAdvancedSummary(articleId: string, model: string, temperature?: number, maxTokens?: number): Promise<string> {
    try {
      console.log(`Generating advanced summary for article ${articleId} using model: ${model}`)
      
      // Get article content
      const { data: article, error } = await supabaseAdmin!
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single()
      
      if (error || !article) {
        throw new Error('Article not found')
      }
      
      console.log(`Found article: ${article.title}`)
      
      // Create a new SummaryGenerator instance with the specified model and settings
      const advancedSummaryGenerator = new SummaryGenerator(process.env.OPENAI_API_KEY || '', model)
      
      // Map database article to Article interface format
      const mappedArticle = {
        id: article.id,
        title: article.title,
        url: article.url,
        source: article.source,
        publishedDate: article.published_date,
        content: article.content,
        summary: article.content?.substring(0, 200) + '...' || '',
        relevanceScore: article.relevance_score,
        keywords: [] // Default empty array since database doesn't store keywords
      }
      
      console.log(`Mapped article content length: ${mappedArticle.content?.length || 0}`)
      
      // Generate advanced summary using specified model
      const advancedSummary = await advancedSummaryGenerator.generateArticleSummary(mappedArticle)
      
      console.log(`Generated advanced summary length: ${advancedSummary?.length || 0}`)
      
      if (!advancedSummary || advancedSummary.trim().length === 0) {
        throw new Error('Generated summary is empty')
      }
      
      return advancedSummary
    } catch (error) {
      console.error(`Error generating advanced summary for article ${articleId}:`, error)
      
      // Return a fallback summary if generation fails
      return `Summary generation failed for this article. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
