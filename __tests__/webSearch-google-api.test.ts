import { WebSearchModule } from '../lib/webSearch'
import { SearchSettings } from '../lib/types'

describe('WebSearchModule with Google Custom Search API', () => {
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

  it('should find articles using Google Custom Search API', async () => {
    const testDomain = 'news.mit.edu'
    const testDisplayName = 'MIT News'
    
    console.log('🔍 Testing updated searchGenericSite with Google Custom Search API...')
    console.log('🔍 Domain:', testDomain)
    console.log('🔍 Keywords:', mockSearchSettings.keywords)
    
    // Access the private method for testing
    const result = await (webSearch as any).searchGenericSite(testDomain, testDisplayName)
    
    console.log(`✅ Found ${result.length} articles`)
    
    // Basic validation
    expect(Array.isArray(result)).toBe(true)
    
    if (result.length > 0) {
      console.log('✅ Sample article:', {
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
      console.log('✅ Google Custom Search API integration successful!')
    } else {
      console.log('⚠️ No articles found - this might indicate an issue')
      expect(result.length).toBeGreaterThan(0) // This should fail if no results
    }
  }, 30000)

  it('should test multiple domains', async () => {
    const testCases = [
      { domain: 'news.mit.edu', displayName: 'MIT News' },
      { domain: 'mit.edu', displayName: 'MIT' },
      { domain: 'pubmed.ncbi.nlm.nih.gov', displayName: 'PubMed' }
    ]
    
    for (const testCase of testCases) {
      console.log(`\n🔍 Testing domain: ${testCase.domain}`)
      
      const result = await (webSearch as any).searchGenericSite(testCase.domain, testCase.displayName)
      
      console.log(`   Found ${result.length} articles`)
      
      if (result.length > 0) {
        console.log(`   Sample: ${result[0].title}`)
      }
      
      // Basic validation
      expect(Array.isArray(result)).toBe(true)
      
      if (result.length > 0) {
        expect(result[0].source).toBe(testCase.displayName)
        expect(result[0].url).toContain(testCase.domain)
      }
    }
  }, 60000)
})
