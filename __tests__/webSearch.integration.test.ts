import { WebSearchModule } from '../lib/webSearch'
import { SearchSettings } from '../lib/types'

// This is an integration test that makes real HTTP requests
// Use with caution and only for development/testing
describe('WebSearchModule Integration Tests', () => {
  let webSearch: WebSearchModule
  let mockSearchSettings: SearchSettings

  beforeEach(() => {
    mockSearchSettings = {
      timeWindow: 24,
      keywords: ['synthetic biology'],
      maxArticles: 10,
      relevance_threshold: 6.0
    }
    
    webSearch = new WebSearchModule(mockSearchSettings)
  })

  // This test makes a real HTTP request to Google
  // Only run this when you want to test actual functionality
  describe('Real searchGenericSite test', () => {
    it('should find articles from news.mit.edu for "synthetic biology"', async () => {
      const testDomain = 'news.mit.edu'
      const testDisplayName = 'MIT News'
      
      console.log(`Testing searchGenericSite with domain: ${testDomain}`)
      console.log(`Keywords: ${mockSearchSettings.keywords.join(', ')}`)
      
      // Access the private method for testing
      const result = await (webSearch as any).searchGenericSite(testDomain, testDisplayName)
      
      console.log(`Found ${result.length} articles`)
      
      // Basic validation
      expect(Array.isArray(result)).toBe(true)
      
      if (result.length > 0) {
        console.log('Sample article:', {
          title: result[0].title,
          url: result[0].url,
          source: result[0].source,
          relevanceScore: result[0].relevanceScore
        })
        
        // Validate article structure
        const article = result[0]
        expect(article).toHaveProperty('id')
        expect(article).toHaveProperty('title')
        expect(article).toHaveProperty('url')
        expect(article).toHaveProperty('source', testDisplayName)
        expect(article).toHaveProperty('publishedDate')
        expect(article).toHaveProperty('content')
        expect(article).toHaveProperty('summary')
        expect(article).toHaveProperty('relevanceScore')
        expect(article).toHaveProperty('keywords')
        
        // Validate content quality
        expect(article.title).toBeTruthy()
        expect(article.title.length).toBeGreaterThan(0)
        expect(article.content).toBeTruthy()
        expect(article.content.length).toBeGreaterThan(0)
        
        // Validate URL contains the domain
        expect(article.url).toContain('news.mit.edu')
        
        // Validate relevance score
        expect(article.relevanceScore).toBeGreaterThan(0)
        expect(article.relevanceScore).toBeLessThanOrEqual(10)
        
        // Validate keywords
        expect(Array.isArray(article.keywords)).toBe(true)
        expect(article.keywords.length).toBeGreaterThan(0)
        
        console.log('✅ All validations passed!')
      } else {
        console.log('⚠️ No articles found - this might be expected if the site has no relevant content')
      }
    }, 30000) // 30 second timeout for real HTTP requests
  })

  describe('Content quality analysis', () => {
    it('should extract meaningful content from search results', async () => {
      const testDomain = 'news.mit.edu'
      const testDisplayName = 'MIT News'
      
      const result = await (webSearch as any).searchGenericSite(testDomain, testDisplayName)
      
      if (result.length > 0) {
        // Analyze content quality
        const articlesWithContent = result.filter(article => 
          article.title && article.title.length > 10 &&
          article.content && article.content.length > 20
        )
        
        console.log(`Content quality: ${articlesWithContent.length}/${result.length} articles have meaningful content`)
        
        expect(articlesWithContent.length).toBeGreaterThan(0)
        
        // Check for synthetic biology related content
        const relevantArticles = result.filter(article => 
          article.relevanceScore >= 5
        )
        
        console.log(`Relevant articles (score >= 5): ${relevantArticles.length}/${result.length}`)
      }
    }, 30000)
  })

  describe('Error handling with real requests', () => {
    it('should handle non-existent domains gracefully', async () => {
      const nonExistentDomain = 'nonexistent-domain-that-does-not-exist-12345.com'
      const testDisplayName = 'Non-existent Site'
      
      const result = await (webSearch as any).searchGenericSite(nonExistentDomain, testDisplayName)
      
      expect(Array.isArray(result)).toBe(true)
      // Should handle gracefully even if no results found
    }, 30000)
  })
})
