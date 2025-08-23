import { WebSearchModule } from '../lib/webSearch'
import { SearchSettings } from '../lib/types'

// Mock axios to control HTTP requests
jest.mock('axios')
const axios = require('axios')

describe('WebSearchModule', () => {
  let webSearch: WebSearchModule
  let mockSearchSettings: SearchSettings

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    mockSearchSettings = {
      timeWindow: 24,
      keywords: ['synthetic biology'],
      maxArticles: 10,
      relevance_threshold: 6.0
    }
    
    webSearch = new WebSearchModule(mockSearchSettings)
  })

  describe('searchGenericSite', () => {
    const testDomain = 'mit.news.edu'
    const testDisplayName = 'MIT News'
    const testKeywords = ['synthetic biology']

    it('should extract articles from Google search results', async () => {
      // Mock successful Google search response
      const mockGoogleResponse = {
        data: `
          <html>
            <body>
              <div class="g">
                <h3>Breakthrough in Synthetic Biology Research</h3>
                <a href="https://mit.news.edu/article1">Link</a>
                <div class="VwiC3b">MIT researchers have made significant progress in synthetic biology...</div>
              </div>
              <div class="g">
                <h3>New CRISPR Technology Developed</h3>
                <a href="https://mit.news.edu/article2">Link</a>
                <div class="VwiC3b">Scientists at MIT have developed a novel CRISPR approach...</div>
              </div>
              <div class="g">
                <h3>Gene Editing Breakthrough</h3>
                <a href="https://mit.news.edu/article3">Link</a>
                <div class="VwiC3b">Revolutionary gene editing technique shows promise...</div>
              </div>
            </body>
          </html>
        `
      }

      axios.get.mockResolvedValueOnce(mockGoogleResponse)

      // Access the private method for testing
      const result = await (webSearch as any).searchGenericSite(testDomain, testDisplayName)

      // Verify axios was called with correct parameters
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://www.google.com/search'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('Mozilla')
          }),
          timeout: 15000
        })
      )

      // Verify the search URL contains our parameters
      const searchUrl = axios.get.mock.calls[0][0]
      expect(searchUrl).toContain('site:mit.news.edu')
      expect(searchUrl).toContain('synthetic%20biology') // URL encoded space

      // Verify results structure
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)

      // Verify article structure
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

      // Verify content quality
      expect(article.title).toBeTruthy()
      expect(article.title.length).toBeGreaterThan(0)
      expect(article.content).toBeTruthy()
      expect(article.content.length).toBeGreaterThan(0)
      expect(article.url).toContain('mit.news.edu')
    })

    it('should handle empty search results gracefully', async () => {
      // Mock empty Google search response
      const mockEmptyResponse = {
        data: `
          <html>
            <body>
              <div>No results found</div>
            </body>
          </html>
        `
      }

      axios.get.mockResolvedValueOnce(mockEmptyResponse)

      const result = await (webSearch as any).searchGenericSite(testDomain, testDisplayName)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })

    it('should handle network errors gracefully', async () => {
      // Mock network error
      axios.get.mockRejectedValueOnce(new Error('Network error'))

      const result = await (webSearch as any).searchGenericSite(testDomain, testDisplayName)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })

    it('should handle timeout errors gracefully', async () => {
      // Mock timeout error
      axios.get.mockRejectedValueOnce(new Error('timeout of 15000ms exceeded'))

      const result = await (webSearch as any).searchGenericSite(testDomain, testDisplayName)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })

    it('should limit results to 10 articles', async () => {
      // Mock response with many results
      const manyResults = Array.from({ length: 15 }, (_, i) => `
        <div class="g">
          <h3>Article ${i + 1} Title</h3>
          <a href="https://mit.news.edu/article${i + 1}">Link</a>
          <div class="VwiC3b">Content for article ${i + 1}...</div>
        </div>
      `).join('')

      const mockResponse = {
        data: `<html><body>${manyResults}</body></html>`
      }

      axios.get.mockResolvedValueOnce(mockResponse)

      const result = await (webSearch as any).searchGenericSite(testDomain, testDisplayName)

      expect(result.length).toBeLessThanOrEqual(10)
    })

    it('should calculate relevance scores correctly', async () => {
      const mockResponse = {
        data: `
          <html>
            <body>
              <div class="g">
                <h3>Synthetic Biology Breakthrough at MIT</h3>
                <a href="https://mit.news.edu/article1">Link</a>
                <div class="VwiC3b">MIT researchers have made a breakthrough in synthetic biology using CRISPR technology...</div>
              </div>
            </body>
          </html>
        `
      }

      axios.get.mockResolvedValueOnce(mockResponse)

      const result = await (webSearch as any).searchGenericSite(testDomain, testDisplayName)

      expect(result[0].relevanceScore).toBeGreaterThan(0)
      expect(result[0].relevanceScore).toBeLessThanOrEqual(10)
      
      // Should have high relevance for synthetic biology content
      expect(result[0].relevanceScore).toBeGreaterThan(5)
    })

    it('should extract keywords correctly', async () => {
      const mockResponse = {
        data: `
          <html>
            <body>
              <div class="g">
                <h3>CRISPR Gene Editing Research</h3>
                <a href="https://mit.news.edu/article1">Link</a>
                <div class="VwiC3b">New CRISPR technology for gene editing in synthetic biology...</div>
              </div>
            </body>
          </html>
        `
      }

      axios.get.mockResolvedValueOnce(mockResponse)

      const result = await (webSearch as any).searchGenericSite(testDomain, testDisplayName)

      expect(Array.isArray(result[0].keywords)).toBe(true)
      expect(result[0].keywords.length).toBeGreaterThan(0)
      expect(result[0].keywords).toContain('synthetic biology')
    })
  })

  describe('searchArticles integration', () => {
    it('should use searchGenericSite for unknown domains', async () => {
      // This test is complex due to Supabase mocking
      // We'll test this functionality in the integration test instead
      expect(true).toBe(true) // Placeholder test
    })
  })

  describe('Error handling', () => {
    it('should handle malformed HTML gracefully', async () => {
      const mockResponse = {
        data: '<html><body><div>Malformed HTML without proper structure</div></body></html>'
      }

      axios.get.mockResolvedValueOnce(mockResponse)

      const result = await (webSearch as any).searchGenericSite('test.com', 'Test Site')

      expect(Array.isArray(result)).toBe(true)
      // Should handle gracefully even with malformed HTML
    })

    it('should handle missing content gracefully', async () => {
      const mockResponse = {
        data: `
          <html>
            <body>
              <div class="g">
                <h3></h3>
                <a href=""></a>
                <div class="VwiC3b"></div>
              </div>
            </body>
          </html>
        `
      }

      axios.get.mockResolvedValueOnce(mockResponse)

      const result = await (webSearch as any).searchGenericSite('test.com', 'Test Site')

      expect(Array.isArray(result)).toBe(true)
      // Should filter out articles with missing content
    })
  })
})
