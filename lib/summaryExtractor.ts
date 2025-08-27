import { ArticleSummary } from './types'

export interface SummaryExtractor {
  extractSummaries(dailySummary: string): Promise<ArticleSummary[]>
  validateExtraction(summaries: ArticleSummary[]): boolean
}

export class DailySummaryExtractor implements SummaryExtractor {
  /**
   * Extracts individual article summaries from a daily summary
   * Uses regex patterns to identify and extract article-specific summaries
   */
  async extractSummaries(dailySummary: string): Promise<ArticleSummary[]> {
    const summaries: ArticleSummary[] = []
    
    // Pattern to match article titles and their summaries
    // Looks for patterns like "Title:" followed by content until next title or end
    const articlePattern = /([A-Z][^:]*?):\s*([^A-Z\n]*?)(?=\n[A-Z][^:]*?:|$)/gs
    
    let match
    while ((match = articlePattern.exec(dailySummary)) !== null) {
      const title = match[1].trim()
      const summary = match[2].trim()
      
      if (title && summary && summary.length > 20) {
        summaries.push({
          article_id: '', // Will be filled by caller
          title: title,
          source: '', // Will be filled by caller
          published_date: '', // Will be filled by caller
          summary: summary
        })
      }
    }
    
    // Fallback: try to extract from numbered lists
    if (summaries.length === 0) {
      const numberedPattern = /(\d+\.\s*)([^:]*?):\s*([^0-9\n]*?)(?=\n\d+\.|$)/gs
      while ((match = numberedPattern.exec(dailySummary)) !== null) {
        const title = match[2].trim()
        const summary = match[3].trim()
        
        if (title && summary && summary.length > 20) {
          summaries.push({
            article_id: '',
            title: title,
            source: '',
            published_date: '',
            summary: summary
          })
        }
      }
    }
    
    return summaries
  }
  
  /**
   * Validates that extracted summaries meet quality criteria
   */
  validateExtraction(summaries: ArticleSummary[]): boolean {
    if (summaries.length === 0) return false
    
    // Check if we have at least 3 summaries for comparison
    if (summaries.length < 3) return false
    
    // Validate each summary has sufficient content
    const validSummaries = summaries.filter(summary => 
      summary.title.length > 5 &&
      summary.summary.length > 50 &&
      summary.summary.length < 500
    )
    
    // Require at least 80% of summaries to be valid
    return validSummaries.length >= Math.ceil(summaries.length * 0.8)
  }
  
  /**
   * Maps extracted summaries to actual articles based on title similarity
   */
  mapToArticles(extractedSummaries: ArticleSummary[], articles: any[]): ArticleSummary[] {
    return extractedSummaries.map(extracted => {
      // Find best matching article by title similarity
      const bestMatch = articles.reduce((best, article) => {
        const similarity = this.calculateTitleSimilarity(extracted.title, article.title)
        return similarity > best.similarity ? { article, similarity } : best
      }, { article: null, similarity: 0 })
      
      if (bestMatch.article && bestMatch.similarity > 0.6) {
        return {
          ...extracted,
          article_id: bestMatch.article.id,
          source: bestMatch.article.source,
          published_date: bestMatch.article.published_date
        }
      }
      
      return extracted
    }).filter(summary => summary.article_id) // Only return mapped summaries
  }
  
  /**
   * Calculate similarity between two titles using simple string matching
   */
  private calculateTitleSimilarity(title1: string, title2: string): number {
    const words1 = title1.toLowerCase().split(/\s+/)
    const words2 = title2.toLowerCase().split(/\s+/)
    
    const commonWords = words1.filter(word => words2.includes(word))
    const totalWords = Math.max(words1.length, words2.length)
    
    return commonWords.length / totalWords
  }
}
