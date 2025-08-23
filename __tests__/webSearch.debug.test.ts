import { WebSearchModule } from '../lib/webSearch'
import { SearchSettings } from '../lib/types'
import axios from 'axios'

describe('WebSearch Debug Test', () => {
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

  it('should debug the search URL and response', async () => {
    const testDomain = 'news.mit.edu'
    const testKeywords = ['synthetic biology']
    
    // Construct the search URL manually to see what it looks like
    const searchUrl = `https://www.google.com/search?q=site:${testDomain}+${encodeURIComponent(testKeywords.join(' '))}`
    
    console.log('🔍 Search URL:', searchUrl)
    console.log('🔍 Keywords:', testKeywords)
    console.log('🔍 Domain:', testDomain)
    
    try {
      // Make a direct request to see what we get
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 15000
      })
      
      console.log('✅ Response status:', response.status)
      console.log('✅ Response length:', response.data.length)
      console.log('✅ Response preview:', response.data.substring(0, 500))
      
      // Check if we got a captcha or blocked page
      if (response.data.includes('captcha') || response.data.includes('blocked')) {
        console.log('❌ Got captcha or blocked page')
      }
      
      // Check if we got search results
      if (response.data.includes('class="g"')) {
        console.log('✅ Found search results (.g class)')
      } else {
        console.log('❌ No search results found')
      }
      
      // Check for specific content
      if (response.data.includes('news.mit.edu')) {
        console.log('✅ Found news.mit.edu in response')
      } else {
        console.log('❌ No news.mit.edu found in response')
      }
      
    } catch (error) {
      console.log('❌ Request failed:', error.message)
      if (error.response) {
        console.log('❌ Response status:', error.response.status)
        console.log('❌ Response headers:', error.response.headers)
      }
    }
    
    // Now test our actual function
    console.log('\n🔍 Testing our searchGenericSite function...')
    
    const result = await (webSearch as any).searchGenericSite(testDomain, 'MIT News')
    console.log('🔍 Function result length:', result.length)
    
    if (result.length > 0) {
      console.log('🔍 First article:', {
        title: result[0].title,
        url: result[0].url,
        relevanceScore: result[0].relevanceScore
      })
    }
    
    expect(true).toBe(true) // Always pass for debug test
  }, 30000)
})
